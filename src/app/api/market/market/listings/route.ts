import { NextResponse } from "next/server";
import { db } from "@/lib/mock-store";

/** GET /api/market/market/listings — returns all listings, newest first. */
export async function GET() {
  const listings = await db.listing.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  // Map Prisma field names to the API field names the frontend expects.
  return NextResponse.json(
    listings.map((l) => ({
      listing_id: l.listingId,
      vendor: l.vendor,
      title: l.title,
      description: l.description,
      image_name: l.imageName,
      price_xnv: l.priceXnv,
      quantity_available: l.quantityAvailable,
      payment_address: l.paymentAddress,
      create_time: l.createdAt.toISOString(),
    })),
  );
}
