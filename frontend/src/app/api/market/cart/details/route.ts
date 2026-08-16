import { NextResponse } from "next/server";
import { getOrCreateCart } from "@/lib/mock-session";

/** GET /api/market/cart/details */
export async function GET() {
  const cart = await getOrCreateCart();
  if (!cart) {
    return NextResponse.json(
      { detail: "Not authenticated." },
      { status: 401 },
    );
  }
  return NextResponse.json(cart);
}
