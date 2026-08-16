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
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Hash,
  Loader2,
  Wallet,
} from "@/components/icons";
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

  // Fetch invoice details.
  useEffect(() => {
    if (!id) return;
    invoiceApi
      .get(id)
      .then((data) => {
        setInvoice(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Failed to load invoice.",
        );
        setLoading(false);
      });
  }, [id]);

  // Connect to WebSocket (real backend) or simulate payment status (preview).
  useEffect(() => {
    if (!invoice) return;
    const wsUrl = invoiceWsUrlFor(invoice.invoice_id);

    if (wsUrl) {
      // Real backend — connect.
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.addEventListener("open", () => {
        console.log("[ws] connected to invoice stream");
      });
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
            setInvoice((inv) =>
              inv ? { ...inv, status: "confirmed" } : inv,
            );
          }
        } catch (e) {
          console.error("[ws] failed to parse message:", e);
        }
      });
      ws.addEventListener("error", (e) => {
        console.error("[ws] error:", e);
      });
      ws.addEventListener("close", () => {
        console.log("[ws] disconnected");
      });
      return () => {
        ws.close();
      };
    }

    // Preview mode — simulate a payment arriving after ~5s and confirming ~12s later.
    simTimerRef.current = setTimeout(() => {
      const txId = "sim_" + Math.random().toString(36).slice(2, 14);
      setTransactions((prev) => [
        ...prev,
        { txId, amount: String(invoice.amount), confirmations: 0 },
      ]);
      toast.info("Payment detected in mempool", {
        description: "Waiting for network confirmation…",
      });
      // Confirm after another 8 seconds.
      setTimeout(() => {
        setTransactions((prev) =>
          prev.map((t) =>
            t.txId === txId ? { ...t, confirmations: 1 } : t,
          ),
        );
        setInvoice((inv) =>
          inv ? { ...inv, status: "confirmed" } : inv,
        );
        toast.success("Payment confirmed!", {
          description: "The vendor will ship your order soon.",
        });
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

  if (loading) return <LoadingState label="Loading invoice…" />;
  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <BackButton fallback="/" />
        <ErrorState title="Invoice not found" message={error} />
      </div>
    );
  }
  if (!invoice) return null;

  const confirmed = invoice.status === "confirmed" ||
    transactions.some((t) => t.confirmations >= 1);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <BackButton fallback="/" />

      {/* Status header */}
      <div
        className={cn(
          "mb-6 flex items-center gap-4 rounded-xl border p-5",
          confirmed
            ? "border-success/30 bg-success/5"
            : "border-warning/30 bg-warning/5",
        )}
      >
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
            confirmed ? "bg-success/15" : "bg-warning/15",
          )}
        >
          {confirmed ? (
            <CheckCircle2 className="text-success h-7 w-7" />
          ) : (
            <Clock className="text-warning h-7 w-7 animate-pulse" />
          )}
        </div>
        <div className="flex-1">
          <h1
            className={cn(
              "text-lg font-semibold",
              confirmed ? "text-success" : "text-warning",
            )}
          >
            {confirmed ? "Payment confirmed" : "Awaiting payment"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {confirmed
              ? "Your payment has been confirmed on the NERVA network. The vendor has been notified."
              : "Send the exact XNV amount to the address below to complete your order."}
          </p>
        </div>
        <div className="hidden sm:block">
          <NervaBadge price={invoice.amount} size="lg" />
        </div>
      </div>

      <div className="grid gap-6">
        {/* Payment details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="text-primary h-4 w-4" />
              Payment address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-muted-foreground text-sm">Amount due</div>
              <NervaBadge price={invoice.amount} size="lg" />
            </div>

            <div className="space-y-2">
              <div className="text-muted-foreground text-sm">
                NERVA subaddress
              </div>
              <div className="bg-muted/40 flex items-center gap-2 rounded-lg p-3">
                <Hash className="text-muted-foreground h-4 w-4 shrink-0" />
                <code className="text-foreground flex-1 truncate font-mono text-xs sm:text-sm">
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
                    <Check className="text-success h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                Send exactly{" "}
                <span className="text-foreground font-mono font-medium">
                  {formatXnv(invoice.amount)} XNV
                </span>{" "}
                to this address. Each order has a unique subaddress for
                privacy.
              </p>
            </div>

            <div className="bg-accent/40 text-accent-foreground flex items-start gap-2 rounded-lg p-3 text-xs">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>
                Don&apos;t send from an exchange — use a wallet you control
                (e.g. nerva-wallet-gui) so you can include the exact amount
                and the correct fee.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Transaction history */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Transactions {transactions.length > 0 && `(${transactions.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center text-sm">
                <Loader2 className="text-primary h-6 w-6 animate-spin" />
                <p>Watching the NERVA network for your payment…</p>
                <p className="text-xs">
                  This page updates automatically. You can leave it open.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div
                    key={tx.txId}
                    className="border-border/60 flex items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-foreground truncate font-mono text-xs">
                        {tx.txId}
                      </div>
                      <div className="text-muted-foreground mt-0.5 text-xs">
                        {formatXnv(parseFloat(tx.amount))} XNV
                      </div>
                    </div>
                    <div
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
                        tx.confirmations >= 1
                          ? "bg-success/15 text-success"
                          : "bg-warning/15 text-warning",
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

        {/* Invoice ID */}
        <div className="text-muted-foreground text-center text-xs">
          Invoice #{invoice.invoice_id}
          {invoice.create_time && (
            <> · created {new Date(invoice.create_time).toLocaleString()}</>
          )}
        </div>
      </div>
    </div>
  );
}
