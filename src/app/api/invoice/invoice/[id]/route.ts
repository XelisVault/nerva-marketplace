import { NextResponse } from "next/server";
import { db } from "@/lib/mock-store";

/** GET /api/invoice/invoice/[id] */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const invoiceId = parseInt(id, 10);
  if (Number.isNaN(invoiceId)) {
    return NextResponse.json(
      { detail: "Invalid invoice id." },
      { status: 400 },
    );
  }
  const invoice = await db.invoice.findUnique({
    where: { invoiceId },
  });
  if (!invoice) {
    return NextResponse.json(
      { detail: "Invoice not found." },
      { status: 404 },
    );
  }
  return NextResponse.json({
    invoice_id: invoice.invoiceId,
    amount: invoice.amount,
    address: invoice.address,
    status: invoice.status,
    create_time: invoice.createdAt.toISOString(),
  });
}
