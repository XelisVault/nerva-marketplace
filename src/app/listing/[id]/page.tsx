"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { listingApi, cartApi, HttpError } from "@/lib/api-client";
import type { Listing } from "@/types";
import { useAuth } from "@/lib/auth";
import { useCartStore } from "@/lib/cart-store";
import { NervaBadge, formatXnv } from "@/components/marketplace/nerva-badge";
import { ImageWithFallback } from "@/components/marketplace/image-with-fallback";
import { listingImageUrl } from "@/lib/config";
import { BackButton } from "@/components/layout/header";
import { LoadingState, ErrorState } from "@/components/common/loading-states";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Check,
  Clock,
  Package,
  ShoppingCart,
  Store,
} from "@/components/icons";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, authChecked } = useAuth();
  const fetchCart = useCartStore((s) => s.fetch);

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    listingApi
      .get(id)
      .then((data) => {
        setListing(data);
        setError(null);
      })
      .catch((err) => {
        if (err instanceof HttpError && err.status === 404) {
          setError("This listing no longer exists.");
        } else {
          setError(err instanceof Error ? err.message : "Failed to load listing");
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!authChecked) return;
    if (!user) {
      const from = window.location.pathname;
      router.push(`/login?from=${encodeURIComponent(from)}`);
      return;
    }
    if (!listing) return;
    setAdding(true);
    try {
      await cartApi.addItem(listing.listing_id);
      await fetchCart();
      toast.success("Added to cart", {
        description: listing.title,
      });
    } catch (err) {
      const msg = err instanceof HttpError ? err.message : "Failed to add to cart";
      toast.error("Could not add to cart", { description: msg });
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <LoadingState label="Loading listing…" />;
  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <BackButton fallback="/listings" />
        <ErrorState title="Listing unavailable" message={error} />
        <div className="mt-4 text-center">
          <Button asChild variant="outline">
            <Link href="/listings">Browse all listings</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!listing) return null;

  const soldOut = listing.quantity_available <= 0;
  const isOwner = user?.username === listing.vendor;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <BackButton fallback="/listings" />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Image */}
        <div className="bg-muted/30 relative aspect-square overflow-hidden rounded-xl border">
          <ImageWithFallback
            src={listingImageUrl(listing.image_name)}
            alt={listing.title}
            width={800}
            height={800}
            priority
          />
          {soldOut && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <Badge variant="destructive" className="text-sm">
                Sold out
              </Badge>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Store className="h-4 w-4" />
            <span>
              Sold by{" "}
              <Link
                href={`/listings?vendor=${encodeURIComponent(listing.vendor)}`}
                className="text-foreground font-medium hover:underline"
              >
                {listing.vendor}
              </Link>
            </span>
            {listing.create_time && (
              <>
                <span className="text-muted-foreground/60">·</span>
                <Clock className="h-3.5 w-3.5" />
                <span>{format(new Date(listing.create_time), "MMM d, yyyy")}</span>
              </>
            )}
          </div>

          <h1 className="text-foreground mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            {listing.title}
          </h1>

          <div className="mt-4 flex items-center gap-3">
            <NervaBadge price={listing.price_xnv} size="lg" />
            <span className="text-muted-foreground text-sm">
              ≈ {formatXnv(listing.price_xnv)} XNV
            </span>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm">
            <Package className="text-muted-foreground h-4 w-4" />
            {soldOut ? (
              <span className="text-destructive font-medium">Out of stock</span>
            ) : (
              <span className="text-muted-foreground">
                <span className="text-foreground font-medium">
                  {listing.quantity_available}
                </span>{" "}
                available
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={handleAddToCart}
              disabled={soldOut || adding || !authChecked || isOwner}
              className="flex-1"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {adding
                ? "Adding…"
                : !authChecked
                  ? "Checking…"
                  : isOwner
                    ? "You can't buy your own listing"
                    : soldOut
                      ? "Sold out"
                      : "Add to cart"}
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/cart">View cart</Link>
            </Button>
          </div>

          {!user && authChecked && (
            <p className="text-muted-foreground mt-3 flex items-center gap-1.5 text-xs">
              <AlertCircle className="h-3.5 w-3.5" />
              You need to{" "}
              <Link
                href={`/login?from=${encodeURIComponent(window.location.pathname)}`}
                className="text-primary hover:underline"
              >
                sign in
              </Link>{" "}
              to add items to your cart.
            </p>
          )}

          {/* Tabs */}
          <Tabs defaultValue="details" className="mt-8">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="vendor">Vendor</TabsTrigger>
              <TabsTrigger value="shipping">Shipping</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="mt-4">
              <Card>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none p-4">
                  <p className="text-foreground/90 whitespace-pre-wrap text-sm leading-relaxed">
                    {listing.description}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="vendor" className="mt-4">
              <Card>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-brand-gradient text-primary-foreground flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold">
                      {listing.vendor.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-foreground text-sm font-semibold">
                        {listing.vendor}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Vendor on NERVA Marketplace
                      </p>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    All payments go directly to a unique NERVA subaddress
                    generated for each order. The marketplace never holds
                    vendor funds.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="shipping" className="mt-4">
              <Card>
                <CardContent className="space-y-3 p-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Check className="text-success mt-0.5 h-4 w-4 shrink-0" />
                    <p className="text-muted-foreground">
                      Provide your shipping address at checkout — it's stored
                      encrypted on the order record and only visible to the
                      vendor.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="text-success mt-0.5 h-4 w-4 shrink-0" />
                    <p className="text-muted-foreground">
                      Vendors mark orders as shipped once the payment is
                      confirmed on-chain (1 confirmation required).
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="text-success mt-0.5 h-4 w-4 shrink-0" />
                    <p className="text-muted-foreground">
                      Track payment status live on the invoice page via
                      WebSocket.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
