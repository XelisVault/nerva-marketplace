import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "About NERVA",
  description: "Learn about NERVA (XNV), the CPU-minable privacy coin.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <img
          src="/nerva-coin-logo.png"
          alt="NERVA"
          className="h-12 w-12"
        />
        <h1 className="text-2xl font-bold">About NERVA</h1>
      </div>

      <Card className="mb-4">
        <CardContent className="space-y-3 p-4 text-sm leading-relaxed">
          <p>
            <strong>NERVA (XNV)</strong> is a privacy-focused cryptocurrency that
            can only be mined with a CPU. It is a fork of Monero and uses the
            Cryptonight Adaptive proof-of-work algorithm, which is designed to
            resist GPU and ASIC mining.
          </p>
          <p className="text-muted-foreground">
            Unlike most cryptocurrencies, NERVA does not support pool mining.
            Every miner runs a full node. This means one CPU equals one vote,
            making the network more decentralized and resistant to censorship.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">XNV</div>
            <div className="text-xs text-muted-foreground">Ticker</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">60s</div>
            <div className="text-xs text-muted-foreground">Block time</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">18.5M</div>
            <div className="text-xs text-muted-foreground">Total supply</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">CPU</div>
            <div className="text-xs text-muted-foreground">Mining</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button asChild>
          <a
            href="https://getnerva.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit getnerva.org
          </a>
        </Button>
        <Button asChild variant="outline">
          <a
            href="https://github.com/nerva-project/nerva"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
          </a>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/listings">Browse marketplace</Link>
        </Button>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        NERVA Marketplace is an independent community project, not affiliated
        with the official NERVA core project.
      </p>
    </div>
  );
}
