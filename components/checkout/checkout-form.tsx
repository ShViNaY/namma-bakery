"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Edit2,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { useCart } from "@/lib/cart/context";
import { formatPaise } from "@/lib/utils/money";
import { formatPickupSelectionSummary } from "@/lib/pickup/utils";
import {
  customerDetailsSchema,
  type CustomerDetailsFormData,
  type CustomerDetailsFormInput,
} from "@/lib/checkout/validation";
import { CustomerDetailsForm } from "./customer-details-form";
import { CheckoutPickupSummary } from "./checkout-pickup-summary";
import { PaymentMethodNote } from "./payment-method-note";
import { CheckoutOrderSummary } from "./checkout-order-summary";

export function CheckoutForm() {
  const {
    items,
    itemCount,
    subtotalPaise,
    isEmpty,
    isHydrated,
    pickupDate,
    pickupSlot,
  } = useCart();

  const [formData, setFormData] = React.useState<CustomerDetailsFormInput>({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerNotes: "",
  });

  const [errors, setErrors] = React.useState<
    Partial<Record<keyof CustomerDetailsFormInput, string>>
  >({});

  const [validatedData, setValidatedData] =
    React.useState<CustomerDetailsFormData | null>(null);

  const [isReviewMode, setIsReviewMode] = React.useState(false);

  const handleFieldChange = React.useCallback(
    (field: keyof CustomerDetailsFormInput, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear specific field error as user types
      setErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
      // If user edits, dismiss the reviewed confirmation state
      if (isReviewMode) {
        setIsReviewMode(false);
      }
    },
    [isReviewMode]
  );

  const handleValidateAndReview = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate customer details
    const result = customerDetailsSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof CustomerDetailsFormInput, string>> =
        {};
      for (const issue of result.error.issues) {
        const path = issue.path[0] as keyof CustomerDetailsFormInput;
        if (path && !fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      }
      setErrors(fieldErrors);
      setIsReviewMode(false);

      // Scroll to first invalid input
      const firstErrorField = Object.keys(fieldErrors)[0];
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        element?.focus();
      }
      return;
    }

    setErrors({});
    setValidatedData(result.data);
    setIsReviewMode(true);

    // Scroll smoothly to the review card
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // SSR / Hydration placeholder
  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-muted/60" />
          <div className="h-64 rounded-sm border border-border bg-card/60" />
        </div>
      </div>
    );
  }

  // Empty cart state
  if (isEmpty) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 text-center">
        <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-caramel/10 text-caramel">
          <ShoppingBag className="h-10 w-10" aria-hidden="true" />
        </div>
        <span className="mt-6 font-kannada text-sm font-medium text-caramel block">
          ನಿಮ್ಮ ಕಾರ್ಟ್ ಖಾಲಿಯಾಗಿದೆ
        </span>
        <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Your cart is empty
        </h1>
        <p className="mt-3 max-w-md mx-auto text-sm leading-relaxed text-muted-foreground sm:text-base">
          You don&apos;t have any treats in your cart yet. Please select items from our menu before checking out.
        </p>
        <div className="mt-8">
          <Link
            href="/menu"
            className="inline-flex h-12 items-center justify-center rounded-sm bg-caramel px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-caramel/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
          >
            Explore Menu →
          </Link>
        </div>
      </div>
    );
  }

  const isPickupValid = Boolean(pickupDate && pickupSlot);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Navigation */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Link
          href="/cart"
          className="inline-flex items-center gap-1 transition-colors hover:text-caramel focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-caramel"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Cart &amp; Pickup</span>
        </Link>
      </nav>

      {/* Page Title */}
      <div className="mb-8 border-b border-border pb-6">
        <span className="font-kannada text-xs font-medium text-caramel block">
          ಆರ್ಡರ್ ಪರಿಶೀಲನೆ
        </span>
        <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Bakery Checkout
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
          Review your order details and provide contact information for store pickup.
        </p>
      </div>

      {/* Missing Pickup Alert */}
      {!isPickupValid && (
        <div
          role="alert"
          className="mb-8 flex items-start gap-3 rounded-sm border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400 mt-0.5" aria-hidden="true" />
          <div className="space-y-2">
            <p className="font-semibold text-sm">
              Pickup slot selection is required
            </p>
            <p className="leading-relaxed">
              You must select an available pickup date and time slot before your order can be reviewed or placed.
            </p>
            <Link
              href="/cart"
              className="inline-flex h-9 items-center justify-center rounded-sm bg-caramel px-4 text-xs font-semibold text-white transition-colors hover:bg-caramel/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
            >
              Choose Pickup Slot in Cart →
            </Link>
          </div>
        </div>
      )}

      {/* Review Mode Banner */}
      {isReviewMode && validatedData && isPickupValid && (
        <div
          role="status"
          aria-live="polite"
          className="mb-8 rounded-sm border border-emerald-300 bg-emerald-50/80 p-5 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200 space-y-3 animate-in fade-in"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <h2 className="font-heading text-lg font-bold">
              Checkout Details Verified &amp; Ready
            </h2>
          </div>

          <p className="text-xs leading-relaxed text-emerald-900/90 dark:text-emerald-300/90">
            All customer details, pickup time slot, and order items have been validated.
            You are ready for the next step.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-emerald-200/80 pt-3 text-xs">
            <div>
              <span className="text-emerald-800/80 font-medium block text-[11px] uppercase">
                Customer
              </span>
              <span className="font-semibold">{validatedData.customerName}</span>
              <span className="block text-[11px] text-muted-foreground">
                +91 {validatedData.customerPhone}
              </span>
            </div>

            <div>
              <span className="text-emerald-800/80 font-medium block text-[11px] uppercase">
                Scheduled Pickup
              </span>
              <span className="font-semibold">
                {formatPickupSelectionSummary(pickupDate!)}
              </span>
              <span className="block text-[11px] text-caramel font-medium">
                {pickupSlot?.formattedTime}
              </span>
            </div>

            <div>
              <span className="text-emerald-800/80 font-medium block text-[11px] uppercase">
                Payment
              </span>
              <span className="font-semibold">Pay at Bakery</span>
              <span className="block text-[11px] text-muted-foreground">
                Total: {formatPaise(subtotalPaise)}
              </span>
            </div>
          </div>

          {validatedData.customerNotes && (
            <div className="border-t border-emerald-200/60 pt-2 text-[11px]">
              <span className="font-semibold text-emerald-900">Notes / Cake Message:</span>{" "}
              <span>{validatedData.customerNotes}</span>
            </div>
          )}

          <div className="border-t border-emerald-300/80 pt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-800">
              <ShieldCheck className="h-4 w-4" />
              <span>Step 3.5 Complete — Ready for Order Placement in Step 3.6</span>
            </div>
            <button
              type="button"
              onClick={() => setIsReviewMode(false)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 underline hover:text-emerald-950 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-700"
            >
              <Edit2 className="h-3 w-3" />
              <span>Edit Details</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Form on left, Summary on right */}
      <form onSubmit={handleValidateAndReview} noValidate>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left Column: Customer details, Pickup details, Payment notice */}
          <div className="lg:col-span-7 space-y-6">
            {/* Customer Information Form */}
            <CustomerDetailsForm
              values={formData}
              onChange={handleFieldChange}
              errors={errors}
            />

            {/* Pickup Details Summary */}
            <CheckoutPickupSummary
              pickupDate={pickupDate}
              pickupSlot={pickupSlot}
            />

            {/* Payment Method Notice */}
            <PaymentMethodNote />

            {/* Action Buttons */}
            <div className="rounded-sm border border-border bg-card p-5 sm:p-6 space-y-4">
              <button
                type="submit"
                disabled={!isPickupValid}
                className={`flex h-12 w-full items-center justify-center rounded-sm text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel ${
                  isPickupValid
                    ? "bg-caramel text-white shadow-sm hover:bg-caramel/90 active:scale-[0.99]"
                    : "cursor-not-allowed bg-muted text-muted-foreground"
                }`}
              >
                <span>
                  {!isPickupValid
                    ? "Select Pickup Slot to Continue"
                    : isReviewMode
                    ? "Order Details Verified ✓"
                    : "Review & Confirm Order Details"}
                </span>
              </button>

              <div className="rounded-sm border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Next Step Notice:</span>{" "}
                Actual order submission and confirmation tracking will be enabled in Step 3.6.
              </div>
            </div>
          </div>

          {/* Right Column: Order Items Review Summary */}
          <div className="lg:col-span-5">
            <CheckoutOrderSummary
              items={items}
              itemCount={itemCount}
              subtotalPaise={subtotalPaise}
            />
          </div>
        </div>
      </form>
    </div>
  );
}
