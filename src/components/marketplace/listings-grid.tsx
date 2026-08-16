"use client";

import type { Listing } from "@/types";
import { ListingCard } from "./listing-card";

interface ListingsGridProps {
  listings: Listing[];
  emptyMessage?: string;
}

export function ListingsGrid({
  listings,
  emptyMessage = "No listings yet. Be the first to sell on NERVA Market!",
}: ListingsGridProps) {
  if (listings.length === 0) {
    return (
      <div className="border-border/60 text-muted-foreground rounded-lg border border-dashed py-16 text-center">
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {listings.map((listing, i) => (
        <ListingCard
          key={listing.listing_id}
          listing={listing}
          priority={i < 4}
        />
      ))}
    </div>
  );
}
