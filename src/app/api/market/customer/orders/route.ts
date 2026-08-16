import { NextResponse } from "next/server";
import { getStore } from "@/lib/mock-store";
import { getSessionUsername } from "@/lib/mock-session";

/** GET /api/market/customer/orders */
export async function GET() {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json(
      { detail: "Not authenticated." },
      { status: 401 },
    );
  }
  const store = getStore();
  return NextResponse.json(
    store.orders.map((o) => ({
      order_id: o.order_id,
      create_time: o.create_time,
      invoice_status: o.invoice_status,
      shipping_status: o.shipping_status,
    })),
  );
}
