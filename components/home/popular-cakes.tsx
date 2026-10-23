import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Product } from "@/lib/menu/types";
import { ProductCard } from "@/components/menu/product-card";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

interface PopularCakesProps {
  products: Product[];
}

export function PopularCakes({ products }: PopularCakesProps) {
  // Filter for tiered cakes or products marked as best sellers/featured
  const cakeProducts = products.filter(
    (p) => p.kind === "TIERED_CAKE" || p.category?.slug === "cakes"
  );

  // Take top 3 for the homepage display
  const popularList = cakeProducts
    .filter((p) => p.is_available)
    .slice(0, 3);

  if (popularList.length === 0) {
    return null;
  }

  return (
    <section className="border-b border-border py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollReveal>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="font-kannada text-xs font-medium text-caramel">
                ಜನಪ್ರಿಯ ಕೇಕ್‌ಗಳು
              </span>
              <h2 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">
                Popular Celebration Cakes
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Freshly baked for counter pickup in RR Nagar. Pure veg eggless options available.
              </p>
            </div>
            <Link
              href="/menu/cakes"
              className="inline-flex min-h-[48px] items-center gap-1.5 text-sm font-medium text-caramel transition-colors hover:text-caramel/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
            >
              <span>See all cakes</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </ScrollReveal>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {popularList.map((product, index) => (
            <ScrollReveal key={product.id} delayMs={index * 100}>
              <ProductCard product={product} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

