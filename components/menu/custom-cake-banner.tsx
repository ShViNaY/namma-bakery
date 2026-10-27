"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, HeartHandshake, X } from "lucide-react";

const PROMO_STORAGE_KEY = "namma_bakery_custom_cake_promo_v1";

const subscribe = (callback: () => void) => {
  if (typeof window !== "undefined") {
    window.addEventListener("storage", callback);
    return () => window.removeEventListener("storage", callback);
  }
  return () => {};
};

function getDismissedSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(PROMO_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function getServerSnapshot(): boolean {
  return false;
}

export function CustomCakeBanner() {
  const [manualDismissed, setManualDismissed] = useState(false);

  // Sync with localStorage safely across client/server without hydration mismatch
  const storedDismissed = useSyncExternalStore(
    subscribe,
    getDismissedSnapshot,
    getServerSnapshot
  );

  const isDismissed = storedDismissed || manualDismissed;

  const handleDismiss = () => {
    setManualDismissed(true);
    try {
      localStorage.setItem(PROMO_STORAGE_KEY, "true");
    } catch {
      // localStorage may be disabled in restricted browsing mode
    }
  };

  if (isDismissed) {
    return null;
  }

  return (
    <aside
      aria-label="Custom celebration cake promotion"
      className="relative rounded-sm border border-border bg-gradient-to-r from-card to-caramel/5 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 my-8"
    >
      {/* Dismiss Button */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss custom cake promotion"
        title="Dismiss custom cake promotion"
        className="absolute top-2 right-2 sm:top-3 sm:right-3 flex h-12 w-12 min-h-[48px] min-w-[48px] shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel cursor-pointer"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-secondary/60 text-foreground/80 border border-border/60 transition-colors hover:bg-secondary hover:text-foreground">
          <X className="size-4 stroke-[2.2]" aria-hidden="true" />
        </span>
      </button>

      <div className="space-y-2 max-w-xl pr-10 md:pr-0">
        <div className="inline-flex items-center gap-1.5 rounded-sm bg-caramel/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-caramel">
          <Sparkles className="size-3" aria-hidden="true" />
          <span>Bespoke Bakery Service</span>
        </div>
        <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
          Looking for a Custom Celebration Cake?
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Need a specific cartoon theme, multi-tier wedding design, or custom flavour? Submit a design enquiry and our master bakers in RR Nagar will craft your dream cake.
        </p>
      </div>

      <div className="shrink-0 w-full sm:w-auto">
        <Link
          href="/custom-cake"
          className="inline-flex min-h-[48px] h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-sm bg-caramel px-5 text-xs font-semibold text-white transition-colors hover:bg-caramel/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
        >
          <HeartHandshake className="size-4" aria-hidden="true" />
          <span>Enquire for Custom Cake</span>
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}
