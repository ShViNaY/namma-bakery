"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, MapPin, ArrowUp } from "lucide-react";
import { useRecommendationWidgetVisible } from "@/lib/recommendation-store";

export function Footer() {
  const isWidgetVisible = useRecommendationWidgetVisible();
  const [isReady, setIsReady] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Enable transitions after initial mount so initial page render doesn't animate
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBrandClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-7 sm:px-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {/* Identity & Heritage */}
          <div>
            <Link
              href="/"
              onClick={handleBrandClick}
              className="group inline-flex flex-col mb-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel rounded-xs"
            >
              <span className="font-kannada text-xs font-medium text-caramel">
                ನಮ್ಮ ಬೇಕರಿ
              </span>
              <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground transition-colors group-hover:text-caramel">
                Namma Bakery
              </h3>
            </Link>
            <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground max-w-sm">
              Handcrafted cakes, fresh savoury bakes, and everyday neighbourhood favourites
              in Rajarajeshwari Nagar.
            </p>
          </div>

          {/* Location & Timings */}
          <div>
            <h4 className="font-heading text-xs sm:text-sm font-semibold uppercase tracking-wider text-foreground">
              Visit Us
            </h4>
            <div className="mt-2 space-y-1.5 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-caramel" />
                <span>BEML Layout 3rd Stage, Rajarajeshwari Nagar, Bengaluru</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-caramel" />
                <span>Open Daily: 10:00 AM – 9:30 PM</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading text-xs sm:text-sm font-semibold uppercase tracking-wider text-foreground">
              Explore
            </h4>
            <ul className="mt-2 space-y-1 text-xs sm:text-sm">
              <li>
                <Link
                  href="/menu"
                  className="inline-flex py-1 text-muted-foreground transition-colors hover:text-caramel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
                >
                  Bakery Menu
                </Link>
              </li>
              <li>
                <Link
                  href="/custom-cake"
                  className="inline-flex py-1 text-muted-foreground transition-colors hover:text-caramel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
                >
                  Custom Cakes
                </Link>
              </li>
              <li>
                <Link
                  href="/orders"
                  className="inline-flex py-1 text-muted-foreground transition-colors hover:text-caramel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
                >
                  Track Order
                </Link>
              </li>
              <li>
                <Link
                  href="/custom-cake/track"
                  className="inline-flex py-1 text-muted-foreground transition-colors hover:text-caramel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
                >
                  Track Custom Cakes
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Back to Top action */}
        <div className="mt-5 flex justify-center sm:justify-end">
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Back to top"
            className="inline-flex min-h-[44px] sm:min-h-[36px] items-center gap-1.5 rounded-sm border border-border/80 bg-background/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-caramel/50 hover:bg-secondary/40 hover:text-caramel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel cursor-pointer"
          >
            <ArrowUp className="h-3.5 w-3.5 text-caramel" aria-hidden="true" />
            <span>Back to Top</span>
          </button>
        </div>

        <div className="mt-4 border-t border-border pt-4 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-muted-foreground">
          <p>&copy; 2026 Namma Bakery. Handcrafted in Bengaluru. All rights reserved.</p>
          <div
            className={`flex items-center gap-4 ${
              isReady ? "staff-portal-transition" : ""
            } ${isWidgetVisible ? "staff-portal-offset-active" : ""}`}
          >
            <Link
              href="/staff/login"
              className="inline-flex py-1 hover:text-caramel transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-caramel"
            >
              Staff Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
