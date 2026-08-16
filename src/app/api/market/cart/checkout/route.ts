import { NextResponse } from "next/server";
import { getOrCreateCart, clearCart, getSessionUsername, getCurrentUser } from "@/lib/mock-session";
import { getStore } from "@/lib/mock-store";
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

  const store = getStore();
  const username = await getSessionUsername();
  const user = await getCurrentUser();
  if (!username || !user) {
    return NextResponse.json(
      { detail: "Not authenticated." },
      { status: 401 },
    );
  }

  // Compute total and validate all items exist & are in stock.
  let total = 0;
  let vendor: string | null = null;
  for (const itemId of cart.items) {
    const listing = store.listings.get(itemId);
    if (!listing) {
      return NextResponse.json(
        { detail: `Listing ${itemId} no longer exists.` },
        { status: 422 },
      );
    }
    if (listing.quantity_available <= 0) {
      return NextResponse.json(
        { detail: `"${listing.title}" is out of stock.` },
        { status: 422 },
      );
    }
    if (!vendor) vendor = listing.vendor;
    else if (vendor !== listing.vendor) {
      return NextResponse.json(
        { detail: "All items in a cart must be from the same vendor." },
        { status: 422 },
      );
    }
    total += listing.price_xnv;
  }

  // Create the invoice.
  const invoiceId = store.nextInvoiceId++;
  const address = `NV${uuidv4().replace(/-/g, "").slice(0, 60)}`;
  store.invoices.set(invoiceId, {
    invoice_id: invoiceId,
    amount: total,
    address,
    status: "pending",
    create_time: new Date().toISOString(),
  });

  // Create the order.
  const orderId = store.nextOrderId++;
  store.orders.push({
    order_id: orderId,
    create_time: new Date().toISOString(),
    amount: total,
    status: "pending",
    invoice_status: "pending",
    shipping_status: "pending",
  });
  // Track which invoice belongs to which order.
  const inv = store.invoices.get(invoiceId)!;
  (inv as { order_id?: number }).order_id = orderId;

  // Decrement quantities.
  for (const itemId of cart.items) {
    const listing = store.listings.get(itemId);
    if (listing) listing.quantity_available -= 1;
  }

  await clearCart();

  return NextResponse.json({ invoice_id: invoiceId, address });
}
