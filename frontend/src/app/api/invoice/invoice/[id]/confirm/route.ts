import { NextResponse } from "next/server";
import { db } from "@/lib/mock-store";

/**
 * POST /api/invoice/invoice/[id]/confirm
 *
 * In production, the invoice status is updated by `process_new_tx.py`
 * when nerva-wallet-rpc detects a transaction. In dev/preview mode
 * (no Python backend), this endpoint lets the mock simulate a payment
 * confirmation so the order flow works end-to-end.
 *
 * The frontend's invoice page calls this endpoint after the simulated
 * payment delay. Once the invoice is marked "confirmed" in the DB,
 * the order is considered paid and the vendor sees it in their orders.
 */
export async function POST(
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

  if (invoice.status === "confirmed") {
    return NextResponse.json({ status: "already_confirmed", invoice });
  }

  // Mark as confirmed.
  const updated = await db.invoice.update({
    where: { invoiceId },
    data: { status: "confirmed" },
  });

  return NextResponse.json({
    status: "confirmed",
    invoice: {
      invoice_id: updated.invoiceId,
      amount: updated.amount,
      address: updated.address,
      status: updated.status,
      create_time: updated.createdAt.toISOString(),
    },
  });
}
