"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, ShoppingBag } from "lucide-react";
import type { ProductVariant } from "@/lib/menu/types";
import { formatPaise } from "@/lib/utils/money";
import { useCart } from "@/lib/cart/context";
import { generateCartItemKey } from "@/lib/cart/key";

interface ProductVariantPickerProps {
  product: {
    id: string;
    slug: string;
    name: string;
    name_kn?: string | null;
    is_available: boolean;
    orderable_online: boolean;
    requires_confirmation: boolean;
  };
  categorySlug: string;
  variants?: ProductVariant[];
  startingPricePaise?: number | null;
}

export function ProductVariantPicker({
  product,
  categorySlug,
  variants = [],
  startingPricePaise,
}: ProductVariantPickerProps) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(false), 4000);
    return () => clearTimeout(timer);
  }, [justAdded]);

  const availableVariants = variants.filter(
    (v) => v.is_available && v.price_paise > 0
  );

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    availableVariants[0]?.id ?? ""
  );

  const activeVariant =
    availableVariants.find((v) => v.id === selectedVariantId) ??
    availableVariants[0];

  const hasDefinedVariants = variants.length > 0;

  const currentPricePaise = activeVariant
    ? activeVariant.price_paise
    : !hasDefinedVariants &&
      typeof startingPricePaise === "number" &&
      startingPricePaise > 0
    ? startingPricePaise
    : null;

  const isOrderable = product.is_available && product.orderable_online;
  const canAddToCart =
    isOrderable &&
    currentPricePaise !== null &&
    (!hasDefinedVariants || activeVariant !== undefined);

  const handleAddToCart = () => {
    if (!canAddToCart || currentPricePaise === null) return;

    const itemKey = generateCartItemKey({
      productId: product.id,
      kind: "SIMPLE",
      variantId: activeVariant?.id,
    });

    addItem({
      itemKey,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      productNameKn: product.name_kn,
      categorySlug,
      kind: "SIMPLE",
      variantId: activeVariant?.id,
      variantLabel: activeVariant?.label,
      unitPricePaise: currentPricePaise,
      quantity: 1,
    });

    setJustAdded(true);
  };

  return (
    <div className="flex flex-col gap-4 rounded-sm border border-border bg-card p-5 sm:p-6">
      {/* Price Display */}
      <div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Price
        </span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {currentPricePaise !== null
              ? formatPaise(currentPricePaise)
              : "Ask in store"}
          </span>
          {activeVariant && availableVariants.length > 1 && (
            <span className="text-xs text-muted-foreground">
              for {activeVariant.label}
            </span>
          )}
        </div>
      </div>

      {/* Multiple variants selector if applicable */}
      {availableVariants.length > 1 && (
        <div className="border-t border-border pt-4">
          <label className="block text-xs font-medium text-foreground uppercase tracking-wider">
            Select Portion / Size
          </label>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {availableVariants.map((variant) => {
              const isSelected = variant.id === activeVariant?.id;

              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedVariantId(variant.id)}
                  className={`flex h-12 items-center justify-between gap-3 rounded-sm px-4 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel ${
                    isSelected
                      ? "border-2 border-caramel bg-caramel/10 text-caramel font-semibold"
                      : "border border-border bg-card text-foreground hover:bg-secondary"
                  }`}
                >
                  <span>{variant.label}</span>
                  <span className="text-muted-foreground">
                    {formatPaise(variant.price_paise)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Add to Cart Action */}
      <div className="border-t border-border pt-4 flex flex-col gap-3">
        <button
          type="button"
          disabled={!canAddToCart}
          onClick={handleAddToCart}
          aria-label={
            currentPricePaise !== null
              ? `Add ${product.name}${
                  activeVariant ? ` (${activeVariant.label})` : ""
                } to cart for ${formatPaise(currentPricePaise)}`
              : "Product cannot be added to cart"
          }
          className={`flex h-12 w-full items-center justify-center gap-2 rounded-sm px-6 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel ${
            canAddToCart
              ? "bg-caramel text-white hover:bg-caramel/90 active:scale-[0.99]"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          <ShoppingBag className="h-4 w-4" aria-hidden="true" />
          <span>
            {!product.is_available
              ? "Currently Unavailable"
              : !product.orderable_online
              ? "Available In-Store Only"
              : currentPricePaise !== null
              ? `Add to Cart • ${formatPaise(currentPricePaise)}`
              : "Unavailable"}
          </span>
        </button>

        {/* Confirmation feedback */}
        {justAdded && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center justify-between rounded-sm border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-900 transition-all animate-in fade-in"
          >
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-700" />
              <span className="font-medium">Added to cart!</span>
            </div>
            <Link
              href="/cart"
              className="font-semibold text-emerald-800 underline hover:text-emerald-950 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-700"
            >
              View Cart →
            </Link>
          </div>
        )}

        {product.requires_confirmation && isOrderable && (
          <p className="text-[11px] text-muted-foreground">
            * This item requires confirmation from our kitchen team after order placement.
          </p>
        )}
      </div>
    </div>
  );
}
