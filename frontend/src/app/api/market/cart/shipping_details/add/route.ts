import { NextResponse } from "next/server";
import { getOrCreateCart, saveCart } from "@/lib/mock-session";

/** POST /api/market/cart/shipping_details/add  body: { details } */
export async function POST(req: Request) {
  const { details } = await req.json().catch(() => ({}));
  if (!details || typeof details !== "string" || !details.trim()) {
    return NextResponse.json(
      { detail: "Shipping details are required." },
      { status: 422 },
    );
  }
  const cart = await getOrCreateCart();
  if (!cart) {
    return NextResponse.json(
      { detail: "Not authenticated." },
      { status: 401 },
    );
  }
  cart.shipping_data = details.trim();
  await saveCart(cart);
  return new NextResponse(null, { status: 200 });
}
