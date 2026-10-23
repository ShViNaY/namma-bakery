import * as React from "react";
import { Sparkles, Clock, HeartHandshake, ShieldCheck } from "lucide-react";

export function CustomCakeHero() {
  return (
    <div className="relative rounded-sm border border-border bg-card p-6 sm:p-10 mb-8 overflow-hidden">
      <div className="relative z-10 max-w-2xl space-y-4">
        <div className="inline-flex items-center gap-1.5 rounded-sm bg-caramel/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-caramel">
          <Sparkles className="size-3.5" />
          <span>Bespoke Celebration Cakes</span>
        </div>

        <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.15]">
          Custom Cakes for Your Most Special Moments
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          From multi-tier celebration cakes and themed cartoon characters to custom flavours and elegant wedding designs, our RR Nagar master bakers craft each cake fresh by hand.
        </p>

        {/* Value Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-foreground font-medium">
            <HeartHandshake className="size-4 text-caramel shrink-0" />
            <span>100% Handcrafted</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground font-medium">
            <Clock className="size-4 text-caramel shrink-0" />
            <span>24-48 hr Lead Time</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground font-medium">
            <ShieldCheck className="size-4 text-caramel shrink-0" />
            <span>Pure Vegetarian Eggless Available</span>
          </div>
        </div>
      </div>
    </div>
  );
}
