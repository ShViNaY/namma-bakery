"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  Copy,
  Check,
  ShoppingBag,
  ArrowRight,
  Info,
} from "lucide-react";
import type { CustomCakePublicView } from "@/lib/custom-cake/types";
import { formatIstDate, formatIstTime } from "@/lib/utils/date";

interface CustomCakeConfirmationProps {
  request: CustomCakePublicView;
}

export function CustomCakeConfirmation({ request }: CustomCakeConfirmationProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(request.request_number).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getStatusBadge = () => {
    switch (request.status) {
      case "SUBMITTED":
        return {
          label: "Enquiry Received · Pending Review",
          style: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300",
        };
      case "UNDER_REVIEW":
      case "NEEDS_CLARIFICATION":
        return {
          label: "In Review · Baker Contacting You",
          style: "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-300",
        };
      case "CUSTOMER_ACCEPTED":
      case "QUOTED":
        return {
          label: "Confirmed by Bakery",
          style: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300",
        };
      case "DECLINED":
      case "CUSTOMER_DECLINED":
      case "WITHDRAWN":
      case "EXPIRED":
        return {
          label: "Request Closed / Declined",
          style: "bg-destructive/15 text-destructive border-destructive/30",
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      {/* Top Hero Banner */}
      <div className="rounded-sm border border-border bg-card p-6 sm:p-8 text-center space-y-4">
        <div className="size-14 rounded-full bg-caramel/15 text-caramel flex items-center justify-center mx-auto mb-2">
          <CheckCircle2 className="size-8" />
        </div>

        <span className="font-kannada text-xs font-semibold text-caramel">
          ಧನ್ಯವಾದಗಳು · Thank You!
        </span>

        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Custom Cake Enquiry Received!
        </h1>

        <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Thank you, <strong className="text-foreground">{request.first_name}</strong>. Our head baker has received your custom cake request and will review the design specifications.
        </p>

        {/* Reference Number Box */}
        <div className="inline-flex items-center gap-3 rounded-sm border border-border bg-background px-4 py-2.5">
          <span className="text-xs text-muted-foreground font-medium">
            Enquiry Reference:
          </span>
          <span className="font-mono text-base font-bold text-foreground">
            {request.request_number}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-caramel"
            title="Copy reference number"
            aria-label="Copy reference number"
          >
            {copied ? (
              <Check className="size-4 text-emerald-600" />
            ) : (
              <Copy className="size-4" />
            )}
          </button>
        </div>

        {/* Status Badge */}
        <div className="pt-1">
          <span
            className={`inline-block rounded px-3 py-1 text-xs font-semibold uppercase tracking-wider border ${badge.style}`}
          >
            {badge.label}
          </span>
        </div>
      </div>

      {/* What Happens Next Timeline */}
      <div className="rounded-sm border border-border bg-card p-6 sm:p-8 space-y-5">
        <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
          <Info className="size-5 text-caramel" />
          <span>What Happens Next?</span>
        </h2>

        <ol className="relative border-l border-border/80 ml-3 space-y-6">
          <li className="ml-6 space-y-1">
            <div className="absolute -left-2 mt-1 size-4 rounded-full border-2 border-card bg-caramel" />
            <h3 className="font-semibold text-sm text-foreground">
              1. Chef Review & Capacity Check
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Our cake decorator inspects your design description, sponge requirements, and kitchen schedule for your preferred pickup date.
            </p>
          </li>

          <li className="ml-6 space-y-1">
            <div className="absolute -left-2 mt-1 size-4 rounded-full border-2 border-card bg-muted-foreground/40" />
            <h3 className="font-semibold text-sm text-foreground">
              2. Phone Confirmation from RR Nagar
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Our staff will call you to confirm final details, exact price quote, and any custom finishes.
            </p>
          </li>

          <li className="ml-6 space-y-1">
            <div className="absolute -left-2 mt-1 size-4 rounded-full border-2 border-card bg-muted-foreground/40" />
            <h3 className="font-semibold text-sm text-foreground">
              3. Fresh Baking & Counter Pickup
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your cake is baked fresh, handcrafted to your theme, and packaged safely for collection at our BEML Layout store.
            </p>
          </li>
        </ol>
      </div>

      {/* Enquiry Specifications Summary */}
      <div className="rounded-sm border border-border bg-card p-6 sm:p-8 space-y-5">
        <h2 className="font-heading text-lg font-bold text-foreground">
          Enquiry Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-sm border border-border bg-background p-3.5 space-y-1">
            <span className="text-muted-foreground font-medium block">
              Requested Pickup Slot:
            </span>
            <div className="flex items-center gap-1.5 font-semibold text-foreground text-sm">
              <Calendar className="size-4 text-caramel" />
              <span>{formatIstDate(request.preferred_pickup_at)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="size-3.5 text-caramel" />
              <span>Around {formatIstTime(request.preferred_pickup_at)}</span>
            </div>
          </div>

          <div className="rounded-sm border border-border bg-background p-3.5 space-y-1">
            <span className="text-muted-foreground font-medium block">
              Cake Occasion & Flavour:
            </span>
            <p className="font-semibold text-foreground text-sm">
              {request.cake_type || "Celebration Cake"}
            </p>
            <p className="text-muted-foreground">
              {request.flavour} ({request.egg_type === "EGGLESS" ? "Eggless / Pure Veg" : "Regular"})
            </p>
          </div>

          <div className="rounded-sm border border-border bg-background p-3.5 space-y-1">
            <span className="text-muted-foreground font-medium block">
              Weight & Shape:
            </span>
            <p className="font-semibold text-foreground text-sm">
              {request.weight_grams >= 1000
                ? `${request.weight_grams / 1000} kg`
                : `${request.weight_grams}g`}
              {request.shape ? ` · ${request.shape}` : ""}
            </p>
          </div>

          {request.message_on_cake && (
            <div className="rounded-sm border border-amber-300 bg-amber-50/70 p-3.5 space-y-1 dark:bg-amber-950/40 dark:border-amber-800">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1">
                <Sparkles className="size-3" />
                <span>Cake Message</span>
              </span>
              <p className="font-serif italic text-sm text-amber-950 dark:text-amber-200">
                &ldquo;{request.message_on_cake}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Design Description */}
        {request.description && (
          <div className="rounded-sm border border-border bg-background p-3.5 space-y-1 text-xs">
            <span className="text-muted-foreground font-medium block">
              Design & Theme Instructions:
            </span>
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
              {request.description}
            </p>
          </div>
        )}

        {/* Reference Image Preview */}
        {request.reference_image_url && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
              Submitted Reference Photo
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={request.reference_image_url}
              alt="Reference cake design"
              className="size-48 object-cover rounded-sm border border-border"
            />
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          href="/menu"
          className="w-full sm:w-auto min-h-[48px] h-12 px-6 rounded-sm bg-caramel text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-caramel/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
        >
          <ShoppingBag className="size-4" />
          <span>Browse Regular Menu</span>
        </Link>
        <Link
          href="/"
          className="w-full sm:w-auto min-h-[48px] h-12 px-6 rounded-sm border border-border bg-card text-foreground text-xs font-semibold flex items-center justify-center gap-2 hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
        >
          <span>Return Home</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
