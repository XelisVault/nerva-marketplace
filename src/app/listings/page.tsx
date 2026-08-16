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
import { PlusCircle, Search } from "@/components/icons";
import { useAuth } from "@/lib/auth";
import { NervaBadge } from "@/components/marketplace/nerva-badge";
import { Coins } from "@/components/icons";

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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
            Browse listings
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {all.length} item{all.length === 1 ? "" : "s"} · priced in NERVA (XNV)
          </p>
        </div>
        {isVendor && (
          <Button asChild>
            <Link href="/create-listing">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create listing
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder="Search by title, description or vendor…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            aria-label="Search listings"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-full sm:w-52" aria-label="Sort listings">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="name-asc">Name: A to Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <LoadingState label="Loading listings…" />
      ) : error ? (
        <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-6 text-center">
          <p className="text-sm font-medium">Failed to load listings</p>
          <p className="text-muted-foreground mt-1 text-xs">{error}</p>
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

      {/* Tip */}
      {!loading && filtered.length > 0 && (
        <div className="bg-accent/40 text-accent-foreground mt-8 flex items-center gap-3 rounded-lg p-4 text-sm">
          <Coins className="text-primary h-5 w-5 shrink-0" />
          <p>
            Every price is in NERVA (XNV) — a CPU-minable privacy coin.{" "}
            <a
              href="https://getnerva.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-2 hover:underline"
            >
              Learn how to get XNV →
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
