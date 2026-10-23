"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart/context";
import { formatPaise } from "@/lib/utils/money";
import {
  formatCakeFinish,
  formatEggType,
  formatWeightGrams,
} from "@/lib/menu/utils";
import { PickupSelector } from "@/components/pickup/pickup-selector";
import { formatPickupSelectionSummary } from "@/lib/pickup/utils";

export function CartView() {
  const {
    items,
    itemCount,
    subtotalPaise,
    isEmpty,
    isHydrated,
    pickupDate,
    pickupSlot,
    incrementQuantity,
    decrementQuantity,
    removeItem,
    clearCart,
  } = useCart();

  // Handle SSR and hydration gracefully
  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-muted/60" />
          <div className="h-40 rounded-sm border border-border bg-card/60" />
        </div>
      </div>
    );
  }

  // Empty cart state
  if (isEmpty) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-caramel/10 text-caramel">
            <ShoppingBag className="h-10 w-10" aria-hidden="true" />
          </div>
          <span className="mt-6 font-kannada text-sm font-medium text-caramel">
            ನಿಮ್ಮ ಕಾರ್ಟ್ ಖಾಲಿಯಾಗಿದೆ
          </span>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Your cart is empty
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            Looks like you haven&apos;t added any fresh bakes yet. Explore our
            handcrafted cakes, savoury puffs, and bakery delights fresh from RR Nagar.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/menu"
              className="inline-flex h-12 items-center justify-center rounded-sm bg-caramel px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-caramel/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
            >
              Explore Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Breadcrumb / Back Link */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Link
          href="/menu"
          className="inline-flex items-center gap-1 transition-colors hover:text-caramel focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-caramel"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Continue Shopping</span>
        </Link>
      </nav>

      {/* Page Title */}
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
        <div>
          <span className="font-kannada text-xs font-medium text-caramel">
            ನಮ್ಮ ಬೇಕರಿ ಶಾಪಿಂಗ್ ಕಾರ್ಟ್
          </span>
          <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Shopping Cart
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
          <button
            type="button"
            onClick={clearCart}
            className="inline-flex min-h-[44px] items-center px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-destructive"
          >
            Clear cart
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
        {/* Cart Items List & Pickup Selection */}
        <div className="lg:col-span-8 space-y-8">
          <div>
            <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-3">
              Items in your order
            </h2>
            <ul className="divide-y divide-border rounded-sm border border-border bg-card">
              {items.map((item) => {
                const lineTotalPaise = item.unitPricePaise * item.quantity;
                const productUrl = `/menu/${item.categorySlug}/${item.productSlug}`;

                return (
                  <li
                    key={item.itemKey}
                    className="flex flex-col gap-4 p-4 sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <Link
                            href={productUrl}
                            className="font-heading text-lg font-semibold text-foreground transition-colors hover:text-caramel focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-caramel"
                          >
                            {item.productName}
                          </Link>
                          {item.productNameKn && (
                            <span className="font-kannada text-xs text-caramel">
                              {item.productNameKn}
                            </span>
                          )}
                        </div>

                        {/* Configuration description */}
                        {item.kind === "TIERED_CAKE" && item.configuration && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatWeightGrams(item.configuration.weightGrams)} ·{" "}
                            {formatEggType(item.configuration.eggType)} ·{" "}
                            {formatCakeFinish(item.configuration.finish)}
                          </p>
                        )}

                        {item.kind === "SIMPLE" && item.variantLabel && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Size / Portion: {item.variantLabel}
                          </p>
                        )}

                        {/* Unit Price */}
                        <p className="mt-1 text-xs text-muted-foreground">
                          Unit price: {formatPaise(item.unitPricePaise)}
                        </p>
                      </div>

                      {/* Remove Action */}
                      <button
                        type="button"
                        onClick={() => removeItem(item.itemKey)}
                        aria-label={`Remove ${item.productName} from cart`}
                        className="flex min-h-[44px] min-w-[44px] h-11 w-11 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>

                    {/* Quantity and Line Total */}
                    <div className="flex items-center justify-between border-t border-border/50 pt-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground mr-1">
                          Qty:
                        </span>
                        <div className="inline-flex items-center rounded-sm border border-border bg-background">
                          <button
                            type="button"
                            disabled={item.quantity <= 1}
                            onClick={() => decrementQuantity(item.itemKey)}
                            aria-label={`Decrease quantity of ${item.productName}`}
                            className="flex min-h-[44px] min-w-[44px] h-11 w-11 items-center justify-center text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
                          >
                            <Minus className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <span
                            className="flex min-h-[44px] min-w-[44px] h-11 items-center justify-center px-3 text-sm font-semibold tabular-nums text-foreground"
                            aria-live="polite"
                          >
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => incrementQuantity(item.itemKey)}
                            aria-label={`Increase quantity of ${item.productName}`}
                            className="flex min-h-[44px] min-w-[44px] h-11 w-11 items-center justify-center text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
                          >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-muted-foreground block">
                          Line total
                        </span>
                        <span className="font-heading text-base font-bold text-foreground">
                          {formatPaise(lineTotalPaise)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Pickup Slot Scheduling Section */}
          <PickupSelector />

          <div>
            <Link
              href="/menu"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-caramel"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Continue shopping to add more treats</span>
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 rounded-sm border border-border bg-card p-5 sm:p-6">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Order Summary
            </h2>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <dt>Total Items</dt>
                <dd className="font-medium text-foreground">{itemCount}</dd>
              </div>

              {/* Pickup Summary Line */}
              <div className="border-t border-border pt-3">
                <dt className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5 mb-1">
                  <Calendar className="h-3.5 w-3.5 text-caramel" />
                  <span>Scheduled Pickup</span>
                </dt>
                <dd className="text-xs text-foreground">
                  {pickupDate && pickupSlot ? (
                    <div className="space-y-0.5">
                      <span className="font-semibold text-caramel block">
                        {formatPickupSelectionSummary(pickupDate)}
                      </span>
                      <span className="text-muted-foreground block font-medium">
                        Slot: {pickupSlot.formattedTime}
                      </span>
                    </div>
                  ) : (
                    <span className="text-amber-700 dark:text-amber-400 font-medium italic">
                      Please select a pickup slot
                    </span>
                  )}
                </dd>
              </div>

              <div className="flex justify-between border-t border-border pt-3">
                <dt className="font-semibold text-foreground">Subtotal</dt>
                <dd className="font-heading text-xl font-bold text-foreground">
                  {formatPaise(subtotalPaise)}
                </dd>
              </div>
            </dl>

            <div className="mt-4 rounded-sm border border-border/70 bg-secondary/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
              <p>
                ✓ All prices include taxes.
              </p>
              <p className="mt-1">
                Counter pickup at BEML Layout 3rd Stage, RR Nagar.
              </p>
            </div>

            {/* Proceed to Checkout Action */}
            <div className="mt-6 flex flex-col gap-2.5">
              {pickupDate && pickupSlot ? (
                <Link
                  href="/checkout"
                  className="flex h-12 w-full items-center justify-center rounded-sm bg-caramel text-sm font-semibold text-white shadow-sm transition-colors hover:bg-caramel/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
                >
                  Proceed to Checkout →
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex h-12 w-full items-center justify-center rounded-sm bg-muted text-sm font-semibold text-muted-foreground cursor-not-allowed"
                >
                  Select a Pickup Slot to Continue
                </button>
              )}

              <Link
                href="/menu"
                className="flex h-11 w-full items-center justify-center rounded-sm border border-border bg-card text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
              >
                Add More Items
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
