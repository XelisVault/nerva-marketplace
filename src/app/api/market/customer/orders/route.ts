import { NextResponse } from "next/server";
import { db } from "@/lib/mock-store";
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
  const orders = await db.order.findMany({
    where: { buyer: username },
    orderBy: { createdAt: "desc" },
  });

  const result = [];
  for (const order of orders) {
    const invoice = await db.invoice.findUnique({
      where: { invoiceId: order.invoiceId },
    });
    const shipping = await db.orderShipping.findUnique({
      where: { orderId: order.orderId },
    });
    result.push({
      order_id: order.orderId,
      create_time: order.createdAt.toISOString(),
      invoice_status: invoice?.status ?? "pending",
      shipping_status: shipping?.shippingStatus ?? "pending",
    });
  }
  return NextResponse.json(result);
}
