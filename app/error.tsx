"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error safely to client console for diagnostics without exposing internal details in UI
    console.error("[Namma Bakery] Application runtime error captured:", error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6 sm:py-24">
      <div className="flex max-w-md flex-col items-center text-center">
        {/* Error icon badge */}
        <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-destructive/10 text-destructive">
          <AlertCircle className="h-7 w-7 stroke-[1.5]" aria-hidden="true" />
        </div>

        {/* Kannada language indicator */}
        <span className="mt-4 font-kannada text-xs font-semibold text-caramel">
          ಕ್ಷಮಿಸಿ, ದೋಷ ಸಂಭವಿಸಿದೆ
        </span>

        {/* Heading */}
        <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Something Went Wrong
        </h1>

        {/* Friendly explanation without revealing stack traces or internals */}
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          We encountered an unexpected issue while preparing this page. Please try refreshing, or return to our bakery storefront.
        </p>

        {/* Action buttons with minimum 48px touch targets */}
        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex min-touch-target h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-sm bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-caramel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="inline-flex min-touch-target h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-sm border border-border bg-card px-5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-secondary hover:text-caramel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
