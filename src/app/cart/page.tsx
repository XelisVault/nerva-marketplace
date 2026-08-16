"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cartApi, listingApi, HttpError } from "@/lib/api-client";
import { useCartStore } from "@/lib/cart-store";
import type { CartItem } from "@/types";
import { LoadingState, EmptyState } from "@/components/common/loading-states";
import { NervaBadge, formatXnv } from "@/components/marketplace/nerva-badge";
import { ImageWithFallback } from "@/components/marketplace/image-with-fallback";
import { listingImageUrl } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

const CartItemRow = ({
  listingId,
  onRemove,
  removing,
}: {
  listingId: number;
  onRemove: (id: number) => void;
  removing: boolean;
}) => {
  const [item, setItem] = useState<CartItem | null>(null);
  const [loadErr, setLoadErr] = useState(false);

  useEffect(() => {
    listingApi
      .get(listingId)
      .then((l) => {
        setItem({
          listing_id: l.listing_id,
          title: l.title,
          image_name: l.image_name,
          price_xnv: l.price_xnv,
          quantity_available: l.quantity_available,
          vendor: l.vendor,
          payment_address: l.payment_address,
        });
      })
      .catch(() => setLoadErr(true));
  }, [listingId]);

  if (loadErr) {
    return (
      <div className="rounded-lg border p-3 text-sm text-muted-foreground">
        Listing {listingId} is no longer available.
      </div>
    );
  }

  if (!item) {
    return (
      <div className="rounded-lg border p-3">
        <div className="h-20 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  const soldOut = item.quantity_available <= 0;

  return (
    <Card className="py-0">
      <div className="flex gap-3 p-3">
        <Link
          href={`/listing/${item.listing_id}`}
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted/30"
        >
          <ImageWithFallback
            src={listingImageUrl(item.image_name)}
            alt={item.title}
            width={80}
            height={80}
          />
        </Link>
        <div className="flex flex-1 flex-col gap-1">
          <Link
            href={`/listing/${item.listing_id}`}
            className="line-clamp-2 text-sm font-medium hover:text-primary"
          >
            {item.title}
          </Link>
          <p className="text-xs text-muted-foreground">Sold by {item.vendor}</p>
          {soldOut && (
            <p className="flex items-center gap-1 text-xs font-medium text-destructive">
              <AlertCircle className="h-3 w-3" />
              No longer available
            </p>
          )}
          <div className="mt-auto">
            <NervaBadge price={item.price_xnv} size="sm" />
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onRemove(item.listing_id)}
          disabled={removing}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          aria-label="Remove from cart"
        >
          {removing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </Card>
  );
};

export default function CartPage() {
  const router = useRouter();
  const { user, authChecked } = useAuth();
  const { cart, loading, fetch, removeItem } = useCartStore();
  const [shipping, setShipping] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    if (!authChecked) return;
    if (!user) {
      router.replace(`/login?from=${encodeURIComponent("/cart")}`);
      return;
    }
    fetch();
  }, [authChecked, user, fetch, router]);

  const handleRemove = async (listingId: number) => {
    setRemovingId(listingId);
    try {
      await removeItem(listingId);
      toast.success("Item removed");
    } catch (err) {
      const msg = err instanceof HttpError ? err.message : "Failed to remove item";
      toast.error("Could not remove item", { description: msg });
    } finally {
      setRemovingId(null);
    }
  };

  const handleCheckout = async () => {
    if (!shipping.trim()) {
      toast.error("Shipping details required");
      return;
    }
    setCheckingOut(true);
    try {
      await cartApi.addShipping(shipping.trim());
      const result = await cartApi.checkout();
      toast.success("Invoice created");
      router.push(`/invoice/${result.invoice_id}`);
    } catch (err) {
      const msg = err instanceof HttpError ? err.message : "Checkout failed";
      toast.error("Checkout failed", { description: msg });
      setCheckingOut(false);
    }
  };

  if (!authChecked || loading) {
    return <LoadingState label="Loading cart..." />;
  }

  if (!user) {
    return <LoadingState label="Redirecting..." />;
  }

  if (!cart?.items?.length) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <EmptyState
          title="Your cart is empty"
          description="Browse the marketplace and add items to your cart."
          action={
            <Button asChild>
              <Link href="/listings">Browse listings</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold">Your Cart</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Items */}
        <div className="space-y-2 md:col-span-2">
          {cart.items.map((id) => (
            <CartItemRow
              key={id}
              listingId={id}
              onRemove={handleRemove}
              removing={removingId === id}
            />
          ))}
          <Button variant="ghost" asChild className="mt-2">
            <Link href="/listings">Continue shopping</Link>
          </Button>
        </div>

        {/* Summary */}
        <div className="md:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                {cart.items.length} item{cart.items.length === 1 ? "" : "s"}
              </div>
              <Separator />

              <div className="space-y-2">
                <Label htmlFor="shipping" className="text-sm font-medium">
                  Shipping details
                </Label>
                <Textarea
                  id="shipping"
                  value={shipping}
                  onChange={(e) => setShipping(e.target.value)}
                  placeholder="Full name, address, city, postal code, country..."
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Only the vendor can see this.
                </p>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={checkingOut || !shipping.trim()}
                className="w-full"
                size="lg"
              >
                {checkingOut ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating invoice...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Checkout
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                You'll get a NERVA payment address on the next page.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
