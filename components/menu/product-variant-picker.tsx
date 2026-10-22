"use client";

import { useState } from "react";
import type { ProductVariant } from "@/lib/menu/types";
import { formatPaise } from "@/lib/utils/money";

interface ProductVariantPickerProps {
  variants?: ProductVariant[];
  startingPricePaise?: number | null;
}

export function ProductVariantPicker({
  variants = [],
  startingPricePaise,
}: ProductVariantPickerProps) {
  const availableVariants = variants.filter(
    (v) => v.is_available && v.price_paise > 0
  );

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    availableVariants[0]?.id ?? ""
  );

  const activeVariant =
    availableVariants.find((v) => v.id === selectedVariantId) ??
    availableVariants[0];

  const displayedPrice = activeVariant
    ? activeVariant.price_paise
    : typeof startingPricePaise === "number"
    ? startingPricePaise
    : null;

  return (
    <div className="flex flex-col gap-4 rounded-sm border border-border bg-card p-5 sm:p-6">
      {/* Price Display */}
      <div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Price
        </span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {displayedPrice !== null ? formatPaise(displayedPrice) : "Ask in store"}
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
    </div>
  );
}
