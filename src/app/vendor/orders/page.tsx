"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { orderApi, HttpError } from "@/lib/api-client";
import type { Order } from "@/types";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { LoadingState, EmptyState } from "@/components/common/loading-states";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/layout/header";
import { format } from "date-fns";
import { formatXnv } from "@/components/marketplace/nerva-badge";
import { Coins, Package } from "@/components/icons";

function VendorOrdersView() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    orderApi
      .vendorOrders()
      .then((data) => {
        setOrders(data ?? []);
        setLoading(false);
      })
      .catch((err) => {
        if (err instanceof HttpError && (err.status === 401 || err.status === 422)) {
          router.replace("/login");
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load orders");
        setLoading(false);
      });
  }, [router]);

  if (loading) return <LoadingState label="Loading vendor orders…" />;
  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <BackButton fallback="/" />
        <EmptyState title="Could not load orders" description={error} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <BackButton fallback="/" />
      <h1 className="text-foreground mb-1 text-2xl font-bold tracking-tight sm:text-3xl">
        Vendor orders
      </h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Orders placed by customers for your listings.
      </p>

      {!orders || orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="When a customer buys one of your listings, the order will appear here."
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const paid = order.status === "confirmed";
            return (
              <Card key={order.order_id} className="py-0">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-accent text-accent-foreground flex h-11 w-11 items-center justify-center rounded-lg">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-foreground font-mono text-sm font-semibold">
                        Order #{order.order_id}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {format(new Date(order.create_time), "MMM d, yyyy · HH:mm")}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {order.amount !== undefined && (
                      <Badge variant="outline" className="gap-1">
                        <Coins className="h-3 w-3" />
                        {formatXnv(order.amount)} XNV
                      </Badge>
                    )}
                    <Badge
                      variant={paid ? "default" : "secondary"}
                      className={
                        paid
                          ? "bg-success text-success-foreground"
                          : "bg-warning/20 text-warning"
                      }
                    >
                      {paid ? "Paid" : "Awaiting payment"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function VendorOrdersPage() {
  return (
    <ProtectedRoute vendorOnly>
      <VendorOrdersView />
    </ProtectedRoute>
  );
}
