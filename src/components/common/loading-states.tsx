"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  label?: string;
  className?: string;
}

export function LoadingState({
  label = "Loading…",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[40vh] w-full flex-col items-center justify-center gap-3",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="text-primary h-8 w-8 animate-spin" />
      <p className="text-muted-foreground text-sm">{label}</p>
    </div>
  );
}

export function FullPageSpinner({ label }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <Loader2 className="text-primary h-10 w-10 animate-spin" />
      {label && <p className="text-muted-foreground text-sm">{label}</p>}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "border-destructive/30 bg-destructive/5 text-destructive flex min-h-[30vh] w-full flex-col items-center justify-center gap-2 rounded-lg border p-6 text-center",
        className,
      )}
      role="alert"
    >
      <p className="text-base font-semibold">{title}</p>
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border-border/60 flex min-h-[30vh] flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center">
      <p className="text-foreground text-base font-medium">{title}</p>
      {description && (
        <p className="text-muted-foreground max-w-md text-sm">{description}</p>
      )}
      {action}
    </div>
  );
}
