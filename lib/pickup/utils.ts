import {
  BAKERY_TIMEZONE,
  formatIstDate,
  formatPickupSlot,
  getIstDateString,
  toValidDate,
} from "@/lib/utils/date";
import type { PickupDateOption, PickupSlot } from "./types";

/**
 * Standard operating hours for Namma Bakery:
 * 10:00 AM to 9:30 PM (21:30) daily.
 * Aligned with seed.sql business_hours and store counter signage.
 */
export const DEFAULT_OPENS_TIME = "10:00";
export const DEFAULT_CLOSES_TIME = "21:30";
export const DEFAULT_SLOT_MINUTES = 30;

/**
 * Default number of days ahead customer can schedule a bakery pickup.
 */
export const DEFAULT_DAYS_AHEAD = 10;

/**
 * Generates an array of selectable pickup date options in Asia/Kolkata (IST),
 * starting from today.
 */
export function generatePickupDateOptions(
  daysAhead: number = DEFAULT_DAYS_AHEAD,
  now: Date = new Date()
): PickupDateOption[] {
  const options: PickupDateOption[] = [];
  const todayStr = getIstDateString(now);

  // Parse today at noon IST to avoid day boundary drift when adding days
  const baseDate = new Date(`${todayStr}T12:00:00+05:30`);

  for (let i = 0; i < daysAhead; i++) {
    const current = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dateString = getIstDateString(current);

    const isToday = i === 0;
    const isTomorrow = i === 1;

    const formattedDate = formatIstDate(current, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const weekdayShort = new Intl.DateTimeFormat("en-IN", {
      timeZone: BAKERY_TIMEZONE,
      weekday: "short",
    }).format(current);

    const dayName = new Intl.DateTimeFormat("en-IN", {
      timeZone: BAKERY_TIMEZONE,
      weekday: "long",
    }).format(current);

    let shortDay = weekdayShort;
    let label = `${weekdayShort}, ${formatIstDate(current, { day: "numeric", month: "short" })}`;

    if (isToday) {
      shortDay = "Today";
      label = `Today, ${formatIstDate(current, { day: "numeric", month: "short" })}`;
    } else if (isTomorrow) {
      shortDay = "Tomorrow";
      label = `Tomorrow, ${formatIstDate(current, { day: "numeric", month: "short" })}`;
    }

    options.push({
      dateString,
      label,
      shortDay,
      dayName,
      formattedDate,
      isToday,
      isTomorrow,
      isAvailable: true,
    });
  }

  return options;
}

/**
 * Parses "HH:MM" into total minutes past midnight.
 */
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map((v) => Number.parseInt(v ?? "0", 10));
  return (h ?? 0) * 60 + (m ?? 0);
}

/**
 * Converts total minutes past midnight to "HH:MM" string.
 */
function minutesToTime(totalMins: number): string {
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/**
 * Computes available pickup slots for a given date in Asia/Kolkata (IST),
 * strictly matching the database's available_slots logic.
 *
 * Slots are generated from `opens` to `closes - slot_minutes` in increments of `slot_minutes`.
 * For example: 10:00 to 21:30 with 30-min slots -> 10:00, 10:30, ..., 21:00.
 */
export function generateSlotsForDate(params: {
  dateString: string;
  minLeadMinutes?: number;
  opensTime?: string;
  closesTime?: string;
  slotMinutes?: number;
  now?: Date;
}): PickupSlot[] {
  const {
    dateString,
    minLeadMinutes = 0,
    opensTime = DEFAULT_OPENS_TIME,
    closesTime = DEFAULT_CLOSES_TIME,
    slotMinutes = DEFAULT_SLOT_MINUTES,
    now = new Date(),
  } = params;

  const slots: PickupSlot[] = [];

  const openMins = timeToMinutes(opensTime);
  const closeMins = timeToMinutes(closesTime);
  // Last slot start is closeMins - slotMinutes (e.g. 21:30 - 30 = 21:00)
  const lastSlotStartMins = closeMins - slotMinutes;

  if (lastSlotStartMins < openMins) {
    return [];
  }

  // Current time cutoff including lead time in milliseconds
  const nowMs = now.getTime();
  const leadBufferMs = Math.max(0, minLeadMinutes) * 60 * 1000;
  const cutoffMs = nowMs + leadBufferMs;

  for (let m = openMins; m <= lastSlotStartMins; m += slotMinutes) {
    const timeStr = minutesToTime(m);
    const nextTimeStr = minutesToTime(m + slotMinutes);

    // Exact ISO strings with Asia/Kolkata (+05:30) offset
    const slotStartIso = `${dateString}T${timeStr}:00+05:30`;
    const slotEndIso = `${dateString}T${nextTimeStr}:00+05:30`;

    const slotStartDate = toValidDate(slotStartIso);
    const formattedTime = formatPickupSlot(slotStartDate, slotMinutes);

    const slotStartMs = slotStartDate.getTime();
    const isPast = slotStartMs < nowMs;
    const isLeadConstrained = !isPast && slotStartMs < cutoffMs;

    const isAvailable = !isPast && !isLeadConstrained;
    let disabledReason: string | undefined;

    if (isPast) {
      disabledReason = "Slot passed";
    } else if (isLeadConstrained) {
      const hours = Math.ceil(minLeadMinutes / 60);
      disabledReason = `Requires ${hours}h preparation`;
    }

    slots.push({
      slotStart: slotStartIso,
      slotEnd: slotEndIso,
      formattedTime,
      remaining: 6, // Database default max_orders_per_slot
      isAvailable,
      disabledReason,
    });
  }

  return slots;
}

/**
 * Friendly summary for a selected pickup date and slot.
 *
 * Example:
 *   "Friday, 23 Oct 2026 · 10:30 AM – 11:00 AM"
 */
export function formatPickupSelectionSummary(
  dateString: string,
  formattedTime?: string
): string {
  const date = new Date(`${dateString}T12:00:00+05:30`);
  const fullDate = formatIstDate(date, {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (formattedTime) {
    return `${fullDate} · ${formattedTime}`;
  }

  return fullDate;
}
