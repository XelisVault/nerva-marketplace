"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listingApi } from "@/lib/api-client";
import type { Listing } from "@/types";
import { ListingsGrid } from "@/components/marketplace/listings-grid";
import { LoadingState } from "@/components/common/loading-states";
import { NervaBadge } from "@/components/marketplace/nerva-badge";
import { Button } from "@/components/ui/button";
import { NERVA_INFO } from "@/lib/config";
import {
  ArrowRight,
  Cpu,
  Shield,
  Sparkles,
  Wallet,
  Coins,
  Lock,
  Truck,
  Github,
} from "@/components/icons";

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listingApi
      .list()
      .then((data) => {
        setListings(data ?? []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[home] failed to load listings:", err);
        setError(err instanceof Error ? err.message : "Failed to load listings");
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="bg-brand-gradient absolute inset-0 opacity-[0.04]" />
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, oklch(0.5 0.05 240 / 0.18) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="bg-accent/60 text-accent-foreground mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              Community marketplace · Powered by {NERVA_INFO.ticker}
            </div>
            <h1 className="text-foreground text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Buy & sell goods in{" "}
              <span className="text-brand-gradient">NERVA</span>
            </h1>
            <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-base text-pretty sm:text-lg">
              A crypto-native marketplace where every listing is priced in
              NERVA (XNV) — the CPU-minable, ASIC-resistant privacy coin.
              No payment processors. No middlemen. Just on-chain settlement
              with real-time invoice tracking.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/listings">
                  Browse marketplace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full sm:w-auto"
              >
                <a
                  href={NERVA_INFO.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  What is NERVA?
                </a>
              </Button>
            </div>

            {/* Quick stats */}
            <div className="mx-auto mt-12 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Currency", value: "XNV" },
                { label: "Algorithm", value: "Cryptonight" },
                { label: "Block time", value: "60s" },
                { label: "Supply", value: "18.5M" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="border-border/60 bg-card/60 rounded-lg border p-3 text-center backdrop-blur"
                >
                  <div className="text-foreground text-xl font-bold">
                    {stat.value}
                  </div>
                  <div className="text-muted-foreground mt-1 text-xs">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features strip */}
      <section className="border-b border-border/60 bg-muted/20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-px overflow-hidden sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Cpu,
              title: "CPU-minable",
              desc: "NERVA is solo-CPU mined — no pools, no ASICs. Anyone with a computer can secure the network.",
            },
            {
              icon: Lock,
              title: "Privacy by default",
              desc: "Built on Cryptonote + RingCT. Sender, recipient and amount are hidden on every transaction.",
            },
            {
              icon: Shield,
              title: "No middleman",
              desc: "Payments go directly to vendor subaddresses. The marketplace never custodies your funds.",
            },
            {
              icon: Truck,
              title: "Real-time tracking",
              desc: "Watch your invoice confirm over WebSocket as soon as the network sees your transaction.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-background p-6 transition-colors hover:bg-accent/30"
            >
              <div className="bg-accent text-accent-foreground mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-foreground text-sm font-semibold">
                {f.title}
              </h3>
              <p className="text-muted-foreground mt-1 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured listings */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
              Featured listings
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Fresh from the marketplace — priced in NERVA, settled on-chain.
            </p>
          </div>
          <Button asChild variant="ghost" className="self-start sm:self-auto">
            <Link href="/listings">
              View all
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
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
            listings={listings.slice(0, 8)}
            emptyMessage="No listings have been published yet."
          />
        )}
      </section>

      {/* How it works */}
      <section className="border-t border-border/60 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
              How it works
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              From browsing to on-chain payment confirmation in three steps.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Browse & add to cart",
                desc: "Find goods priced in XNV, add them to your cart, and enter your shipping details at checkout.",
              },
              {
                step: "2",
                title: "Pay to a unique address",
                desc: "Each order generates a unique NERVA subaddress. Send the exact XNV amount and the wallet detects it in the mempool.",
              },
              {
                step: "3",
                title: "Track confirmation live",
                desc: "A WebSocket pushes payment status to your browser in real time. Once confirmed, the vendor ships your order.",
              },
            ].map((s) => (
              <div key={s.step} className="relative">
                <div className="bg-brand-gradient text-primary-foreground mb-4 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold">
                  {s.step}
                </div>
                <h3 className="text-foreground text-base font-semibold">
                  {s.title}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60">
        <div className="bg-brand-gradient mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-white/95 p-8 dark:bg-zinc-900/95 md:flex-row">
            <div>
              <h2 className="text-foreground text-xl font-bold sm:text-2xl">
                Have goods to sell?
              </h2>
              <p className="text-muted-foreground mt-2 max-w-md text-sm">
                Become a vendor and reach a community of NERVA holders.
                Listings are free — you only need a vendor account.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/register">
                  Create an account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a
                  href="https://github.com/XelisVault/nerva-marketplace"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="mr-2 h-4 w-4" />
                  View source
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
