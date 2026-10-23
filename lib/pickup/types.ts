/**
 * Pickup domain types for Namma Bakery.
 *
 * Aligned with the Supabase PostgreSQL database schema:
 * - locations (timezone: 'Asia/Kolkata')
 * - business_hours (weekday: 0..6, opens: time, closes: time)
 * - store_settings (slot_minutes: 15|30|60, max_orders_per_slot: int)
 * - special_closures (closure_date: date, reason: text)
 * - available_slots(location_id, date, lead_minutes) RPC
 */

export interface PickupSlot {
  /**
   * ISO 8601 timestamptz string with timezone offset (e.g. "2026-10-23T10:00:00+05:30")
   */
  slotStart: string;
  /**
   * ISO 8601 timestamptz string for slot end (e.g. "2026-10-23T10:30:00+05:30")
   */
  slotEnd: string;
  /**
   * Human-readable formatted time range, e.g. "10:00 AM – 10:30 AM"
   */
  formattedTime: string;
  /**
   * Remaining order capacity for this slot (if tracked by database)
   */
  remaining?: number;
  /**
   * Whether this slot is selectable by the customer
   */
  isAvailable: boolean;
  /**
   * Reason if unavailable (e.g. "Past time", "Full", "Prep time required")
   */
  disabledReason?: string;
}

export interface PickupDateOption {
  /**
   * Calendar date string in Asia/Kolkata ("YYYY-MM-DD")
   */
  dateString: string;
  /**
   * Display label, e.g. "Today, 23 Oct", "Tomorrow, 24 Oct", "Sat, 25 Oct"
   */
  label: string;
  /**
   * Short day label, e.g. "Today", "Tomorrow", "Sat"
   */
  shortDay: string;
  /**
   * Full day name, e.g. "Friday"
   */
  dayName: string;
  /**
   * Formatted calendar date, e.g. "23 Oct 2026"
   */
  formattedDate: string;
  isToday: boolean;
  isTomorrow: boolean;
  isAvailable: boolean;
  disabledReason?: string;
}

export interface PickupSelection {
  date: string; // "YYYY-MM-DD"
  slot: PickupSlot | null;
}

export interface StoreStatus {
  isPaused: boolean;
  pauseMessage?: string | null;
  slotMinutes: number;
}
