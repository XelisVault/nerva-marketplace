"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { FullPageSpinner } from "@/components/common/loading-states";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If true, only vendors can access this route. */
  vendorOnly?: boolean;
  /** Where to redirect after sign-in. Defaults to current path. */
  redirectTo?: string;
}

/**
 * Client-side route guard.
 *
 * - While auth is still loading, shows a spinner.
 * - If unauthenticated, redirects to /login with `?from=…` so the user
 *   returns to the protected page after sign-in.
 * - If `vendorOnly` and the user is not a vendor, shows an "not authorized"
 *   message instead of redirecting (so they know why they can't access it).
 */
export function ProtectedRoute({
  children,
  vendorOnly = false,
  redirectTo,
}: ProtectedRouteProps) {
  const { user, authChecked, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authChecked) return;
    if (!user) {
      const from = redirectTo ?? window.location.pathname;
      router.replace(`/login?from=${encodeURIComponent(from)}`);
    }
  }, [authChecked, user, router, redirectTo]);

  if (!authChecked || loading) {
    return <FullPageSpinner label="Checking your session…" />;
  }

  if (!user) {
    return <FullPageSpinner label="Redirecting to sign-in…" />;
  }

  if (vendorOnly && !(user.is_vendor === 1 || user.is_vendor === true)) {
    return (
      <div className="border-border/60 bg-muted/30 mx-auto mt-16 max-w-md rounded-lg border p-8 text-center">
        <h1 className="text-foreground text-lg font-semibold">
          Vendor account required
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          This page is only available to vendor accounts. Contact an
          administrator if you believe this is an error.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
