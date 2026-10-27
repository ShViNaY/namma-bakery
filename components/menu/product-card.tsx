import Link from "next/link";
import Image from "next/image";
import { Cake, Clock, UtensilsCrossed, Soup } from "lucide-react";
import type { Product } from "@/lib/menu/types";
import { formatPaise } from "@/lib/utils/money";
import { hasMultiplePrices } from "@/lib/menu/utils";
import { resolvePrimaryProductImage } from "@/lib/menu/product-images";

interface ProductCardProps {
  product: Product;
}

function renderPlaceholderIcon(kind: string, categorySlug?: string) {
  if (kind === "TIERED_CAKE" || categorySlug === "cakes") {
    return <Cake className="h-12 w-12 stroke-[1.5]" />;
  }
  if (categorySlug === "soups") {
    return <Soup className="h-12 w-12 stroke-[1.5]" />;
  }
  return <UtensilsCrossed className="h-12 w-12 stroke-[1.5]" />;
}

export function ProductCard({ product }: ProductCardProps) {
  const formattedPrice =
    typeof product.startingPricePaise === "number" &&
    product.startingPricePaise > 0
      ? formatPaise(product.startingPricePaise)
      : null;

  const showFromPrice = hasMultiplePrices(product);
  const categorySlug = product.category?.slug ?? "cakes";

  const { url: imageUrl, alt: imageAlt } = resolvePrimaryProductImage(product);

  return (
    <Link
      href={`/menu/${categorySlug}/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-sm border border-border bg-card transition-all duration-300 hover:border-caramel/60 hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
    >
      {/* Visual Header / Image Placeholder */}
      <div className="relative flex aspect-16/9 sm:aspect-4/3 w-full items-center justify-center overflow-hidden border-b border-border bg-secondary/50 text-caramel/70 transition-colors duration-300 group-hover:bg-secondary/70">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover object-center transition-transform duration-500 ease-out sm:group-hover:scale-[1.025]"
          />
        ) : (
          <div className="p-6">
            {renderPlaceholderIcon(product.kind, product.category?.slug)}
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
          {product.is_best_seller && (
            <span className="rounded-xs border border-caramel/30 bg-caramel/10 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-caramel uppercase">
              Best Seller
            </span>
          )}
          {product.is_featured && !product.is_best_seller && (
            <span className="rounded-xs border border-border bg-card px-2 py-0.5 text-[11px] font-medium tracking-wide text-foreground uppercase">
              Featured
            </span>
          )}
          {!product.orderable_online && (
            <span className="rounded-xs border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground uppercase">
              In-Store Only
            </span>
          )}
        </div>
      </div>

      {/* Body Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Title & Kannada label */}
        <div className="mb-1">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-heading text-base font-semibold text-foreground transition-colors group-hover:text-caramel">
              {product.name}
            </h3>
            {product.name_kn && (
              <span className="font-kannada text-xs font-normal text-muted-foreground shrink-0">
                {product.name_kn}
              </span>
            )}
          </div>
        </div>

        {/* Description if present */}
        {product.description && (
          <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        )}

        {/* Meta (Lead time / category note) */}
        <div className="mt-auto pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          {product.lead_time_minutes > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-caramel" />
              <span>
                {product.lead_time_minutes >= 60
                  ? `${Math.round(product.lead_time_minutes / 60)} hrs prep`
                  : `${product.lead_time_minutes} mins prep`}
              </span>
            </span>
          ) : (
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {product.category?.name ?? "Bakery item"}
            </span>
          )}

          {/* Pricing */}
          <div className="text-right">
            {formattedPrice ? (
              <span className="font-heading text-sm font-semibold text-foreground">
                {showFromPrice ? `From ${formattedPrice}` : formattedPrice}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground italic">
                Ask in store
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
