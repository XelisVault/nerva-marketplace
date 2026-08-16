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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  ShoppingCart,
  Trash2,
  Lock,
} from "@/components/icons";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export default function CartPage() {
  const router = useRouter();
  const { user, authChecked } = useAuth();
  const { cart, loading, fetch, removeItem } = useCartStore();
  const [items, setItems] = useState<CartItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
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

  // Resolve each cart item's listing details in parallel.
  useEffect(() => {
    if (!cart?.items?.length) {
      setItems([]);
      setItemsLoading(false);
      return;
    }
    setItemsLoading(true);
    Promise.all(
      cart.items.map((id) =>
        listingApi
          .get(id)
          .then((l) => ({
            listing_id: l.listing_id,
            title: l.title,
            image_name: l.image_name,
            price_xnv: l.price_xnv,
            quantity_available: l.quantity_available,
            vendor: l.vendor,
          }))
          .catch(() => null),
      ),
    ).then((res) => {
      setItems(res.filter(Boolean) as CartItem[]);
      setItemsLoading(false);
    });
  }, [cart?.items]);

  const total = items.reduce((sum, i) => sum + i.price_xnv, 0);

  const handleRemove = async (listingId: number) => {
    setRemovingId(listingId);
    try {
      await removeItem(listingId);
      toast.success("Item removed from cart");
    } catch (err) {
      const msg = err instanceof HttpError ? err.message : "Failed to remove item";
      toast.error("Could not remove item", { description: msg });
    } finally {
      setRemovingId(null);
    }
  };

  const handleCheckout = async () => {
    if (!shipping.trim()) {
      toast.error("Shipping details required", {
        description: "Please enter your shipping address.",
      });
      return;
    }
    setCheckingOut(true);
    try {
      await cartApi.addShipping(shipping.trim());
      const result = await cartApi.checkout();
      toast.success("Invoice created", {
        description: "Redirecting to payment…",
      });
      router.push(`/invoice/${result.invoice_id}`);
    } catch (err) {
      const msg = err instanceof HttpError ? err.message : "Checkout failed";
      toast.error("Checkout failed", { description: msg });
      setCheckingOut(false);
    }
  };

  if (!authChecked || loading || itemsLoading) {
    return <LoadingState label="Loading your cart…" />;
  }

  if (!user) {
    return <LoadingState label="Redirecting to sign-in…" />;
  }

  if (!cart?.items?.length || items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <EmptyState
          title="Your cart is empty"
          description="Browse the marketplace and add items to your cart to get started."
          action={
            <Button asChild>
              <Link href="/listings">
                Browse listings
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-foreground mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
        Your cart
      </h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Items */}
        <div className="space-y-3 lg:col-span-2">
          {items.map((item) => {
            const soldOut = item.quantity_available <= 0;
            return (
              <Card key={item.listing_id} className="overflow-hidden py-0">
                <div className="flex gap-4 p-4">
                  <Link
                    href={`/listing/${item.listing_id}`}
                    className="bg-muted/30 relative h-24 w-24 shrink-0 overflow-hidden rounded-lg sm:h-28 sm:w-28"
                  >
                    <ImageWithFallback
                      src={listingImageUrl(item.image_name)}
                      alt={item.title}
                      width={112}
                      height={112}
                    />
                  </Link>
                  <div className="flex flex-1 flex-col gap-1">
                    <Link
                      href={`/listing/${item.listing_id}`}
                      className="text-foreground hover:text-primary line-clamp-2 text-sm font-semibold sm:text-base"
                    >
                      {item.title}
                    </Link>
                    <p className="text-muted-foreground text-xs">
                      Sold by {item.vendor}
                    </p>
                    {soldOut && (
                      <p className="text-destructive flex items-center gap-1 text-xs font-medium">
                        <AlertCircle className="h-3 w-3" />
                        No longer available
                      </p>
                    )}
                    <div className="mt-auto">
                      <NervaBadge price={item.price_xnv} size="sm" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemove(item.listing_id)}
                      disabled={removingId === item.listing_id}
                      className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                      aria-label="Remove from cart"
                    >
                      {removingId === item.listing_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}

          <Button variant="ghost" asChild className="w-fit">
            <Link href="/listings">
              <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
              Continue shopping
            </Link>
          </Button>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-base">Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                {items.map((item) => (
                  <div
                    key={item.listing_id}
                    className="text-muted-foreground flex justify-between gap-2"
                  >
                    <span className="line-clamp-1">{item.title}</span>
                    <span className="text-foreground shrink-0 font-medium">
                      {formatXnv(item.price_xnv)} XNV
                    </span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <NervaBadge price={total} size="lg" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shipping" className="text-sm font-medium">
                  Shipping details
                </Label>
                <Textarea
                  id="shipping"
                  value={shipping}
                  onChange={(e) => setShipping(e.target.value)}
                  placeholder="Full name, address, city, postal code, country, and any special instructions…"
                  rows={4}
                  className="resize-none"
                />
                <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <Lock className="h-3 w-3" />
                  Stored on the order; only the vendor can see it.
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
                    Creating invoice…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Checkout · {formatXnv(total)} XNV
                  </>
                )}
              </Button>

              <p className="text-muted-foreground text-center text-xs">
                A unique NERVA subaddress will be generated for this order.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
