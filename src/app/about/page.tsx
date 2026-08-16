import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NERVA_INFO } from "@/lib/config";
import {
  ArrowRight,
  Cpu,
  ExternalLink,
  Github,
  Lock,
  Shield,
  Sparkles,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "About NERVA",
  description: `Learn about ${NERVA_INFO.name} (${NERVA_INFO.ticker}) — the CPU-minable privacy coin that powers this marketplace.`,
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="bg-brand-gradient text-primary-foreground mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl text-2xl font-bold">
          N
        </div>
        <h1 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
          About NERVA
        </h1>
        <p className="text-muted-foreground mx-auto mt-3 max-w-2xl text-sm sm:text-base">
          {NERVA_INFO.description}
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="space-y-2 p-5">
            <div className="bg-accent text-accent-foreground inline-flex h-9 w-9 items-center justify-center rounded-lg">
              <Cpu className="h-5 w-5" />
            </div>
            <h2 className="text-foreground text-base font-semibold">
              CPU-minable
            </h2>
            <p className="text-muted-foreground text-sm">
              NERVA uses Cryptonight Adaptive (v3) — a variant deliberately
              tuned to be GPU- and ASIC-resistant. The network is secured
              by solo CPU miners only: there are no pools, no farms, just
              ordinary computers.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 p-5">
            <div className="bg-accent text-accent-foreground inline-flex h-9 w-9 items-center justify-center rounded-lg">
              <Lock className="h-5 w-5" />
            </div>
            <h2 className="text-foreground text-base font-semibold">
              Privacy by default
            </h2>
            <p className="text-muted-foreground text-sm">
              Built as a Monero/Masari fork, NERVA inherits Cryptonote +
              RingCT: sender, recipient, and amount are hidden on every
              transaction. Coins are untraceable, unlinkable, and fungible.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 p-5">
            <div className="bg-accent text-accent-foreground inline-flex h-9 w-9 items-center justify-center rounded-lg">
              <Shield className="h-5 w-5" />
            </div>
            <h2 className="text-foreground text-base font-semibold">
              Fair launch
            </h2>
            <p className="text-muted-foreground text-sm">
              No ICO, no pre-sale, no developer tax. A small pre-mine of
              180,000 XNV (~0.97% of supply) was used for infrastructure
              and listing costs. Total supply is ~18.5 million with a 1%
              annual tail emission.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 p-5">
            <div className="bg-accent text-accent-foreground inline-flex h-9 w-9 items-center justify-center rounded-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="text-foreground text-base font-semibold">
              Fast &amp; low-fee
            </h2>
            <p className="text-muted-foreground text-sm">
              1-minute block time and sub-cent transaction fees make NERVA
              practical for everyday payments — including marketplace
              purchases of physical goods.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardContent className="p-6">
          <h2 className="text-foreground text-lg font-semibold">
            The name &quot;NERVA&quot;
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            NERVA is named after NASA&apos;s 1950s–60s Nuclear Engine for
            Rocket Vehicle Application project — a nuclear-thermal rocket
            program that pioneered compact, efficient space propulsion. The
            coin honours that spirit of ambitious, ground-up engineering.
          </p>
        </CardContent>
      </Card>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild size="lg">
          <a
            href={NERVA_INFO.website}
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit getnerva.org
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/listings">
            Browse marketplace
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="ghost">
          <a
            href="https://github.com/XelisVault/nerva-marketplace"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github className="mr-2 h-4 w-4" />
            Source code
          </a>
        </Button>
      </div>

      <div className="text-muted-foreground mt-10 text-center text-xs">
        NERVA Marketplace is an independent community project and is not
        affiliated with the official NERVA core development team.
      </div>
    </div>
  );
}
