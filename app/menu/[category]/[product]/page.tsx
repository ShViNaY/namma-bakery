import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Store } from "lucide-react";
import { getProductBySlug } from "@/lib/menu/queries";
import { formatLeadTime } from "@/lib/menu/utils";
import { ProductGallery } from "@/components/menu/product-gallery";
import { ProductBadges } from "@/components/menu/product-badges";
import { ProductOrderStatus } from "@/components/menu/product-order-status";
import { CakeConfigurator } from "@/components/menu/cake-configurator";
import { ProductVariantPicker } from "@/components/menu/product-variant-picker";
import { MenuErrorState } from "@/components/menu/menu-error-state";

export const instant = false;

interface ProductDetailPageProps {
  params: Promise<{ category: string; product: string }>;
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { category: categorySlug, product: productSlug } = await params;
  const { data: product } = await getProductBySlug(categorySlug, productSlug);

  if (!product) {
    return {
      title: "Product Not Found",
      robots: { index: false, follow: true },
    };
  }

  const categoryName = product.category?.name ?? "Menu";
  const desc =
    product.description ||
    `Fresh handcrafted ${product.name} available at Namma Bakery in BEML Layout 3rd Stage, Rajarajeshwari Nagar, Bengaluru. Available for counter pickup.`;

  return {
    title: `${product.name} — ${categoryName}`,
    description: desc,
    alternates: {
      canonical: `/menu/${categorySlug}/${productSlug}`,
    },
    openGraph: {
      title: `${product.name} — ${categoryName} | Namma Bakery`,
      description: desc,
      url: `/menu/${categorySlug}/${productSlug}`,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { category: categorySlug, product: productSlug } = await params;

  const { data: product, error } = await getProductBySlug(
    categorySlug,
    productSlug
  );

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <MenuErrorState message="Could not load product details right now." />
      </div>
    );
  }

  // If product not found or belongs to another category, trigger 404
  if (!product) {
    notFound();
  }

  const category = product.category;
  const leadTimeText = formatLeadTime(product.lead_time_minutes);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <Link
          href="/"
          className="transition-colors hover:text-caramel focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-caramel"
        >
          Home
        </Link>
        <span>/</span>
        <Link
          href="/menu"
          className="transition-colors hover:text-caramel focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-caramel"
        >
          Menu
        </Link>
        <span>/</span>
        {category && (
          <>
            <Link
              href={`/menu/${category.slug}`}
              className="transition-colors hover:text-caramel focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-caramel"
            >
              {category.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="font-medium text-foreground">{product.name}</span>
      </nav>

      {/* Main Grid: Gallery on left, Details on right */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
        {/* Left Column: Visual Media & Store Location Notice */}
        <div className="flex flex-col gap-6">
          <ProductGallery
            images={product.product_images}
            productName={product.name}
            kind={product.kind}
            categorySlug={category?.slug}
            productSlug={product.slug}
          />

          {/* Bakery Kitchen & Counter Pickup Note */}
          <div className="rounded-sm border border-border bg-secondary/30 p-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <Store className="h-4 w-4 text-caramel" />
              <span>Namma Bakery Kitchen &amp; Counter</span>
            </div>
            <p className="mt-1.5 leading-relaxed">
              All bakes and cakes are prepared fresh in our kitchen located at BEML
              Layout 3rd Stage, Rajarajeshwari Nagar.
            </p>
            <div className="mt-3 flex items-center gap-1.5 border-t border-border/50 pt-2 text-[11px]">
              <Clock className="h-3.5 w-3.5 text-caramel" />
              <span>Counter Hours: 10:00 AM – 9:30 PM (Daily)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Product Information & Live Configurator */}
        <div className="flex flex-col gap-6">
          {/* Header & Badges */}
          <div>
            <div className="mb-2">
              <ProductBadges
                isBestSeller={product.is_best_seller}
                isFeatured={product.is_featured}
                isNewArrival={product.is_new_arrival}
                isSeasonal={product.is_seasonal}
              />
            </div>

            <div className="flex flex-col gap-1">
              {product.name_kn && (
                <span className="font-kannada text-sm font-medium text-caramel">
                  {product.name_kn}
                </span>
              )}
              <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {product.name}
              </h1>
            </div>

            {category && (
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Category:{" "}
                <Link
                  href={`/menu/${category.slug}`}
                  className="text-caramel hover:underline"
                >
                  {category.name}
                </Link>
              </p>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              {product.description}
            </p>
          )}

          {/* Preparation / Lead Time Notice */}
          {leadTimeText && (
            <div className="inline-flex items-center gap-2 rounded-sm border border-border bg-card px-3.5 py-2 text-xs text-foreground">
              <Clock className="h-4 w-4 text-caramel" />
              <span>{leadTimeText}</span>
            </div>
          )}

          {/* Dynamic Configuration & Pricing */}
          {product.kind === "TIERED_CAKE" ? (
            <CakeConfigurator
              product={product}
              categorySlug={categorySlug}
              rules={product.price_tiers?.price_tier_rules ?? []}
              startingPricePaise={product.startingPricePaise}
            />
          ) : (
            <ProductVariantPicker
              product={product}
              categorySlug={categorySlug}
              variants={product.product_variants ?? []}
              startingPricePaise={product.startingPricePaise}
            />
          )}

          {/* Orderability Status Badge */}
          <ProductOrderStatus
            isAvailable={product.is_available}
            orderableOnline={product.orderable_online}
            requiresConfirmation={product.requires_confirmation}
          />

          {/* Back to Category Action */}
          <div className="pt-2 border-t border-border">
            <Link
              href={category ? `/menu/${category.slug}` : "/menu"}
              className="inline-flex min-h-[48px] items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-caramel focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-caramel"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>
                {category
                  ? `Back to all ${category.name}`
                  : "Back to Menu"}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
