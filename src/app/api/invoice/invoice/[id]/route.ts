import { NextResponse } from "next/server";
import { getStore } from "@/lib/mock-store";

/** GET /api/invoice/invoice/[id] */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const store = getStore();
  const invoice = store.invoices.get(parseInt(id, 10));
  if (!invoice) {
    return NextResponse.json(
      { detail: "Invoice not found." },
      { status: 404 },
    );
  }
  return NextResponse.json({
    invoice_id: invoice.invoice_id,
    amount: invoice.amount,
    address: invoice.address,
    status: invoice.status,
    create_time: invoice.create_time,
  });
}
