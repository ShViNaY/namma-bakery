"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { useCart } from "@/lib/cart/context";
import {
  customerDetailsSchema,
  type CustomerDetailsFormInput,
} from "@/lib/checkout/validation";
import { placeOrderAction } from "@/lib/orders/actions";
import { CustomerDetailsForm } from "./customer-details-form";
import { CheckoutPickupSummary } from "./checkout-pickup-summary";
import { PaymentMethodNote } from "./payment-method-note";
import { CheckoutOrderSummary } from "./checkout-order-summary";

export function CheckoutForm() {
  const router = useRouter();
  const {
    items,
    itemCount,
    subtotalPaise,
    isEmpty,
    isHydrated,
    pickupDate,
    pickupSlot,
    clearCart,
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

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

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
      if (submitError) {
        setSubmitError(null);
      }
    },
    [submitError]
  );

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    // 1. Guard against empty cart or missing pickup slot
    if (isEmpty || !pickupSlot?.slotStart) {
      setSubmitError("Please ensure you have items and a pickup slot selected.");
      return;
    }

    // 2. Validate customer details
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

      // Focus first invalid input
      const firstErrorField = Object.keys(fieldErrors)[0];
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        element?.focus();
      }
      return;
    }

    setErrors({});
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      // 3. Prepare payload for server-side verification and order placement
      const itemsPayload = items.map((item) => ({
        productId: item.productId,
        kind: item.kind,
        variantId: item.variantId,
        quantity: item.quantity,
        cakeConfig: item.configuration
          ? {
              weightGrams: item.configuration.weightGrams,
              eggType: item.configuration.eggType,
              finish: item.configuration.finish,
            }
          : undefined,
        cakeMessage:
          item.kind === "TIERED_CAKE" && result.data.customerNotes
            ? result.data.customerNotes.slice(0, 60)
            : undefined,
      }));

      const actionResult = await placeOrderAction({
        customerDetails: result.data,
        pickupSlotStart: pickupSlot.slotStart,
        items: itemsPayload,
      });

      if (!actionResult.success) {
        setSubmitError(actionResult.error);
        setIsSubmitting(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      // 4. On confirmed success: clear cart state and redirect to order tracking route
      clearCart();
      router.push(`/orders/${actionResult.publicToken}?confirmed=true`);
    } catch (err) {
      console.error("[CheckoutForm] Submission failed:", err);
      setSubmitError(
        "A connection issue occurred while submitting your order. Please check your network and try again."
      );
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
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
          ಆರ್ಡರ್ ಪರಿಶೀಲನೆ ಮತ್ತು ದೃಢೀಕರಣ
        </span>
        <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Bakery Checkout
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
          Review your order details and provide contact information for store pickup in RR Nagar.
        </p>
      </div>

      {/* Submission Error Banner */}
      {submitError && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-8 flex items-start gap-3 rounded-sm border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive dark:bg-destructive/20 sm:text-sm animate-in fade-in"
        >
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-semibold">Unable to place order</p>
            <p className="leading-relaxed text-destructive/90">{submitError}</p>
          </div>
        </div>
      )}

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
              You must select an available pickup date and time slot before your order can be placed.
            </p>
            <Link
              href="/cart"
              className="inline-flex min-touch-target h-12 items-center justify-center rounded-sm bg-caramel px-4 text-xs font-semibold text-white transition-colors hover:bg-caramel/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
            >
              Choose Pickup Slot in Cart →
            </Link>
          </div>
        </div>
      )}

      {/* Main Grid: Form on left, Summary on right */}
      <form onSubmit={handleSubmitOrder} noValidate>
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
                disabled={!isPickupValid || isSubmitting}
                className={`flex h-12 w-full items-center justify-center gap-2 rounded-sm text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel ${
                  isPickupValid && !isSubmitting
                    ? "bg-caramel text-white shadow-sm hover:bg-caramel/90 active:scale-[0.99]"
                    : "cursor-not-allowed bg-muted text-muted-foreground"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Placing Order with Bakery...</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {!isPickupValid
                        ? "Select Pickup Slot to Continue"
                        : "Place Order (Pay at Bakery)"}
                    </span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-caramel/70 shrink-0" aria-hidden="true" />
                <span>
                  No payment required right now. Pay when you collect at the bakery counter.
                </span>
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
