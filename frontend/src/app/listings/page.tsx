"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listingApi } from "@/lib/api-client";
import type { Listing } from "@/types";
import { ListingsGrid } from "@/components/marketplace/listings-grid";
import { LoadingState } from "@/components/common/loading-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Search } from "lucide-react";
import { useAuth } from "@/lib/auth";

type SortKey = "newest" | "price-asc" | "price-desc" | "name-asc";

export default function ListingsPage() {
  const { user } = useAuth();
  const [all, setAll] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");

  useEffect(() => {
    listingApi
      .list()
      .then((data) => {
        setAll(data ?? []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load listings");
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = q
      ? all.filter(
          (l) =>
            l.title.toLowerCase().includes(q) ||
            l.description.toLowerCase().includes(q) ||
            l.vendor.toLowerCase().includes(q),
        )
      : [...all];

    switch (sort) {
      case "price-asc":
        list.sort((a, b) => a.price_xnv - b.price_xnv);
        break;
      case "price-desc":
        list.sort((a, b) => b.price_xnv - a.price_xnv);
        break;
      case "name-asc":
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "newest":
      default:
        list.sort(
          (a, b) =>
            new Date(b.create_time ?? 0).getTime() -
            new Date(a.create_time ?? 0).getTime(),
        );
        break;
    }
    return list;
  }, [all, query, sort]);

  const isVendor = Boolean(user && (user.is_vendor === 1 || user.is_vendor === true));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Browse Listings
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({all.length})
          </span>
        </h1>
        {isVendor && (
          <Button asChild size="sm">
            <Link href="/create-listing">
              <PlusCircle className="mr-1.5 h-4 w-4" />
              New Listing
            </Link>
          </Button>
        )}
      </div>

      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search listings..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            aria-label="Search listings"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-40" aria-label="Sort listings">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="name-asc">Name: A to Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <LoadingState label="Loading listings..." />
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          {error}
        </div>
      ) : (
        <ListingsGrid
          listings={filtered}
          emptyMessage={
            query
              ? `No listings match "${query}".`
              : "No listings have been published yet."
          }
        />
      )}
    </div>
  );
}
