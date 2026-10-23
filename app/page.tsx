import type { Metadata } from "next";
import { getMenuCategories, getMenuProducts } from "@/lib/menu/queries";
import { getBakeryJsonLd } from "@/lib/utils/seo";
import { HeroSection } from "@/components/home/hero-section";
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

      {/* 1. Hero Section (Editorial Split with Real Storefront Image) */}
      <HeroSection />

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
