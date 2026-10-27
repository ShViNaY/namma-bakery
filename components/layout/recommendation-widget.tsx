"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  X,
  Cake,
  Sandwich,
  Pizza,
  Soup,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

const STORAGE_KEY = "namma_bakery_recommendation_prompt_v1";

interface CategoryOption {
  slug: string;
  name: string;
  nameKn: string;
  description: string;
  icon: typeof Cake;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    slug: "cakes",
    name: "Cakes",
    nameKn: "ಕೇಕ್ಗಳು",
    description: "Celebration cakes & fresh slices",
    icon: Cake,
  },
  {
    slug: "sandwiches",
    name: "Sandwiches",
    nameKn: "ಸ್ಯಾಂಡ್‌ವಿಚ್‌ಗಳು",
    description: "Grilled & savory fresh toasts",
    icon: Sandwich,
  },
  {
    slug: "mini-pizzas",
    name: "Mini pizzas",
    nameKn: "ಮಿನಿ ಪಿಜ್ಜಾಗಳು",
    description: "Oven-baked cheese & veggie crusts",
    icon: Pizza,
  },
  {
    slug: "soups",
    name: "Soups",
    nameKn: "ಸೂಪ್‌ಗಳು",
    description: "Warm sweet corn & tomato classics",
    icon: Soup,
  },
];

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
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function getServerSnapshot(): boolean {
  return false;
}

export function RecommendationWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [manualDismissed, setManualDismissed] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Sync with localStorage safely across client/server without hydration mismatch
  const storedDismissed = useSyncExternalStore(
    subscribe,
    getDismissedSnapshot,
    getServerSnapshot
  );

  const isPromptDismissed = storedDismissed || manualDismissed;

  // Close panel on route change using React's recommended state-during-render pattern
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsOpen(false);
  }

  // Handle Escape key to close the recommendations panel
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Do not render on admin, staff, checkout, or cart pages to avoid interfering with orders
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/checkout") ||
    pathname === "/cart"
  ) {
    return null;
  }

  // If dismissed, hide the entire widget
  if (isPromptDismissed) {
    return null;
  }

  const handleDismissPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    setManualDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // localStorage may be disabled in restricted browsing mode
    }
  };

  return (
    <>
      {/* Backdrop overlay for mobile when panel is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px] sm:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Floating Widget Container */}
      <div className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-30 flex flex-col items-end">
        {/* Recommendation Popover Panel */}
        {isOpen && (
          <section
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Bakery menu recommendations"
            className="mb-3 w-[calc(100vw-2rem)] max-w-sm sm:w-96 rounded-sm border border-border bg-card p-4 sm:p-5 shadow-xl transition-all duration-200 animate-in fade-in zoom-in-95"
          >
            {/* Panel Header */}
            <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
              <div>
                <span className="font-kannada text-xs font-medium text-caramel leading-none block mb-0.5">
                  ಇಂದು ಏನು ಇಷ್ಟಪಡುತ್ತೀರಿ?
                </span>
                <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
                  What sounds good today?
                </h2>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Browse our freshly baked selections handcrafted daily in RR Nagar.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  triggerRef.current?.focus();
                }}
                aria-label="Close recommendations panel"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            {/* Category Quick Links Grid */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CATEGORY_OPTIONS.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.slug}
                    href={`/menu/${item.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="group flex items-start gap-2.5 rounded-sm border border-border bg-background p-2.5 transition-colors hover:border-caramel hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-caramel/10 text-caramel transition-colors group-hover:bg-caramel group-hover:text-white mt-0.5">
                      <IconComponent className="size-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-foreground group-hover:text-caramel">
                          {item.name}
                        </span>
                        <span className="font-kannada text-[10px] text-muted-foreground">
                          {item.nameKn}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Secondary Action Links */}
            <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
              <Link
                href="/menu"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center gap-1 font-medium text-foreground hover:text-caramel transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-caramel"
              >
                <span>All items</span>
                <ChevronRight className="size-3" aria-hidden="true" />
              </Link>
              <Link
                href="/custom-cake"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center gap-1 font-medium text-caramel hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-caramel"
              >
                <span>Custom cake enquiry</span>
                <ArrowRight className="size-3" aria-hidden="true" />
              </Link>
            </div>
          </section>
        )}

        {/* Floating Recommendation Trigger Pill with visible dismiss X */}
        <div
          className="flex items-center rounded-full border border-crust bg-surface shadow-md backdrop-blur-xs transition-shadow duration-200 hover:shadow-lg dark:border-border dark:bg-card"
          role="region"
          aria-label="Recommendation assistance prompt"
        >
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-haspopup="dialog"
            className="flex min-h-[44px] items-center gap-2 py-2.5 pl-4 pr-3 text-xs sm:text-sm font-medium text-foreground transition-colors hover:text-caramel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel rounded-l-full cursor-pointer"
          >
            <Sparkles className="size-4 text-caramel shrink-0 animate-pulse" aria-hidden="true" />
            <span>Need help choosing?</span>
          </button>
          <div className="w-px h-6 bg-border shrink-0" aria-hidden="true" />
          <button
            type="button"
            onClick={handleDismissPrompt}
            aria-label="Dismiss recommendation prompt"
            title="Dismiss recommendation prompt"
            className="group/dismiss flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-r-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel cursor-pointer"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-foreground border border-border/80 shadow-2xs transition-all group-hover/dismiss:bg-muted group-hover/dismiss:border-caramel/40 group-active/dismiss:scale-95">
              <X className="size-4 stroke-[2.5]" aria-hidden="true" />
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
