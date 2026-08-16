"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ImageIcon } from "@/components/icons";

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

/**
 * Image component with graceful fallback to a placeholder if the source
 * 404s or fails to load (common with vendor-uploaded images).
 */
export function ImageWithFallback({
  src,
  alt,
  width = 400,
  height = 300,
  className,
  priority,
}: ImageWithFallbackProps) {
  const [errored, setErrored] = useState(false);

  if (errored || !src) {
    return (
      <div
        className={cn(
          "bg-muted/40 text-muted-foreground/50 flex aspect-[4/3] w-full items-center justify-center",
          className,
        )}
        aria-label={alt}
        role="img"
      >
        <ImageIcon className="h-10 w-10" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      onError={() => setErrored(true)}
      className={cn("h-full w-full object-cover", className)}
      unoptimized
    />
  );
}
