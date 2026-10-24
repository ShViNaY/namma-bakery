import * as React from "react";
import Link from "next/link";
import { ShoppingBag, Edit2 } from "lucide-react";
import type { CartItem } from "@/lib/cart/types";
import { formatPaise } from "@/lib/utils/money";
import {
  formatCakeFinish,
  formatEggType,
  formatWeightGrams,
} from "@/lib/menu/utils";

interface CheckoutOrderSummaryProps {
  items: CartItem[];
  itemCount: number;
  subtotalPaise: number;
}

export function CheckoutOrderSummary({
  items,
  itemCount,
  subtotalPaise,
}: CheckoutOrderSummaryProps) {
  return (
    <div className="sticky top-24 rounded-sm border border-border bg-card p-5 sm:p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-caramel" aria-hidden="true" />
          <h3 className="font-heading text-lg font-semibold text-foreground">
            Order Review
          </h3>
        </div>
        <Link
          href="/cart"
          className="inline-flex min-touch-target items-center gap-1.5 text-xs font-semibold text-caramel hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-caramel"
        >
          <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Edit Cart</span>
        </Link>
      </div>

      {/* Items list */}
      <ul className="divide-y divide-border/60 max-h-80 overflow-y-auto pr-1">
        {items.map((item) => {
          const lineTotalPaise = item.unitPricePaise * item.quantity;

          return (
            <li key={item.itemKey} className="py-3 first:pt-0 last:pb-0 text-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-baseline gap-1.5">
                    <span className="font-semibold text-foreground text-sm">
                      {item.productName}
                    </span>
                    {item.productNameKn && (
                      <span className="font-kannada text-[11px] text-caramel">
                        {item.productNameKn}
                      </span>
                    )}
                  </div>

                  {/* Cake configuration */}
                  {item.kind === "TIERED_CAKE" && item.configuration && (
                    <p className="mt-0.5 text-muted-foreground text-[11px]">
                      {formatWeightGrams(item.configuration.weightGrams)} ·{" "}
                      {formatEggType(item.configuration.eggType)} ·{" "}
                      {formatCakeFinish(item.configuration.finish)}
                    </p>
                  )}

                  {/* Simple product variant */}
                  {item.kind === "SIMPLE" && item.variantLabel && (
                    <p className="mt-0.5 text-muted-foreground text-[11px]">
                      Portion: {item.variantLabel}
                    </p>
                  )}

                  <p className="mt-1 text-muted-foreground text-[11px]">
                    Qty: {item.quantity} × {formatPaise(item.unitPricePaise)}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-heading text-sm font-bold text-foreground">
                    {formatPaise(lineTotalPaise)}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Totals */}
      <dl className="border-t border-border pt-4 space-y-2.5 text-xs sm:text-sm">
        <div className="flex justify-between text-muted-foreground">
          <dt>Total Quantity</dt>
          <dd className="font-medium text-foreground">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </dd>
        </div>

        <div className="flex justify-between border-t border-border pt-3">
          <dt className="font-semibold text-foreground text-base">
            Order Total
          </dt>
          <dd className="font-heading text-xl font-bold text-foreground">
            {formatPaise(subtotalPaise)}
          </dd>
        </div>
      </dl>

      <div className="rounded-sm border border-border/70 bg-secondary/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
        <p>✓ All prices include taxes.</p>
        <p className="mt-1">
          Exact order amount. Payment is collected at the bakery during pickup.
        </p>
      </div>
    </div>
  );
}
