import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, MapPin, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative border-b border-border bg-card/25 py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left Column: Editorial Brand & Narrative */}
          <div className="flex flex-col justify-center space-y-6 lg:col-span-7">
            {/* Local Heritage Badge */}
            <div className="inline-flex w-fit items-center gap-2 rounded-sm border border-border bg-secondary/80 px-3 py-1 text-xs text-caramel">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="font-kannada font-medium">ಆರ್ ಆರ್ ನಗರದ ನೆಚ್ಚಿನ ಬೇಕರಿ</span>
              <span className="text-muted-foreground">•</span>
              <span>BEML Layout, RR Nagar</span>
            </div>

            {/* Display Headline */}
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-5xl xl:text-6xl sm:leading-[1.12]">
              Handcrafted Cakes &amp; Fresh Daily Bakes
            </h1>

            {/* Narrative Paragraph */}
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              From birthday celebration cakes to warm evening savouries, every recipe at
              Namma Bakery is prepared fresh with care in Bengaluru. Pure veg eggless options available daily.
            </p>

            {/* CTA Actions */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/menu"
                className="inline-flex min-h-[48px] h-12 items-center justify-center gap-2 rounded-sm bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-caramel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
              >
                <span>Explore Bakery Menu</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/menu/cakes"
                className="inline-flex min-h-[48px] h-12 items-center justify-center rounded-sm border border-border bg-card px-6 text-sm font-medium text-foreground transition-colors hover:bg-secondary hover:text-caramel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
              >
                Celebration Cakes
              </Link>
            </div>

            {/* Operational Indicators */}
            <div className="pt-3 border-t border-border/70 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-caramel shrink-0" />
                <span>Open Daily: 10:00 AM – 9:30 PM</span>
              </span>
              <span className="hidden sm:inline text-border">•</span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-caramel shrink-0" />
                <span>BEML Layout 3rd Stage, RR Nagar</span>
              </span>
            </div>
          </div>

          {/* Right Column: Real Bakery Storefront & Editorial Frame */}
          <div className="lg:col-span-5">
            <div className="group relative mx-auto w-full max-w-md lg:max-w-none">
              {/* Outer warm subtle decorative border backdrop */}
              <div className="relative aspect-4/3 sm:aspect-5/4 lg:aspect-4/3 w-full overflow-hidden rounded-sm border border-border bg-secondary/50 shadow-xs">
                <Image
                  src="/images/bakery/storefront.jpg"
                  alt="Namma Bakery storefront with illuminated Kannada signboard and warm bakery counter in BEML Layout 3rd Stage, RR Nagar, Bengaluru"
                  fill
                  priority
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 480px"
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
                />

                {/* Subtle gradient vignette to ensure contrast at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-cocoa/40 via-transparent to-transparent pointer-events-none" />

                {/* Editorial Storefront Badge */}
                <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 flex items-center gap-2 rounded-xs border border-cream/20 bg-cocoa/85 px-3 py-1.5 backdrop-blur-xs text-xs text-cream shadow-xs">
                  <span className="font-kannada font-semibold text-caramel">ನಮ್ಮ ಬೇಕರಿ</span>
                  <span className="text-cream/40">•</span>
                  <span className="text-cream/90 text-[11px]">BEML Layout 3rd Stage</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
