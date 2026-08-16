import { NextResponse } from "next/server";
import { getStore } from "@/lib/mock-store";

/** GET /api/market/market/listings — returns up to 20 listings. */
export async function GET() {
  const store = getStore();
  const all = Array.from(store.listings.values());
  // Sort newest first.
  all.sort(
    (a, b) =>
      new Date(b.create_time ?? 0).getTime() -
      new Date(a.create_time ?? 0).getTime(),
  );
  return NextResponse.json(all.slice(0, 20));
}
