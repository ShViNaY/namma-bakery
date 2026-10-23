import Link from "next/link";
import { Sparkles, ArrowRight, HeartHandshake } from "lucide-react";

export function CustomCakeBanner() {
  return (
    <div className="rounded-sm border border-border bg-gradient-to-r from-card to-caramel/5 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 my-8">
      <div className="space-y-2 max-w-xl">
        <div className="inline-flex items-center gap-1.5 rounded-sm bg-caramel/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-caramel">
          <Sparkles className="size-3" />
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
          className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-sm bg-caramel px-5 text-xs font-semibold text-white transition-colors hover:bg-caramel/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
        >
          <HeartHandshake className="size-4" />
          <span>Enquire for Custom Cake</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
