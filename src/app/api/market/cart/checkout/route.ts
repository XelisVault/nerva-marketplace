import { NextResponse } from "next/server";
import { db } from "@/lib/mock-store";
import { getCurrentUser, getSessionUsername, getOrCreateCart, clearCart } from "@/lib/mock-session";
import { v4 as uuidv4 } from "uuid";

/** POST /api/market/cart/checkout — creates an invoice and an order. */
export async function POST() {
  const cart = await getOrCreateCart();
  if (!cart) {
    return NextResponse.json(
      { detail: "Not authenticated." },
      { status: 401 },
    );
  }
  if (!cart.items?.length) {
    return NextResponse.json(
      { detail: "Cart is empty." },
      { status: 422 },
    );
  }
  if (!cart.shipping_data) {
    return NextResponse.json(
      { detail: "Shipping details are required." },
      { status: 422 },
    );
  }

  const username = await getSessionUsername();
  const user = await getCurrentUser();
  if (!username || !user) {
    return NextResponse.json(
      { detail: "Not authenticated." },
      { status: 401 },
    );
  }

  // Fetch all listing details from DB.
  const listings = await db.listing.findMany({
    where: { listingId: { in: cart.items } },
  });

  // Compute total and validate all items exist & are in stock.
  let total = 0;
  let vendor: string | null = null;
  let paymentAddress: string | null = null;
  for (const itemId of cart.items) {
    const listing = listings.find((l) => l.listingId === itemId);
    if (!listing) {
      return NextResponse.json(
        { detail: `Listing ${itemId} no longer exists.` },
        { status: 422 },
      );
    }
    if (listing.quantityAvailable <= 0) {
      return NextResponse.json(
        { detail: `"${listing.title}" is out of stock.` },
        { status: 422 },
      );
    }
    if (listing.vendor === username) {
      return NextResponse.json(
        { detail: "You cannot buy your own listing." },
        { status: 422 },
      );
    }
    if (!vendor) {
      vendor = listing.vendor;
      paymentAddress = listing.paymentAddress;
    } else if (vendor !== listing.vendor) {
      return NextResponse.json(
        { detail: "All items in a cart must be from the same vendor." },
        { status: 422 },
      );
    }
    total += listing.priceXnv;
  }

  if (!paymentAddress) {
    return NextResponse.json(
      { detail: "Vendor payment address not found." },
      { status: 500 },
    );
  }

  // Create the invoice.
  // In production with the Python backend: the invoice_service calls
  // nerva-wallet-rpc to generate a subaddress. In mock mode, we use the
  // vendor's own payment address directly (non-custodial model).
  const invoice = await db.invoice.create({
    data: {
      amount: total,
      address: paymentAddress,
      status: "pending",
    },
  });

  // Create the order.
  const order = await db.order.create({
    data: {
      vendor: vendor!,
      buyer: username,
      invoiceId: invoice.invoiceId,
    },
  });

  // Create order items.
  for (const itemId of cart.items) {
    await db.orderItem.create({
      data: {
        orderId: order.orderId,
        itemListingId: itemId,
      },
    });
  }

  // Create shipping record.
  await db.orderShipping.create({
    data: {
      orderId: order.orderId,
      shippingNote: cart.shipping_data,
      shippingStatus: "pending",
    },
  });

  // Decrement quantities.
  for (const itemId of cart.items) {
    const listing = listings.find((l) => l.listingId === itemId);
    if (listing) {
      await db.listing.update({
        where: { listingId: itemId },
        data: { quantityAvailable: { decrement: 1 } },
      });
    }
  }

  await clearCart();

  return NextResponse.json({
    invoice_id: invoice.invoiceId,
    address: invoice.address,
  });
}
