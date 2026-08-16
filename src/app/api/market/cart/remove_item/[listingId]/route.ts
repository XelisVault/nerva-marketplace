import { NextResponse } from "next/server";
import { getOrCreateCart, saveCart } from "@/lib/mock-session";

/** POST /api/market/cart/remove_item/[listingId] */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ listingId: string }> },
) {
  const { listingId } = await params;
  const id = parseInt(listingId, 10);
  const cart = await getOrCreateCart();
  if (!cart) {
    return NextResponse.json(
      { detail: "Not authenticated." },
      { status: 401 },
    );
  }
  cart.items = cart.items.filter((i) => i !== id);
  await saveCart(cart);
  return NextResponse.json({ ok: true, items: cart.items.length });
}
