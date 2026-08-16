import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <img
              src="/nerva-coin-logo.png"
              alt="NERVA"
              className="h-5 w-5"
            />
            <span>NERVA Marketplace</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-foreground">
              About
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <a
              href="https://getnerva.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              getnerva.org
            </a>
            <a
              href="https://github.com/XelisVault/nerva-marketplace"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
