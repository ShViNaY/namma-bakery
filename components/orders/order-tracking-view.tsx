"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Store,
  MapPin,
  Calendar,
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Phone,
  Copy,
  Check,
} from "lucide-react";
import type { OrderStatus, OrderTrackDetails } from "@/lib/orders/types";
import { formatPaise } from "@/lib/utils/money";

interface OrderTrackingViewProps {
  order: OrderTrackDetails;
  isFreshConfirmation?: boolean;
}

const STATUS_STEPS: Array<{
  key: OrderStatus;
  label: string;
  description: string;
}> = [
  {
    key: "PENDING",
    label: "Order Received",
    description: "Received at bakery counter",
  },
  {
    key: "ACCEPTED",
    label: "Confirmed",
    description: "Scheduled for baking",
  },
  {
    key: "PREPARING",
    label: "Preparing Fresh",
    description: "Baking & decorating",
  },
  {
    key: "READY_FOR_PICKUP",
    label: "Ready for Pickup",
    description: "Waiting at bakery counter",
  },
  {
    key: "COMPLETED",
    label: "Collected",
    description: "Order completed",
  },
];

function getStepIndex(status: OrderStatus): number {
  switch (status) {
    case "PENDING":
      return 0;
    case "ACCEPTED":
      return 1;
    case "PREPARING":
      return 2;
    case "READY_FOR_PICKUP":
      return 3;
    case "COMPLETED":
      return 4;
    default:
      return -1;
  }
}

export function OrderTrackingView({
  order,
  isFreshConfirmation = false,
}: OrderTrackingViewProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyOrderNumber = () => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(order.order_number).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const stepIndex = getStepIndex(order.status);
  const isTerminalNegative =
    order.status === "REJECTED" ||
    order.status === "CANCELLED" ||
    order.status === "NO_SHOW";

  // Format pickup date and time in Asia/Kolkata
  const pickupDateObj = new Date(order.requested_pickup_at);
  const formattedPickupDate = isNaN(pickupDateObj.getTime())
    ? order.requested_pickup_at
    : pickupDateObj.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });

  const formattedPickupTime = isNaN(pickupDateObj.getTime())
    ? ""
    : pickupDateObj.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Fresh Confirmation Success Banner */}
      {isFreshConfirmation && (
        <div
          role="status"
          aria-live="polite"
          className="mb-8 rounded-sm border border-emerald-300 bg-emerald-50/90 p-5 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200 animate-in fade-in"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <span className="font-kannada text-xs font-semibold text-emerald-800 dark:text-emerald-300 block">
                ಆರ್ಡರ್ ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ
              </span>
              <h2 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
                Thank you{order.first_name ? `, ${order.first_name}` : ""}! Your order has been placed.
              </h2>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-emerald-900/90 dark:text-emerald-200/90 sm:text-sm">
            We have received your order details at Namma Bakery. Please note your order number below.
            You can bookmark this page to follow live preparation and pickup progress.
          </p>
        </div>
      )}

      {/* Main Order Card */}
      <div className="rounded-sm border border-border bg-card overflow-hidden shadow-sm">
        {/* Header: Order Number and Status Badge */}
        <div className="border-b border-border bg-card/60 p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
              Order Reference
            </span>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-mono text-2xl font-bold text-foreground">
                {order.order_number}
              </span>
              <button
                type="button"
                onClick={handleCopyOrderNumber}
                aria-label="Copy order number"
                className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-caramel transition-colors"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Current Status
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                order.status === "COMPLETED"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : order.status === "READY_FOR_PICKUP"
                  ? "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                  : isTerminalNegative
                  ? "bg-destructive/15 text-destructive dark:bg-destructive/30"
                  : "bg-caramel/15 text-caramel dark:bg-caramel/25"
              }`}
            >
              <Clock className="h-3 w-3" />
              {order.status.replace(/_/g, " ")}
            </span>
          </div>
        </div>

        {/* Status Stepper / Progress Timeline */}
        {!isTerminalNegative ? (
          <div className="border-b border-border p-5 sm:p-6 bg-muted/20">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Order Progress
            </h3>
            {/* Mobile Vertical Timeline (< 768px) */}
            <ol className="block md:hidden space-y-0" aria-label="Order progress timeline">
              {STATUS_STEPS.map((step, idx) => {
                const isPassed = stepIndex >= idx;
                const isCurrent = stepIndex === idx;
                const isCompleted = stepIndex > idx || (stepIndex === 4 && idx === 4);
                const isLast = idx === STATUS_STEPS.length - 1;

                return (
                  <li key={step.key} className="relative flex items-start gap-3.5">
                    {/* Stepper Node & Connecting Line */}
                    <div className="relative flex flex-col items-center self-stretch">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                          isCurrent && order.status !== "COMPLETED"
                            ? "border-2 border-caramel bg-caramel text-white shadow-sm ring-4 ring-caramel/20"
                            : isPassed
                            ? "border border-emerald-400 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "border border-border bg-card text-muted-foreground/60"
                        }`}
                        aria-hidden="true"
                      >
                        {isPassed && (!isCurrent || order.status === "COMPLETED") ? (
                          <Check className="h-4 w-4" strokeWidth={2.5} />
                        ) : isCurrent ? (
                          <Clock className="h-3.5 w-3.5" />
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </div>

                      {!isLast && (
                        <div
                          className={`w-0.5 flex-1 min-h-6 my-1 transition-colors ${
                            isCompleted
                              ? "bg-emerald-500/70 dark:bg-emerald-600/70"
                              : "bg-border"
                          }`}
                          aria-hidden="true"
                        />
                      )}
                    </div>

                    {/* Step Content */}
                    <div className={`flex flex-col ${isLast ? "pb-1" : "pb-5"}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-sm font-semibold tracking-tight ${
                            isCurrent
                              ? "text-foreground font-bold"
                              : isPassed
                              ? "text-foreground"
                              : "text-muted-foreground/70"
                          }`}
                        >
                          {step.label}
                        </span>

                        {isCurrent && order.status !== "COMPLETED" && (
                          <span className="inline-flex items-center rounded-full bg-caramel/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-caramel">
                            Current Step
                          </span>
                        )}
                        {order.status === "COMPLETED" && idx === 4 && (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                            Completed
                          </span>
                        )}

                        <span className="sr-only">
                          {isCurrent
                            ? "(Current step)"
                            : isPassed
                            ? "(Completed)"
                            : "(Upcoming)"}
                        </span>
                      </div>

                      <p
                        className={`mt-0.5 text-xs leading-relaxed ${
                          isCurrent
                            ? "text-foreground/80 font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        {step.description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>

            {/* Desktop / Tablet Horizontal Grid (>= 768px) */}
            <div className="hidden md:grid md:grid-cols-5 md:gap-2">
              {STATUS_STEPS.map((step, idx) => {
                const isPassed = stepIndex >= idx;
                const isCurrent = stepIndex === idx;

                return (
                  <div
                    key={step.key}
                    className={`relative rounded-sm border p-3 transition-colors ${
                      isCurrent
                        ? "border-caramel bg-caramel/10 text-foreground ring-1 ring-caramel"
                        : isPassed
                        ? "border-emerald-300 bg-emerald-50/50 text-foreground dark:border-emerald-900/40 dark:bg-emerald-950/10"
                        : "border-border/60 bg-card/40 text-muted-foreground opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      {isPassed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
                      ) : (
                        <div
                          className={`h-4 w-4 rounded-full border flex items-center justify-center text-[10px] font-semibold ${
                            isCurrent
                              ? "border-caramel text-caramel"
                              : "border-muted-foreground text-muted-foreground"
                          }`}
                          aria-hidden="true"
                        >
                          {idx + 1}
                        </div>
                      )}
                      <span className="text-xs font-bold truncate">
                        {step.label}
                      </span>
                    </div>
                    <p className="text-[11px] leading-tight text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="border-b border-border p-5 sm:p-6 bg-destructive/5 text-destructive">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">
                  Order {order.status === "CANCELLED" ? "Cancelled" : "Not Accepted"}
                </h4>
                <p className="text-xs mt-1 leading-relaxed text-destructive/90">
                  {order.rejection_reason ||
                    "This order has been updated. Please contact the bakery counter if you have any questions."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pickup & Store Location Grid */}
        <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-y-0 sm:divide-x border-b border-border">
          {/* Scheduled Pickup Time */}
          <div className="p-5 sm:p-6 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Calendar className="h-4 w-4 text-caramel" />
              <span>Scheduled Pickup</span>
            </div>
            <p className="text-base font-semibold text-foreground">
              {formattedPickupDate}
            </p>
            {formattedPickupTime && (
              <p className="text-sm font-medium text-caramel">
                Around {formattedPickupTime}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Please present order number <strong className="text-foreground">{order.order_number}</strong> at the counter.
            </p>
          </div>

          {/* Bakery Address */}
          <div className="p-5 sm:p-6 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Store className="h-4 w-4 text-caramel" />
              <span>Pickup Location</span>
            </div>
            <p className="text-base font-semibold text-foreground">
              Namma Bakery
            </p>
            <div className="flex items-start gap-1.5 text-xs text-muted-foreground leading-relaxed">
              <MapPin className="h-3.5 w-3.5 text-caramel shrink-0 mt-0.5" />
              <span>BEML Layout 3rd Stage, Rajarajeshwari Nagar, Bengaluru, Karnataka 560098</span>
            </div>
          </div>
        </div>

        {/* Ordered Items Review List */}
        <div className="p-5 sm:p-6 space-y-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-caramel" />
              <h3 className="font-heading text-base font-bold text-foreground">
                Items in this Order
              </h3>
            </div>
            <span className="text-xs text-muted-foreground">
              {order.items.length} {order.items.length === 1 ? "item" : "items"}
            </span>
          </div>

          <div className="divide-y divide-border rounded-sm border border-border">
            {order.items.map((item, idx) => (
              <div key={idx} className="p-3.5 sm:p-4 flex items-start justify-between gap-3 text-xs sm:text-sm">
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">
                    {item.name}
                  </div>
                  {item.label && (
                    <div className="text-xs text-muted-foreground">
                      {item.label}
                    </div>
                  )}
                  {item.cake_message && (
                    <div className="text-xs text-caramel italic">
                      Cake message: &ldquo;{item.cake_message}&rdquo;
                    </div>
                  )}
                  <div className="text-[11px] text-muted-foreground">
                    Qty: {item.quantity}
                  </div>
                </div>

                <div className="text-right font-medium text-foreground">
                  {formatPaise(item.line_total_paise)}
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Total Amount
            </span>
            <span className="font-heading text-2xl font-bold text-foreground">
              {formatPaise(order.total_paise)}
            </span>
          </div>
        </div>

        {/* Payment Policy Notice: Pay at Bakery */}
        <div className="p-5 sm:p-6 bg-caramel/5 space-y-3">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-caramel" />
            <h4 className="font-semibold text-sm text-foreground">
              Payment: Pay at Bakery Counter
            </h4>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            No payment was collected online. Please pay{" "}
            <strong className="text-foreground">{formatPaise(order.total_paise)}</strong>{" "}
            at the bakery counter during pickup. We accept <strong>UPI (GPay / PhonePe / Paytm)</strong>,{" "}
            <strong>Credit &amp; Debit Cards</strong>, and <strong>Cash</strong>.
          </p>
          <p className="text-[11px] text-muted-foreground/80 italic">
            Online payments are coming soon.
          </p>
        </div>
      </div>

      {/* Helpful Actions & Support */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/menu"
          className="inline-flex min-h-[48px] h-12 items-center justify-center gap-2 rounded-sm bg-caramel px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-caramel/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
        >
          <span>Explore More Treats</span>
          <ArrowRight className="h-4 w-4" />
        </Link>

        <Link
          href="/"
          className="inline-flex min-h-[48px] h-12 items-center justify-center rounded-sm border border-border bg-card px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-caramel"
        >
          Return to Home
        </Link>
      </div>

      {/* Bakery Contact Note */}
      <div className="mt-8 rounded-sm border border-dashed border-border p-4 text-xs text-muted-foreground flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-caramel shrink-0" />
          <span>Need to make changes or have questions about your order?</span>
        </div>
        <span className="font-semibold text-foreground">Visit our bakery counter in RR Nagar</span>
      </div>
    </div>
  );
}
