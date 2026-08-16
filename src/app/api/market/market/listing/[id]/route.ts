import { NextResponse } from "next/server";
import { getStore } from "@/lib/mock-store";

/** GET /api/market/market/listing/[id] */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const store = getStore();
  const listing = store.listings.get(parseInt(id, 10));
  if (!listing) {
    return NextResponse.json(
      { detail: "Listing not found." },
      { status: 404 },
    );
  }
  return NextResponse.json(listing);
}
