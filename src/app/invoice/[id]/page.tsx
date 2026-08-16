"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { invoiceApi } from "@/lib/api-client";
import type { Invoice, InvoiceTransaction } from "@/types";
import { invoiceWsUrlFor } from "@/lib/config";
import { BackButton } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingState, ErrorState } from "@/components/common/loading-states";
import { NervaBadge, formatXnv } from "@/components/marketplace/nerva-badge";
import { Check, CheckCircle2, Clock, Copy, Hash, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<InvoiceTransaction[]>([]);
  const [copied, setCopied] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!id) return;
    invoiceApi
      .get(id)
      .then((data) => {
        setInvoice(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load invoice.");
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!invoice) return;
    const wsUrl = invoiceWsUrlFor(invoice.invoice_id);

    if (wsUrl) {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.addEventListener("open", () => console.log("[ws] connected"));
      ws.addEventListener("message", (event) => {
        try {
          const parts = String(event.data).split(",");
          const txId = parts[0];
          const amount = parts[1];
          const confirmations = parseInt(parts[2] ?? "0", 10);
          setTransactions((prev) => {
            const existing = prev.find((t) => t.txId === txId);
            if (existing) {
              return prev.map((t) =>
                t.txId === txId ? { ...t, amount, confirmations } : t,
              );
            }
            return [...prev, { txId, amount, confirmations }];
          });
          if (confirmations >= 1) {
            setInvoice((inv) => (inv ? { ...inv, status: "confirmed" } : inv));
          }
        } catch (e) {
          console.error("[ws] parse error:", e);
        }
      });
      ws.addEventListener("error", (e) => console.error("[ws] error:", e));
      ws.addEventListener("close", () => console.log("[ws] closed"));
      return () => ws.close();
    }

    // Preview mode: simulate a payment after ~5s.
    simTimerRef.current = setTimeout(() => {
      const txId = "sim_" + Math.random().toString(36).slice(2, 14);
      setTransactions((prev) => [
        ...prev,
        { txId, amount: String(invoice.amount), confirmations: 0 },
      ]);
      toast.info("Payment detected", {
        description: "Waiting for confirmation...",
      });
      setTimeout(() => {
        setTransactions((prev) =>
          prev.map((t) =>
            t.txId === txId ? { ...t, confirmations: 1 } : t,
          ),
        );
        setInvoice((inv) => (inv ? { ...inv, status: "confirmed" } : inv));
        toast.success("Payment confirmed");
      }, 8000);
    }, 5000);

    return () => {
      if (simTimerRef.current) clearTimeout(simTimerRef.current);
    };
  }, [invoice]);

  const handleCopy = async () => {
    if (!invoice) return;
    try {
      await navigator.clipboard.writeText(invoice.address);
      setCopied(true);
      toast.success("Address copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  if (loading) return <LoadingState label="Loading invoice..." />;
  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <BackButton fallback="/" />
        <ErrorState title="Invoice not found" message={error} />
      </div>
    );
  }
  if (!invoice) return null;

  const confirmed =
    invoice.status === "confirmed" ||
    transactions.some((t) => t.confirmations >= 1);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <BackButton fallback="/" />

      {/* Status header */}
      <div
        className={cn(
          "mb-4 flex items-center gap-3 rounded-lg border p-4",
          confirmed ? "border-green-500/30 bg-green-500/5" : "border-yellow-500/30 bg-yellow-500/5",
        )}
      >
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            confirmed ? "bg-green-500/15" : "bg-yellow-500/15",
          )}
        >
          {confirmed ? (
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          ) : (
            <Clock className="h-6 w-6 animate-pulse text-yellow-500" />
          )}
        </div>
        <div className="flex-1">
          <h1 className={cn("text-base font-semibold", confirmed ? "text-green-600" : "text-yellow-600")}>
            {confirmed ? "Payment confirmed" : "Awaiting payment"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {confirmed
              ? "Your payment has been confirmed. The vendor has been notified."
              : "Send the exact XNV amount to the address below."}
          </p>
        </div>
        <NervaBadge price={invoice.amount} size="lg" />
      </div>

      {/* Payment details */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4" />
            Payment Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Amount due</span>
            <NervaBadge price={invoice.amount} size="lg" />
          </div>

          <div className="space-y-1.5">
            <span className="text-sm text-muted-foreground">NERVA address</span>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-2">
              <Hash className="h-4 w-4 shrink-0 text-muted-foreground" />
              <code className="flex-1 truncate font-mono text-xs">
                {invoice.address}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="h-8 w-8 p-0"
                aria-label="Copy address"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Send exactly{" "}
              <span className="font-mono font-medium text-foreground">
                {formatXnv(invoice.amount)} XNV
              </span>{" "}
              to this address.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Transactions {transactions.length > 0 && `(${transactions.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p>Watching for your payment...</p>
              <p className="text-xs">This page updates automatically.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.txId}
                  className="flex items-center justify-between gap-3 rounded-lg border p-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-mono text-xs text-foreground">
                      {tx.txId}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {formatXnv(parseFloat(tx.amount))} XNV
                    </div>
                  </div>
                  <div
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
                      tx.confirmations >= 1
                        ? "bg-green-500/15 text-green-600"
                        : "bg-yellow-500/15 text-yellow-600",
                    )}
                  >
                    {tx.confirmations >= 1 ? "Confirmed" : "Pending"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Invoice #{invoice.invoice_id}
      </p>
    </div>
  );
}
