"""
Market service — cart routes.

Security highlights vs. the original:
- Auth required for every endpoint (no silent 401 -> empty cart).
- Vendor cannot buy their own listing (prevents self-checkout abuse).
- All error paths raise HTTPException (no more `return 300`, `return 505`,
  `return 600`).
- `remove_item` endpoint added (the original cart remove button was a no-op).
- Checkout validates stock + vendor consistency before creating an invoice.
"""

import logging
from typing import Optional

import requests
from pydantic import BaseModel, field_validator
from fastapi import APIRouter, Depends, HTTPException, Cookie

from .config import settings
from .dependencies import get_db, get_sessions, Sessions

logger = logging.getLogger(__name__)
cart_router = APIRouter()


def _require_session(session_id: Optional[str], session_storage: Sessions) -> str:
    """Return the username, or raise 401."""
    if not session_id:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    username = session_storage.get_user_from_session(session_id)
    if not username:
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
    return username


# ============================================================
# Cart details
# ============================================================

@cart_router.get("/cart/details")
async def get_cart_details(
    session_id: Optional[str] = Cookie(None, alias=settings.SESSION_COOKIE_NAME),
    session_storage: Sessions = Depends(get_sessions),
):
    _require_session(session_id, session_storage)
    cart = session_storage.get_cart_from_session(session_id)
    if not cart:
        # Return an empty cart rather than 422 — the frontend expects a cart
        # object even when there's nothing in it.
        return {"cart_id": None, "items": []}
    return cart


# ============================================================
# Add / remove items
# ============================================================

@cart_router.post("/cart/add_item/{listing_id}")
async def add_item_to_cart(
    listing_id: int,
    session_id: Optional[str] = Cookie(None, alias=settings.SESSION_COOKIE_NAME),
    session_storage: Sessions = Depends(get_sessions),
    rds_client=Depends(get_db),
):
    username = _require_session(session_id, session_storage)

    # Verify the listing exists + is in stock + isn't owned by this user.
    async with rds_client.cursor() as cur:
        await cur.execute(
            "SELECT vendor, quantity_available FROM listings WHERE listing_id = %s",
            (listing_id,),
        )
        listing = await cur.fetchone()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found.")
    if listing["vendor"] == username:
        raise HTTPException(status_code=400, detail="You cannot buy your own listing.")
    if listing["quantity_available"] <= 0:
        raise HTTPException(status_code=409, detail="Listing is out of stock.")

    session_storage.add_item_to_session_cart(session_id, listing_id)
    return {"ok": True, "items": len(session_storage.get_cart_from_session(session_id)["items"])}


@cart_router.post("/cart/remove_item/{listing_id}")
async def remove_item_from_cart(
    listing_id: int,
    session_id: Optional[str] = Cookie(None, alias=settings.SESSION_COOKIE_NAME),
    session_storage: Sessions = Depends(get_sessions),
):
    _require_session(session_id, session_storage)
    session_storage.remove_item_from_session_cart(session_id, listing_id)
    cart = session_storage.get_cart_from_session(session_id)
    return {"ok": True, "items": len(cart["items"]) if cart else 0}


# ============================================================
# Shipping details
# ============================================================

class ShippingDetails(BaseModel):
    details: str

    @field_validator("details")
    @classmethod
    def non_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Shipping details cannot be empty.")
        if len(v) > 4096:
            raise ValueError("Shipping details too long (max 4096 chars).")
        return v


@cart_router.post("/cart/shipping_details/add")
async def add_shipping_details(
    body: ShippingDetails,
    session_id: Optional[str] = Cookie(None, alias=settings.SESSION_COOKIE_NAME),
    session_storage: Sessions = Depends(get_sessions),
):
    _require_session(session_id, session_storage)
    session_storage.update_cart_shipping_data(session_id, body.details)
    return {"status": "ok"}


# ============================================================
# Checkout
# ============================================================

@cart_router.post("/cart/checkout")
async def checkout(
    session_id: Optional[str] = Cookie(None, alias=settings.SESSION_COOKIE_NAME),
    session_storage: Sessions = Depends(get_sessions),
    sql_client=Depends(get_db),
):
    buyer_username = _require_session(session_id, session_storage)
    cart = session_storage.get_cart_from_session(session_id)
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=422, detail="Cart is empty.")

    shipping_data = cart.get("shipping_data")
    if not shipping_data:
        raise HTTPException(
            status_code=422,
            detail="Shipping details are required before checkout.",
        )

    # Compute total and validate every item.
    cart_total = 0.0
    vendor_username = None
    async with sql_client.cursor() as cur:
        for item_id in cart["items"]:
            await cur.execute(
                "SELECT vendor, price_xnv, quantity_available FROM listings WHERE listing_id = %s",
                (item_id,),
            )
            listing = await cur.fetchone()
            if not listing:
                raise HTTPException(
                    status_code=422,
                    detail=f"Listing {item_id} no longer exists.",
                )
            if listing["vendor"] == buyer_username:
                raise HTTPException(
                    status_code=400,
                    detail="You cannot buy your own listing.",
                )
            if int(listing["quantity_available"]) <= 0:
                raise HTTPException(
                    status_code=409,
                    detail=f"Listing {item_id} is out of stock.",
                )
            cart_total += float(listing["price_xnv"])
            # All items in a single order must come from the same vendor.
            if not vendor_username:
                vendor_username = listing["vendor"]
            elif vendor_username != listing["vendor"]:
                raise HTTPException(
                    status_code=422,
                    detail="All items in a cart must be from the same vendor.",
                )

    # Create the invoice via the invoice service.
    try:
        resp = requests.post(
            f"{settings.PAYMENTS_BASE_URL}/invoice/create",
            json={"amount": cart_total},
            timeout=10,
        )
    except requests.RequestException as e:
        logger.error("Invoice service unreachable: %s", e)
        raise HTTPException(status_code=502, detail="Payment service unavailable.")
    if resp.status_code != 200:
        logger.error("Invoice service error %s: %s", resp.status_code, resp.text)
        raise HTTPException(status_code=502, detail="Payment service error.")

    invoice_data = resp.json()
    invoice_id = invoice_data["invoice_id"]

    # Persist the order in MySQL.
    async with sql_client.cursor() as cur:
        await cur.execute(
            "INSERT INTO orders (vendor, buyer, invoice_id) VALUES (%s, %s, %s)",
            (vendor_username, buyer_username, invoice_id),
        )
        order_id = cur.lastrowid
        for item_id in cart["items"]:
            await cur.execute(
                "INSERT INTO order_items (order_id, item_listing_id) VALUES (%s, %s)",
                (order_id, item_id),
            )
        await cur.execute(
            "INSERT INTO order_shipping (order_id, shipping_note) VALUES (%s, %s)",
            (order_id, shipping_data),
        )
        # Decrement stock atomically.
        await cur.execute(
            """
            UPDATE listings
            SET quantity_available = quantity_available - 1
            WHERE listing_id IN (
                SELECT item_listing_id FROM order_items WHERE order_id = %s
            )
            """,
            (order_id,),
        )

    # Clear the cart.
    session_storage.clear_cart(session_id)

    logger.info(
        "Order %s created: buyer=%s vendor=%s invoice=%s total=%s",
        order_id, buyer_username, vendor_username, invoice_id, cart_total,
    )
    return {"invoice_id": invoice_id, "address": invoice_data["address"]}
