import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center sm:px-6">
      <p className="text-brand-gradient text-7xl font-bold tracking-tight">
        404
      </p>
      <h1 className="text-foreground mt-4 text-xl font-semibold">
        Page not found
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button asChild>
          <Link href="/">Back to home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/listings">Browse listings</Link>
        </Button>
      </div>
    </div>
  );
}
