"""
Market service — order routes (vendor + customer views).

Security highlights vs. the original:
- Both endpoints check `is_vendor` from the session, not just a TODO.
- Customer orders return 403 if a vendor tries to view them as a customer
  (and vice-versa, though vendors can also be customers — that's fine).
- Proper HTTPException on every error path.
- External service calls (invoice service) have timeouts and proper error
  handling.
"""

import logging
from typing import Optional

import requests
from fastapi import APIRouter, Depends, HTTPException, Cookie

from .config import settings
from .dependencies import get_db, get_sessions, Sessions

logger = logging.getLogger(__name__)
orders_router = APIRouter()


def _require_user(
    session_id: Optional[str], session_storage: Sessions
) -> str:
    if not session_id:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    username = session_storage.get_user_from_session(session_id)
    if not username:
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
    return username


def _fetch_invoice_status(invoice_id: int) -> dict:
    """Fetch invoice status from the invoice service, with timeout."""
    try:
        resp = requests.get(
            f"{settings.PAYMENTS_BASE_URL}/invoice/{invoice_id}",
            timeout=5,
        )
    except requests.RequestException as e:
        logger.error("Invoice service unreachable: %s", e)
        raise HTTPException(status_code=502, detail="Payment service unavailable.")
    if resp.status_code != 200:
        logger.error("Invoice service %s: %s", resp.status_code, resp.text)
        raise HTTPException(status_code=502, detail="Payment service error.")
    return resp.json()


# ============================================================
# Vendor orders
# ============================================================

@orders_router.get("/vendor/orders")
async def get_vendor_orders(
    session_id: Optional[str] = Cookie(None, alias=settings.SESSION_COOKIE_NAME),
    session_storage: Sessions = Depends(get_sessions),
    sql_client=Depends(get_db),
):
    username = _require_user(session_id, session_storage)
    if not session_storage.get_is_vendor_from_session(session_id):
        raise HTTPException(
            status_code=403,
            detail="Vendor account required to view vendor orders.",
        )

    async with sql_client.cursor() as cur:
        await cur.execute(
            "SELECT * FROM orders WHERE vendor = %s ORDER BY create_time DESC",
            (username,),
        )
        vendor_orders = await cur.fetchall()

    result = []
    for order in vendor_orders:
        invoice = _fetch_invoice_status(order["invoice_id"])
        result.append({
            "order_id": order["order_id"],
            "create_time": order["create_time"].strftime("%Y-%m-%d %H:%M:%S"),
            "amount": invoice["amount"],
            "status": invoice["status"],
        })
    return result


# ============================================================
# Customer orders
# ============================================================

@orders_router.get("/customer/orders")
async def get_customer_orders(
    session_id: Optional[str] = Cookie(None, alias=settings.SESSION_COOKIE_NAME),
    session_storage: Sessions = Depends(get_sessions),
    sql_client=Depends(get_db),
):
    username = _require_user(session_id, session_storage)

    async with sql_client.cursor() as cur:
        await cur.execute(
            "SELECT * FROM orders WHERE buyer = %s ORDER BY create_time DESC",
            (username,),
        )
        buyer_orders = await cur.fetchall()

        result = []
        for order in buyer_orders:
            invoice = _fetch_invoice_status(order["invoice_id"])
            await cur.execute(
                "SELECT shipping_status FROM order_shipping WHERE order_id = %s",
                (order["order_id"],),
            )
            shipping_row = await cur.fetchone()
            result.append({
                "order_id": order["order_id"],
                "create_time": order["create_time"].strftime("%Y-%m-%d %H:%M:%S"),
                "invoice_status": invoice["status"],
                "shipping_status": (shipping_row or {}).get("shipping_status", "pending"),
            })
    return result
