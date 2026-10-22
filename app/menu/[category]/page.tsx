import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getCategoryBySlug,
  getMenuCategories,
  getMenuProducts,
} from "@/lib/menu/queries";
import { CategoryNav } from "@/components/menu/category-nav";
import { ProductGrid } from "@/components/menu/product-grid";
import { MenuEmptyState } from "@/components/menu/menu-empty-state";
import { MenuErrorState } from "@/components/menu/menu-error-state";

export const instant = false;

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const { data: category } = await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Category Not Found — Namma Bakery",
    };
  }

  return {
    title: `${category.name} — Namma Bakery Menu`,
    description:
      category.description ??
      `Freshly prepared ${category.name.toLowerCase()} at Namma Bakery in RR Nagar, Bengaluru.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: slug } = await params;

  const categoryResult = await getCategoryBySlug(slug);
  const categoriesResult = await getMenuCategories();

  if (categoryResult.error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <MenuErrorState message="Could not load this category right now." />
      </div>
    );
  }

  const category = categoryResult.data;

  // Clean 404 if category slug doesn't exist in Supabase
  if (!category) {
    notFound();
  }

  const { data: products, error: productsError } = await getMenuProducts({
    categoryId: category.id,
    categorySlug: category.slug,
  });

  if (productsError) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <MenuErrorState message="Could not load items for this category." />
      </div>
    );
  }

  const categories = categoriesResult.data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Breadcrumb back navigation */}
      <div className="mb-6">
        <Link
          href="/menu"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-caramel"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>All Menu Categories</span>
        </Link>
      </div>

      {/* Category Header */}
      <div className="mb-8">
        {category.name_kn && (
          <span className="font-kannada text-xs font-medium text-caramel">
            {category.name_kn}
          </span>
        )}
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {category.description}
          </p>
        )}
      </div>

      {/* Category Nav Tabs */}
      {categories.length > 0 && (
        <div className="mb-8 border-b border-border pb-4">
          <CategoryNav categories={categories} activeSlug={category.slug} />
        </div>
      )}

      {/* Products list */}
      {products.length === 0 ? (
        <MenuEmptyState
          title={`No items currently in ${category.name}`}
          message="We are currently updating the items in this category. Please check back shortly or explore our other freshly baked categories."
          showAllLink={true}
        />
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
