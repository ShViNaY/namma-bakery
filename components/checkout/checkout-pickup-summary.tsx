import * as React from "react";
import Link from "next/link";
import { AlertCircle, Calendar, Clock, Edit2, MapPin } from "lucide-react";
import type { PickupSlot } from "@/lib/pickup/types";
import { formatPickupSelectionSummary } from "@/lib/pickup/utils";

interface CheckoutPickupSummaryProps {
  pickupDate: string | null;
  pickupSlot: PickupSlot | null;
}

export function CheckoutPickupSummary({
  pickupDate,
  pickupSlot,
}: CheckoutPickupSummaryProps) {
  const isPickupValid = Boolean(pickupDate && pickupSlot);

  return (
    <div className="rounded-sm border border-border bg-card p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-caramel" aria-hidden="true" />
          <h3 className="font-heading text-lg font-semibold text-foreground">
            Pickup Details
          </h3>
        </div>
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-caramel hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-caramel"
        >
          <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Change Slot</span>
        </Link>
      </div>

      {!isPickupValid ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-sm border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400 mt-0.5" aria-hidden="true" />
          <div className="space-y-2">
            <p className="font-semibold text-sm">
              Pickup slot not selected
            </p>
            <p className="text-xs text-amber-900/80 dark:text-amber-300/80">
              Please choose an available pickup date and time slot from your cart before proceeding with checkout.
            </p>
            <Link
              href="/cart"
              className="inline-flex h-9 items-center justify-center rounded-sm bg-caramel px-4 text-xs font-semibold text-white transition-colors hover:bg-caramel/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
            >
              Select Pickup Slot in Cart →
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-sm border border-border bg-secondary/30 p-3">
              <span className="text-muted-foreground block text-[11px] font-medium uppercase tracking-wider">
                Pickup Date
              </span>
              <span className="font-semibold text-foreground text-sm mt-0.5 block">
                {formatPickupSelectionSummary(pickupDate!)}
              </span>
            </div>

            <div className="rounded-sm border border-border bg-secondary/30 p-3">
              <span className="text-muted-foreground block text-[11px] font-medium uppercase tracking-wider">
                Pickup Time Slot
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-caramel text-sm mt-0.5">
                <Clock className="h-4 w-4" aria-hidden="true" />
                <span>{pickupSlot!.formattedTime}</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 pt-1 text-muted-foreground">
            <MapPin className="h-4 w-4 text-caramel shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <span className="font-medium text-foreground block">
                Namma Bakery Kitchen &amp; Counter
              </span>
              <span className="text-[11px] leading-relaxed">
                BEML Layout 3rd Stage, Rajarajeshwari Nagar, Bengaluru (Counter Hours: 10:00 AM – 9:30 PM Daily)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
