import type { Metadata } from "next";
import { getMenuCategories, getMenuProducts } from "@/lib/menu/queries";
import { CategoryNav } from "@/components/menu/category-nav";
import { ProductGrid } from "@/components/menu/product-grid";
import { MenuEmptyState } from "@/components/menu/menu-empty-state";
import { MenuErrorState } from "@/components/menu/menu-error-state";
import { CustomCakeBanner } from "@/components/menu/custom-cake-banner";

export const instant = false;

export const metadata: Metadata = {
  title: "Menu — Namma Bakery | Handcrafted Cakes & Bakes",
  description:
    "Explore our complete bakery menu including fresh celebration cakes, sandwiches, mini pizzas, and soups in RR Nagar.",
};

export default async function MenuPage() {
  const categoriesResult = await getMenuCategories();
  const productsResult = await getMenuProducts();

  if (categoriesResult.error || productsResult.error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <MenuErrorState />
      </div>
    );
  }

  const categories = categoriesResult.data;
  const products = productsResult.data;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <span className="font-kannada text-xs font-medium text-caramel">
          ನಮ್ಮ ಬೇಕರಿ ಮೆನು
        </span>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Bakery Menu
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Fresh celebration cakes, savoury snacks, and neighbourhood classics.
        </p>
      </div>

      {/* Category Navigation */}
      {categories.length > 0 && (
        <div className="mb-8 border-b border-border pb-4">
          <CategoryNav categories={categories} />
        </div>
      )}

      {/* Custom Cake Enquiry Banner */}
      <CustomCakeBanner />

      {/* Product Catalog */}
      {products.length === 0 ? (
        <MenuEmptyState
          title="No menu items currently listed"
          message="We are currently updating our digital menu with fresh items. Please visit us in store or check back soon."
          showAllLink={false}
        />
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
