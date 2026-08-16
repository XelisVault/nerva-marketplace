"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listingApi } from "@/lib/api-client";
import type { Listing } from "@/types";
import { ListingsGrid } from "@/components/marketplace/listings-grid";
import { LoadingState } from "@/components/common/loading-states";
import { Button } from "@/components/ui/button";
import { useAuth, useIsVendor } from "@/lib/auth";
import { PlusCircle } from "lucide-react";

export default function HomePage() {
  const { user, authChecked } = useAuth();
  const isVendor = useIsVendor();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listingApi
      .list()
      .then((data) => {
        setListings(data ?? []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[home] failed to load listings:", err);
        setError(err instanceof Error ? err.message : "Failed to load listings");
        setLoading(false);
      });
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Marketplace</h1>
        {isVendor && (
          <Button asChild size="sm">
            <Link href="/create-listing">
              <PlusCircle className="mr-1.5 h-4 w-4" />
              New Listing
            </Link>
          </Button>
        )}
      </div>

      {loading ? (
        <LoadingState label="Loading listings..." />
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          {error}
        </div>
      ) : (
        <ListingsGrid
          listings={listings}
          emptyMessage={
            authChecked && !user
              ? "No listings yet. Sign in to create the first one."
              : "No listings yet. Be the first to sell on NERVA Market."
          }
        />
      )}
    </div>
  );
}
