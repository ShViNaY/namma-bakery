import { z } from "zod";
import { calendarDateSchema } from "@/lib/validation/common";
import { getIstDateString } from "@/lib/utils/date";

/**
 * Validates a pickup calendar date string in YYYY-MM-DD format.
 * Strictly requires the date to not be in the past according to Asia/Kolkata (IST).
 */
export const pickupDateSchema = calendarDateSchema.refine(
  (dateStr) => {
    const todayStr = getIstDateString();
    return dateStr >= todayStr;
  },
  {
    message: "Pickup date cannot be in the past",
  }
);

/**
 * Validates a pickup slot structure.
 */
export const pickupSlotSchema = z.object({
  slotStart: z.string().min(1, "Slot start is required"),
  slotEnd: z.string().min(1, "Slot end is required"),
  formattedTime: z.string().min(1, "Formatted slot time is required"),
  remaining: z.number().int().nonnegative().optional(),
  isAvailable: z.boolean().default(true),
  disabledReason: z.string().optional(),
});

/**
 * Validates an entire pickup selection (date and chosen slot).
 */
export const pickupSelectionSchema = z.object({
  date: pickupDateSchema,
  slot: pickupSlotSchema,
});

export type ValidatedPickupSlot = z.infer<typeof pickupSlotSchema>;
export type ValidatedPickupSelection = z.infer<typeof pickupSelectionSchema>;
