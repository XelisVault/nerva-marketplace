import { NextResponse } from "next/server";
import { getOrCreateCart, saveCart } from "@/lib/mock-session";

/** POST /api/market/cart/add_item/[listingId] */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ listingId: string }> },
) {
  const { listingId } = await params;
  const id = parseInt(listingId, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json(
      { detail: "Invalid listing id." },
      { status: 400 },
    );
  }
  const cart = await getOrCreateCart();
  if (!cart) {
    return NextResponse.json(
      { detail: "Not authenticated." },
      { status: 401 },
    );
  }
  if (!cart.items.includes(id)) {
    cart.items.push(id);
    await saveCart(cart);
  }
  return NextResponse.json({ ok: true, items: cart.items.length });
}
