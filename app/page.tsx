import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, MapPin, Sparkles } from "lucide-react";
import { getMenuCategories, getMenuProducts } from "@/lib/menu/queries";
import { getBakeryJsonLd } from "@/lib/utils/seo";
import { PopularCakes } from "@/components/home/popular-cakes";
import { CategoryShowcase } from "@/components/home/category-showcase";
import { CustomCakeFeature } from "@/components/home/custom-cake-feature";
import { StoreInfo } from "@/components/home/store-info";

export const instant = false;

export const metadata: Metadata = {
  title: "Namma Bakery — Fresh Cakes & Bakes | RR Nagar, Bengaluru",
  description:
    "Handcrafted celebration cakes, savoury snacks, and baked treats in BEML Layout 3rd Stage, Rajarajeshwari Nagar, Bengaluru. Fresh daily baking with pure veg eggless options.",
  alternates: {
    canonical: "/",
  },
};

export default async function HomePage() {
  const [categoriesResult, productsResult] = await Promise.all([
    getMenuCategories(),
    getMenuProducts(),
  ]);

  const categories = categoriesResult.data ?? [];
  const products = productsResult.data ?? [];
  const jsonLd = getBakeryJsonLd();

  return (
    <div className="flex flex-col">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 1. Hero Section (Retained for Step 1) */}
      <section className="border-b border-border bg-card/40 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-secondary/80 px-3 py-1 text-xs text-caramel">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="font-kannada font-medium">ಆರ್ ಆರ್ ನಗರದ ನೆಚ್ಚಿನ ಬೇಕರಿ</span>
            <span className="text-muted-foreground">•</span>
            <span>BEML Layout, RR Nagar</span>
          </div>

          <h1 className="mt-6 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-5xl sm:leading-tight">
            Handcrafted Cakes &amp; Fresh Neighbourhood Bakes
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            From custom birthday celebrations to everyday tea-time savouries,
            every item at Namma Bakery is baked fresh with care in Bengaluru.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
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

          {/* Quick timing indicator */}
          <div className="mt-10 inline-flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-caramel" />
              Open Daily: 10:00 AM – 9:30 PM
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-caramel" />
              BEML Layout 3rd Stage, RR Nagar
            </span>
          </div>
        </div>
      </section>

      {/* 2. Popular Cakes / Signature Products */}
      <PopularCakes products={products} />

      {/* 3. Browse by Category */}
      <CategoryShowcase categories={categories} />

      {/* 4. Custom Cake Feature Band */}
      <CustomCakeFeature />

      {/* 5. Visit Us / Store Information */}
      <StoreInfo />
    </div>
  );
}
