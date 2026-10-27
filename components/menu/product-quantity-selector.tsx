"use client";

import { Minus, Plus } from "lucide-react";
import { formatPaise } from "@/lib/utils/money";

interface ProductQuantitySelectorProps {
  quantity: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  productName: string;
  unitPricePaise?: number | null;
}

export function ProductQuantitySelector({
  quantity,
  onChange,
  min = 1,
  max = 20,
  disabled = false,
  productName,
  unitPricePaise,
}: ProductQuantitySelectorProps) {
  const canDecrease = !disabled && quantity > min;
  const canIncrease = !disabled && quantity < max;

  const handleDecrement = () => {
    if (canDecrease) {
      onChange(Math.max(min, quantity - 1));
    }
  };

  const handleIncrement = () => {
    if (canIncrease) {
      onChange(Math.min(max, quantity + 1));
    }
  };

  const labelId = `qty-label-${productName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col">
        <span
          id={labelId}
          className="text-xs font-medium uppercase tracking-wider text-foreground"
        >
          Quantity
        </span>
        {quantity > 1 && typeof unitPricePaise === "number" && unitPricePaise > 0 ? (
          <span className="text-[11px] text-muted-foreground">
            {formatPaise(unitPricePaise)} each
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">
            Max {max} per item
          </span>
        )}
      </div>

      <div
        role="group"
        aria-labelledby={labelId}
        aria-label={`Quantity selector for ${productName}`}
        className="inline-flex items-center rounded-sm border border-border bg-background"
      >
        <button
          type="button"
          disabled={!canDecrease}
          onClick={handleDecrement}
          aria-label={`Decrease quantity of ${productName}`}
          className="flex h-12 w-12 min-h-[48px] min-w-[48px] items-center justify-center text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>

        <span
          className="flex h-12 min-h-[48px] min-w-[44px] select-none items-center justify-center px-3 text-sm font-semibold tabular-nums text-foreground"
          aria-live="polite"
          aria-atomic="true"
        >
          {quantity}
        </span>

        <button
          type="button"
          disabled={!canIncrease}
          onClick={handleIncrement}
          aria-label={`Increase quantity of ${productName}`}
          className="flex h-12 w-12 min-h-[48px] min-w-[48px] items-center justify-center text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
