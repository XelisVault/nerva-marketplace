"use client";

import Link from "next/link";
import { memo } from "react";
import type { Listing } from "@/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { NervaBadge } from "./nerva-badge";
import { ImageWithFallback } from "./image-with-fallback";
import { listingImageUrl } from "@/lib/config";
import { Package } from "lucide-react";
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
    >
      <Card
        className={cn(
          "h-full overflow-hidden py-0 transition-shadow hover:shadow-md",
          soldOut && "opacity-60",
        )}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-muted/30">
          <ImageWithFallback
            src={listingImageUrl(listing.image_name)}
            alt={listing.title}
            priority={priority}
          />
          {soldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <span className="rounded-full bg-destructive px-3 py-1 text-xs font-semibold text-destructive-foreground">
                Sold out
              </span>
            </div>
          )}
          <div className="absolute right-2 top-2">
            <NervaBadge price={listing.price_xnv} size="sm" className="shadow-sm" />
          </div>
        </div>

        <CardContent className="p-3">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight">
            {listing.title}
          </h3>
        </CardContent>

        <CardFooter className="border-t px-3 py-2">
          <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Package className="h-3 w-3" />
              {listing.vendor}
            </span>
            <span className={cn("font-medium", soldOut ? "text-muted-foreground" : "text-foreground")}>
              {soldOut ? "-" : `${listing.quantity_available} in stock`}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}

export const ListingCard = memo(ListingCardImpl);
export { formatXnv };
