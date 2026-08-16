"use client";

import { cn } from "@/lib/utils";
import { Coins } from "@/components/icons";

interface NervaBadgeProps {
  price: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/** Format a NERVA amount: integers without decimals, fractional with up to 4 digits. */
export function formatXnv(price: number | undefined | null): string {
  if (price === null || price === undefined || Number.isNaN(price)) return "0";
  if (Number.isInteger(price)) return price.toString();
  return price.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

export function NervaBadge({ price, className, size = "md" }: NervaBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-2.5 py-1 gap-1.5",
    lg: "text-base px-3 py-1.5 gap-2",
  };
  const iconSize = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };

  return (
    <span
      className={cn(
        "bg-accent/60 text-accent-foreground inline-flex items-center rounded-full font-semibold",
        sizeClasses[size],
        className,
      )}
    >
      <Coins className={cn(iconSize[size], "text-primary")} />
      {formatXnv(price)} XNV
    </span>
  );
}
