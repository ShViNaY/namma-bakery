import { Suspense } from "react";
import type { Metadata } from "next";
import { CustomCakeHero } from "@/components/custom-cake/custom-cake-hero";
import { CustomCakeForm } from "@/components/custom-cake/custom-cake-form";

export const instant = false;

export const metadata: Metadata = {
  title: "Custom Cakes & Enquiries | Namma Bakery RR Nagar",
  description:
    "Order bespoke handcrafted celebration cakes in RR Nagar, Bengaluru. Theme cakes, wedding tiers, custom flavours, and eggless varieties made fresh.",
};

export default function CustomCakePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <CustomCakeHero />
      <Suspense
        fallback={
          <div className="rounded-sm border border-border bg-card p-12 text-center text-muted-foreground text-sm">
            Loading custom cake builder...
          </div>
        }
      >
        <CustomCakeForm />
      </Suspense>
    </div>
  );
}
