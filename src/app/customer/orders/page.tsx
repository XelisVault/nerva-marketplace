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
import { ArrowRight, Package, Truck } from "lucide-react";
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

  if (loading) return <LoadingState label="Loading orders..." />;
  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <BackButton fallback="/" />
        <EmptyState title="Could not load orders" description={error} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <BackButton fallback="/" />
      <h1 className="mb-1 text-xl font-semibold">Your Orders</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Orders you've placed on NERVA Marketplace.
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
        <div className="space-y-2">
          {orders.map((order) => {
            const paid = order.invoice_status === "confirmed";
            const shipped = order.shipping_status === "shipped";
            return (
              <Card key={order.order_id} className="py-0">
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-mono text-sm font-semibold">
                      Order #{order.order_id}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(order.create_time), "MMM d, yyyy - HH:mm")}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant={paid ? "default" : "secondary"}
                      className={
                        paid
                          ? "bg-green-500 text-white"
                          : "bg-yellow-500/20 text-yellow-600"
                      }
                    >
                      {paid ? "Paid" : "Pending"}
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
