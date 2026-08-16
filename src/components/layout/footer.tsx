import Link from "next/link";
import { NERVA_INFO } from "@/lib/config";
import { Github, Globe, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="sm:col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="bg-brand-gradient inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold text-white">
                N
              </span>
              <span className="text-base">NERVA Market</span>
            </Link>
            <p className="text-muted-foreground mt-3 max-w-xs text-sm">
              A community marketplace where goods are priced in {NERVA_INFO.ticker} —
              the CPU-minable privacy coin.
            </p>
          </div>

          <div>
            <h3 className="text-foreground mb-3 text-sm font-semibold">
              Marketplace
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/listings"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Browse listings
                </Link>
              </li>
              <li>
                <Link
                  href="/create-listing"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Become a vendor
                </Link>
              </li>
              <li>
                <Link
                  href="/cart"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Your cart
                </Link>
              </li>
              <li>
                <Link
                  href="/customer/orders"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Order history
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-foreground mb-3 text-sm font-semibold">
              Resources
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground hover:text-foreground"
                >
                  About NERVA
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a
                  href={NERVA_INFO.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <Globe className="h-3 w-3" />
                  getnerva.org
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/XelisVault/nerva-marketplace"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <Github className="h-3 w-3" />
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-foreground mb-3 text-sm font-semibold">
              Community
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://discord.gg/jsdbEns"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <MessageCircle className="h-3 w-3" />
                  Discord
                </a>
              </li>
              <li>
                <a
                  href="https://www.reddit.com/r/Nerva/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Reddit
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com/NervaCurrency"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Twitter / X
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="text-muted-foreground mt-8 flex flex-col items-start justify-between gap-2 border-t border-border/60 pt-6 text-xs sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} NERVA Marketplace. Open-source under
            the MIT license.
          </p>
          <p>
            Not affiliated with the official NERVA core project. Use at your
            own risk.
          </p>
        </div>
      </div>
    </footer>
  );
}
