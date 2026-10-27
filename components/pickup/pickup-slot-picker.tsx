"use client";

import * as React from "react";
import { Check, Clock, AlertCircle } from "lucide-react";
import type { PickupSlot } from "@/lib/pickup/types";

interface PickupSlotPickerProps {
  slots: PickupSlot[];
  selectedSlot: PickupSlot | null;
  onSelectSlot: (slot: PickupSlot) => void;
  isLoading?: boolean;
  selectedDateLabel?: string;
}

export function PickupSlotPicker({
  slots,
  selectedSlot,
  onSelectSlot,
  isLoading = false,
  selectedDateLabel,
}: PickupSlotPickerProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-foreground uppercase">
          <Clock className="h-4 w-4 text-caramel" aria-hidden="true" />
          <span>2. Select Pickup Time Slot</span>
        </div>
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="h-12 animate-pulse rounded-sm border border-border bg-muted/40"
            />
          ))}
        </div>
      </div>
    );
  }

  const availableSlotsCount = slots.filter((s) => s.isAvailable).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-1">
        <label
          id="pickup-slot-label"
          className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-foreground uppercase"
        >
          <Clock className="h-4 w-4 text-caramel" aria-hidden="true" />
          <span>2. Select Pickup Time Slot</span>
        </label>
        {selectedDateLabel && (
          <span className="text-xs text-muted-foreground font-medium">
            for {selectedDateLabel}
          </span>
        )}
      </div>

      {slots.length === 0 || availableSlotsCount === 0 ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-sm border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-semibold">
              No pickup slots are available for this date.
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-amber-900/80 dark:text-amber-300/80">
              All slots have passed or require more preparation time for the items in your cart. Please select tomorrow or another future date.
            </p>
          </div>
        </div>
      ) : (
        <div
          role="group"
          aria-labelledby="pickup-slot-label"
          className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4"
        >
          {slots.map((slot: PickupSlot) => {
            const isSelected = selectedSlot?.slotStart === slot.slotStart;
            const accessibleLabel = `${slot.formattedTime}${
              !slot.isAvailable
                ? `, unavailable (${slot.disabledReason ?? "Unavailable"})`
                : isSelected
                ? ", selected"
                : ""
            }`;

            return (
              <button
                key={slot.slotStart}
                type="button"
                disabled={!slot.isAvailable}
                onClick={() => onSelectSlot(slot)}
                aria-pressed={isSelected}
                aria-label={accessibleLabel}
                className={`relative flex min-h-[48px] items-center justify-between rounded-sm border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel ${
                  isSelected
                    ? "border-2 border-caramel bg-caramel/10 text-caramel font-semibold shadow-xs"
                    : slot.isAvailable
                    ? "border-border bg-card text-foreground hover:border-caramel/50 hover:bg-secondary/60"
                    : "cursor-not-allowed border-border/40 bg-muted/40 text-muted-foreground/40 line-through"
                }`}
              >
                <span>{slot.formattedTime}</span>
                {isSelected ? (
                  <Check className="h-4 w-4 text-caramel shrink-0" aria-hidden="true" />
                ) : !slot.isAvailable && slot.disabledReason ? (
                  <span className="no-underline text-[10px] text-muted-foreground/60 shrink-0 font-normal ml-1">
                    {slot.disabledReason === "Slot passed" ? "Passed" : "Prep"}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
