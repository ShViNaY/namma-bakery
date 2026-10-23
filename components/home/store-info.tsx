import Link from "next/link";
import { Clock, MapPin, Store, ArrowUpRight, Search } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function StoreInfo() {
  const mapsUrl = "https://www.google.com/maps/search/?api=1&query=Namma+Bakery+BEML+Layout+3rd+Stage+Rajarajeshwari+Nagar+Bengaluru";

  return (
    <section className="py-14 sm:py-20 bg-card/60 border-b border-border overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Left Column: Location & Hours */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <ScrollReveal>
              <div>
                <span className="font-kannada text-xs font-medium text-caramel">
                  ನಮ್ಮ ಬೇಕರಿಗೆ ಭೇಟಿ ನೀಡಿ
                </span>
                <h2 className="mt-1 font-heading text-2xl font-semibold text-foreground sm:text-3xl">
                  Visit Us in Rajarajeshwari Nagar
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Fresh daily bakes, tea-time savouries, and celebration cakes made in the neighbourhood.
                  Order ahead online for scheduled counter pickup or visit us in person.
                </p>

                <div className="mt-8 space-y-4 text-sm">
                  <div className="flex items-start gap-3 rounded-sm border border-border bg-card p-4 transition-colors hover:border-caramel/40">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-caramel" />
                    <div>
                      <h3 className="font-heading font-semibold text-foreground">
                        Bakery Counter Address
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed sm:text-sm">
                        BEML Layout 3rd Stage, Rajarajeshwari Nagar, Bengaluru, Karnataka 560098
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-sm border border-border bg-card p-4 transition-colors hover:border-caramel/40">
                    <Clock className="mt-0.5 h-5 w-5 shrink-0 text-caramel" />
                    <div>
                      <h3 className="font-heading font-semibold text-foreground">
                        Bakery Timings
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                        Open Daily: 10:00 AM – 9:30 PM (All 7 Days)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-sm bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-caramel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
                >
                  <span>Get Directions</span>
                  <ArrowUpRight className="h-4 w-4" />
                </a>

                <Link
                  href="/menu"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-sm border border-border bg-card px-5 text-sm font-medium text-foreground transition-colors hover:bg-secondary hover:text-caramel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
                >
                  Explore Pickup Menu
                </Link>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Counter Pickup & Tracking Assurance */}
          <div className="lg:col-span-5">
            <ScrollReveal delayMs={160} className="h-full">
              <div className="h-full flex flex-col justify-between rounded-sm border border-border bg-card p-6 sm:p-8 transition-colors hover:border-caramel/40">
                <div>
                  <div className="flex items-center gap-2 text-caramel">
                    <Store className="h-5 w-5" />
                    <span className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
                      Counter Pickup
                    </span>
                  </div>

                  <h3 className="mt-3 font-heading text-xl font-semibold text-foreground">
                    How Pickup Works
                  </h3>
                  <ul className="mt-4 space-y-3 text-xs text-muted-foreground leading-relaxed sm:text-sm">
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-caramel">•</span>
                      <span>
                        <strong>Select Pickup Slot:</strong> Choose a convenient date and time window during checkout.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-caramel">•</span>
                      <span>
                        <strong>Baked Fresh on Time:</strong> Items are scheduled so your order is ready and waiting when you arrive.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-caramel">•</span>
                      <span>
                        <strong>Pay at Bakery Counter:</strong> Pay in-store during collection using UPI (GPay/PhonePe), Cards, or Cash.
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 border-t border-border pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-foreground">Already placed an order?</p>
                      <p className="text-[11px] text-muted-foreground">Follow live status with your order number.</p>
                    </div>
                    <Link
                      href="/track"
                      className="inline-flex min-h-[48px] items-center gap-1.5 text-xs font-semibold text-caramel transition-colors hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-caramel"
                    >
                      <Search className="h-3.5 w-3.5" />
                      <span>Track Order</span>
                    </Link>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}

