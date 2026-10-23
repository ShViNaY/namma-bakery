import Link from "next/link";
import { Clock, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Identity & Heritage */}
          <div>
            <div className="mb-2">
              <span className="font-kannada text-xs font-medium text-caramel">
                ನಮ್ಮ ಬೇಕರಿ
              </span>
              <h3 className="font-heading text-lg font-semibold text-foreground">
                Namma Bakery
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Handcrafted cakes, fresh savoury bakes, and everyday neighbourhood favourites
              in Rajarajeshwari Nagar.
            </p>
          </div>

          {/* Location & Timings */}
          <div>
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
              Visit Us
            </h4>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-caramel" />
                <span>BEML Layout 3rd Stage, Rajarajeshwari Nagar, Bengaluru</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-caramel" />
                <span>Open Daily: 10:00 AM – 9:30 PM</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
              Explore
            </h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/menu"
                  className="text-muted-foreground transition-colors hover:text-caramel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
                >
                  Bakery Menu
                </Link>
              </li>
              <li>
                <Link
                  href="/menu/cakes"
                  className="text-muted-foreground transition-colors hover:text-caramel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
                >
                  Cakes &amp; Pastries
                </Link>
              </li>
              <li>
                <Link
                  href="/orders"
                  className="text-muted-foreground transition-colors hover:text-caramel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
                >
                  Track Order
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          &copy; 2026 Namma Bakery. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
