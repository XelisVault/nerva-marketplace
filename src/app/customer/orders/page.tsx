"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { orderApi, HttpError } from "@/lib/api-client";
import type { Order } from "@/types";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { LoadingState, EmptyState } from "@/components/common/loading-states";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/layout/header";
import { format } from "date-fns";
import { ArrowRight, Package, Truck } from "@/components/icons";
import Link from "next/link";

function CustomerOrdersView() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    orderApi
      .customerOrders()
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

  if (loading) return <LoadingState label="Loading your orders…" />;
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
        Your orders
      </h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Track the status of orders you&apos;ve placed on NERVA Marketplace.
      </p>

      {!orders || orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="When you place your first order, it will appear here."
          action={
            <Button asChild>
              <Link href="/listings">
                Browse listings
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const paid = order.invoice_status === "confirmed";
            const shipped = order.shipping_status === "shipped";
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
                    <Badge
                      variant={paid ? "default" : "secondary"}
                      className={
                        paid
                          ? "bg-success text-success-foreground"
                          : "bg-warning/20 text-warning"
                      }
                    >
                      {paid ? "Paid" : "Payment pending"}
                    </Badge>
                    <Badge variant={shipped ? "default" : "outline"}>
                      <Truck className="mr-1 h-3 w-3" />
                      {shipped ? "Shipped" : "Not shipped"}
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

export default function CustomerOrdersPage() {
  return (
    <ProtectedRoute>
      <CustomerOrdersView />
    </ProtectedRoute>
  );
}
