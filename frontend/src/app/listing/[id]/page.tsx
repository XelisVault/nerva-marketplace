"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { listingApi, cartApi, HttpError } from "@/lib/api-client";
import type { Listing } from "@/types";
import { useAuth } from "@/lib/auth";
import { useCartStore } from "@/lib/cart-store";
import { NervaBadge } from "@/components/marketplace/nerva-badge";
import { ImageWithFallback } from "@/components/marketplace/image-with-fallback";
import { listingImageUrl } from "@/lib/config";
import { BackButton } from "@/components/layout/header";
import { LoadingState, ErrorState } from "@/components/common/loading-states";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

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
      toast.success("Added to cart");
    } catch (err) {
      const msg = err instanceof HttpError ? err.message : "Failed to add to cart";
      toast.error("Could not add to cart", { description: msg });
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <LoadingState label="Loading listing..." />;
  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
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
    <div className="mx-auto max-w-4xl px-4 py-6">
      <BackButton fallback="/listings" />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted/30">
          <ImageWithFallback
            src={listingImageUrl(listing.image_name)}
            alt={listing.title}
            priority
          />
          {soldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <span className="rounded-full bg-destructive px-3 py-1 text-sm font-semibold text-destructive-foreground">
                Sold out
              </span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <div className="text-sm text-muted-foreground">
            Sold by{" "}
            <Link
              href={`/listings?vendor=${encodeURIComponent(listing.vendor)}`}
              className="font-medium text-foreground hover:underline"
            >
              {listing.vendor}
            </Link>
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            {listing.title}
          </h1>

          <div className="mt-3">
            <NervaBadge price={listing.price_xnv} size="lg" />
          </div>

          <div className="mt-3 text-sm text-muted-foreground">
            {soldOut ? (
              <span className="font-medium text-destructive">Out of stock</span>
            ) : (
              <span>
                <span className="font-medium text-foreground">
                  {listing.quantity_available}
                </span>{" "}
                available
              </span>
            )}
          </div>

          {/* Add to cart */}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              size="lg"
              onClick={handleAddToCart}
              disabled={soldOut || adding || !authChecked || isOwner}
              className="flex-1"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {adding
                ? "Adding..."
                : !authChecked
                  ? "Checking..."
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
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
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

          {/* Description */}
          <Card className="mt-6">
            <CardContent className="p-4">
              <h2 className="mb-2 text-sm font-semibold">Description</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {listing.description}
              </p>
            </CardContent>
          </Card>

          {/* Payment info */}
          {listing.payment_address && (
            <Card className="mt-3">
              <CardContent className="p-4">
                <h2 className="mb-2 text-sm font-semibold">Payment</h2>
                <p className="text-xs text-muted-foreground">
                  Payments are sent directly to the vendor's NERVA address.
                  The marketplace never holds your funds.
                </p>
                <div className="mt-2 rounded border bg-muted/40 p-2">
                  <code className="block truncate font-mono text-xs">
                    {listing.payment_address}
                  </code>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
