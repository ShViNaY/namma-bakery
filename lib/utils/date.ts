/**
 * Date and time utilities for Namma Bakery.
 *
 * The bakery operates in Bangalore, India, so all customer-facing business times,
 * pickup slots, and operational hours must consistently use Asia/Kolkata (IST).
 * While times in PostgreSQL/Supabase are stored as timestamptz (UTC), presentation
 * and slot calculations must always reflect IST.
 */

export const BAKERY_TIMEZONE = "Asia/Kolkata";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/**
 * Validates and converts an input into a valid Date object.
 * Throws a TypeError if the date is invalid.
 */
export function toValidDate(input: Date | string | number): Date {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    throw new TypeError(`Invalid date input: ${String(input)}`);
  }
  return date;
}

/**
 * Formats a date in Asia/Kolkata (IST).
 *
 * Example:
 *   formatIstDate(new Date()) -> "23 Oct 2026"
 */
export function formatIstDate(
  input: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = toValidDate(input);
  const formatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: BAKERY_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  });
  return formatter.format(date);
}

/**
 * Formats a time in Asia/Kolkata (IST).
 *
 * Example:
 *   formatIstTime(new Date()) -> "10:30 AM"
 */
export function formatIstTime(
  input: Date | string | number,
  options?: { hour12?: boolean }
): string {
  const date = toValidDate(input);
  const { hour12 = true } = options ?? {};
  const formatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: BAKERY_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12,
  });
  return formatter.format(date).toUpperCase();
}

/**
 * Formats both date and time in Asia/Kolkata (IST).
 *
 * Example:
 *   formatIstDateTime(new Date()) -> "23 Oct 2026, 10:30 AM"
 */
export function formatIstDateTime(input: Date | string | number): string {
  const date = toValidDate(input);
  return `${formatIstDate(date)}, ${formatIstTime(date)}`;
}

/**
 * Formats a pickup time window (slot) in IST.
 *
 * Examples:
 *   formatPickupSlot(startTime, 30) -> "10:00 AM – 10:30 AM"
 *   formatPickupSlot(startTime, endTime, { includeDate: true })
 *     -> "23 Oct 2026, 10:00 AM – 10:30 AM"
 */
export function formatPickupSlot(
  startInput: Date | string | number,
  endOrMinutes: Date | string | number = 30,
  options: { includeDate?: boolean } = {}
): string {
  const start = toValidDate(startInput);
  let end: Date;

  if (typeof endOrMinutes === "number") {
    end = new Date(start.getTime() + endOrMinutes * 60 * 1000);
  } else {
    end = toValidDate(endOrMinutes);
  }

  const startTime = formatIstTime(start);
  const endTime = formatIstTime(end);

  if (options.includeDate) {
    const dateStr = formatIstDate(start);
    return `${dateStr}, ${startTime} – ${endTime}`;
  }

  return `${startTime} – ${endTime}`;
}

/**
 * Returns the calendar date string in IST as "YYYY-MM-DD".
 *
 * This prevents UTC-boundary bugs (e.g. at 2:00 AM IST, UTC is still the previous day).
 *
 * Example:
 *   getIstDateString(new Date()) -> "2026-10-23"
 */
export function getIstDateString(
  input: Date | string | number = new Date()
): string {
  const date = toValidDate(input);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BAKERY_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Extracts 24-hour time parts in IST.
 *
 * Returns:
 *   hour: 0..23
 *   minute: 0..59
 *   dayOfWeek: 0 (Sun) .. 6 (Sat)
 *   minutesPastMidnight: 0..1439
 */
export function getIstTimeParts(input: Date | string | number = new Date()): {
  hour: number;
  minute: number;
  dayOfWeek: number;
  minutesPastMidnight: number;
} {
  const date = toValidDate(input);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BAKERY_TIMEZONE,
    hourCycle: "h23",
    hour: "numeric",
    minute: "numeric",
    weekday: "short",
  }).formatToParts(date);

  let hour = 0;
  let minute = 0;
  let dayOfWeek = 0;

  for (const part of parts) {
    if (part.type === "hour") {
      hour = Number.parseInt(part.value, 10);
    } else if (part.type === "minute") {
      minute = Number.parseInt(part.value, 10);
    } else if (part.type === "weekday") {
      dayOfWeek = WEEKDAYS.indexOf(part.value as (typeof WEEKDAYS)[number]);
      if (dayOfWeek === -1) dayOfWeek = 0;
    }
  }

  return {
    hour,
    minute,
    dayOfWeek,
    minutesPastMidnight: hour * 60 + minute,
  };
}

/**
 * Helper to parse a "HH:MM" or "HH:MM:SS" time string to minutes past midnight.
 */
function parseTimeToMinutes(timeStr: string): number {
  const [hStr, mStr] = timeStr.split(":");
  const h = Number.parseInt(hStr ?? "0", 10);
  const m = Number.parseInt(mStr ?? "0", 10);
  return h * 60 + m;
}

/**
 * Checks whether a given instant falls within the bakery's business hours on that day in IST.
 *
 * Example:
 *   isWithinBakeryHours(new Date(), "08:00", "21:30")
 */
export function isWithinBakeryHours(
  input: Date | string | number,
  opensTime: string,
  closesTime: string
): boolean {
  const { minutesPastMidnight } = getIstTimeParts(input);
  const openMinutes = parseTimeToMinutes(opensTime);
  const closeMinutes = parseTimeToMinutes(closesTime);

  return (
    minutesPastMidnight >= openMinutes && minutesPastMidnight <= closeMinutes
  );
}
