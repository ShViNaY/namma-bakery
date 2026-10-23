"use client";

import * as React from "react";
import { Calendar } from "lucide-react";
import { generatePickupDateOptions } from "@/lib/pickup/utils";
import type { PickupDateOption } from "@/lib/pickup/types";

interface PickupDatePickerProps {
  selectedDate: string | null;
  onSelectDate: (dateString: string) => void;
  daysAhead?: number;
}

export function PickupDatePicker({
  selectedDate,
  onSelectDate,
  daysAhead = 10,
}: PickupDatePickerProps) {
  const dateOptions = React.useMemo(() => {
    return generatePickupDateOptions(daysAhead);
  }, [daysAhead]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label
          id="pickup-date-label"
          className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-foreground uppercase"
        >
          <Calendar className="h-4 w-4 text-caramel" aria-hidden="true" />
          <span>1. Select Pickup Date</span>
        </label>
        <span className="text-[11px] text-muted-foreground">
          Asia/Kolkata (IST)
        </span>
      </div>

      {/* Responsive scrollable date cards */}
      <div
        role="group"
        aria-labelledby="pickup-date-label"
        className="flex gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar sm:grid sm:grid-cols-5 sm:gap-2.5 sm:overflow-visible"
      >
        {dateOptions.map((option: PickupDateOption) => {
          const isSelected = selectedDate === option.dateString;
          const accessibleName = `${option.dayName}, ${option.formattedDate}${
            isSelected ? ", selected" : ""
          }`;

          return (
            <button
              key={option.dateString}
              type="button"
              disabled={!option.isAvailable}
              onClick={() => onSelectDate(option.dateString)}
              aria-pressed={isSelected}
              aria-label={accessibleName}
              className={`flex min-h-[58px] min-w-[104px] shrink-0 flex-col items-center justify-center rounded-sm border px-3 py-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel ${
                isSelected
                  ? "border-2 border-caramel bg-caramel/10 text-caramel font-semibold shadow-xs"
                  : option.isAvailable
                  ? "border-border bg-card text-foreground hover:border-caramel/50 hover:bg-secondary/60"
                  : "cursor-not-allowed border-border/40 bg-muted/40 text-muted-foreground/50 line-through"
              }`}
            >
              <span
                className={`text-xs ${
                  isSelected ? "font-bold text-caramel" : "font-medium text-muted-foreground"
                }`}
              >
                {option.shortDay}
              </span>
              <span
                className={`mt-0.5 font-heading text-sm sm:text-base ${
                  isSelected ? "font-bold text-caramel" : "font-semibold text-foreground"
                }`}
              >
                {option.formattedDate.replace(` ${new Date().getFullYear()}`, "")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
