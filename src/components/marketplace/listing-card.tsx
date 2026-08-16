"use client";

import Link from "next/link";
import { memo } from "react";
import type { Listing } from "@/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { NervaBadge, formatXnv } from "./nerva-badge";
import { ImageWithFallback } from "./image-with-fallback";
import { listingImageUrl } from "@/lib/config";
import { Package } from "@/components/icons";
import { cn } from "@/lib/utils";

interface ListingCardProps {
  listing: Listing;
  priority?: boolean;
}

function ListingCardImpl({ listing, priority }: ListingCardProps) {
  const soldOut = listing.quantity_available <= 0;

  return (
    <Link
      href={`/listing/${listing.listing_id}`}
      className="group block h-full"
      aria-label={`View ${listing.title}`}
    >
      <Card
        className={cn(
          "h-full overflow-hidden py-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
          soldOut && "opacity-60",
        )}
      >
        <div className="bg-muted/30 relative aspect-[4/3] overflow-hidden">
          <ImageWithFallback
            src={listingImageUrl(listing.image_name)}
            alt={listing.title}
            priority={priority}
          />
          {soldOut && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <span className="bg-destructive text-destructive-foreground rounded-full px-3 py-1 text-xs font-semibold">
                Sold out
              </span>
            </div>
          )}
          <div className="absolute right-2 top-2">
            <NervaBadge price={listing.price_xnv} size="sm" className="shadow-sm" />
          </div>
        </div>

        <CardContent className="p-4">
          <h3 className="text-foreground line-clamp-2 min-h-[2.75rem] text-sm font-semibold leading-tight">
            {listing.title}
          </h3>
          <p className="text-muted-foreground mt-1.5 line-clamp-2 text-xs">
            {listing.description}
          </p>
        </CardContent>

        <CardFooter className="border-t px-4 py-2.5">
          <div className="flex w-full items-center justify-between text-xs">
            <span className="text-muted-foreground inline-flex items-center gap-1">
              <Package className="h-3 w-3" />
              {listing.vendor}
            </span>
            <span
              className={cn(
                "font-medium",
                soldOut
                  ? "text-muted-foreground"
                  : "text-foreground",
              )}
            >
              {soldOut ? "—" : `${listing.quantity_available} in stock`}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}

export const ListingCard = memo(ListingCardImpl);
export { formatXnv };
