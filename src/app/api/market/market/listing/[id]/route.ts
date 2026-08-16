import { NextResponse } from "next/server";
import { db } from "@/lib/mock-store";

/** GET /api/market/market/listing/[id] */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const listingId = parseInt(id, 10);
  if (Number.isNaN(listingId)) {
    return NextResponse.json(
      { detail: "Invalid listing id." },
      { status: 400 },
    );
  }
  const listing = await db.listing.findUnique({
    where: { listingId },
  });
  if (!listing) {
    return NextResponse.json(
      { detail: "Listing not found." },
      { status: 404 },
    );
  }
  return NextResponse.json({
    listing_id: listing.listingId,
    vendor: listing.vendor,
    title: listing.title,
    description: listing.description,
    image_name: listing.imageName,
    price_xnv: listing.priceXnv,
    quantity_available: listing.quantityAvailable,
    payment_address: listing.paymentAddress,
    create_time: listing.createdAt.toISOString(),
  });
}
