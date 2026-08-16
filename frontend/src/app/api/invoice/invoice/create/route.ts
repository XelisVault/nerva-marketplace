import { NextResponse } from "next/server";
import { getStore } from "@/lib/mock-store";
import { v4 as uuidv4 } from "uuid";

/** POST /api/invoice/invoice/create  body: { amount } */
export async function POST(req: Request) {
  const { amount } = await req.json().catch(() => ({}));
  if (typeof amount !== "number" || amount <= 0) {
    return NextResponse.json(
      { detail: "amount (positive number) is required." },
      { status: 422 },
    );
  }
  const store = getStore();
  const invoiceId = store.nextInvoiceId++;
  const address = `NV${uuidv4().replace(/-/g, "").slice(0, 60)}`;
  store.invoices.set(invoiceId, {
    invoice_id: invoiceId,
    amount,
    address,
    status: "pending",
    create_time: new Date().toISOString(),
  });
  return NextResponse.json({ invoice_id: invoiceId, address });
}
