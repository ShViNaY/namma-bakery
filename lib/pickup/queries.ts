import { createClient } from "@/lib/supabase/client";
import { formatPickupSlot, toValidDate } from "@/lib/utils/date";
import type { PickupSlot, StoreStatus } from "./types";
import {
  DEFAULT_CLOSES_TIME,
  DEFAULT_OPENS_TIME,
  DEFAULT_SLOT_MINUTES,
  generateSlotsForDate,
} from "./utils";

export const DEFAULT_LOCATION_SLUG = "namma-bakery-rr-nagar";

/**
 * Fetches current public store status (e.g. if orders are paused).
 */
export async function getStoreStatus(): Promise<StoreStatus> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("public_store_status")
      .select("orders_paused_until, pause_message, slot_minutes")
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return {
        isPaused: false,
        pauseMessage: null,
        slotMinutes: DEFAULT_SLOT_MINUTES,
      };
    }

    const isPaused =
      Boolean(data.orders_paused_until) &&
      new Date(data.orders_paused_until).getTime() > Date.now();

    return {
      isPaused,
      pauseMessage: data.pause_message,
      slotMinutes: data.slot_minutes ?? DEFAULT_SLOT_MINUTES,
    };
  } catch {
    return {
      isPaused: false,
      pauseMessage: null,
      slotMinutes: DEFAULT_SLOT_MINUTES,
    };
  }
}

/**
 * Fetches available pickup slots for a given date in Asia/Kolkata (IST),
 * querying Supabase available_slots RPC if available, or generating slots
 * according to the database business rules.
 */
export async function getAvailablePickupSlots(params: {
  dateString: string;
  minLeadMinutes?: number;
}): Promise<{
  slots: PickupSlot[];
  isClosed: boolean;
  closureReason?: string | null;
}> {
  const { dateString, minLeadMinutes = 0 } = params;

  try {
    const supabase = createClient();

    // 1. Get primary active location
    const { data: location } = await supabase
      .from("locations")
      .select("id, slug, is_active")
      .eq("slug", DEFAULT_LOCATION_SLUG)
      .eq("is_active", true)
      .maybeSingle();

    if (location?.id) {
      // 2. Check special closures
      const { data: closure } = await supabase
        .from("special_closures")
        .select("closure_date, reason")
        .eq("location_id", location.id)
        .eq("closure_date", dateString)
        .maybeSingle();

      if (closure) {
        return {
          slots: [],
          isClosed: true,
          closureReason: closure.reason || "Bakery closed on this date",
        };
      }

      // 3. Try available_slots stored RPC
      const { data: rpcSlots, error: rpcError } = await supabase.rpc(
        "available_slots",
        {
          p_location: location.id,
          p_date: dateString,
          p_min_lead_minutes: minLeadMinutes,
        }
      );

      if (!rpcError && Array.isArray(rpcSlots) && rpcSlots.length > 0) {
        const slots: PickupSlot[] = rpcSlots.map((row: { slot_start: string; remaining: number }) => {
          const startDate = toValidDate(row.slot_start);
          const endDate = new Date(startDate.getTime() + DEFAULT_SLOT_MINUTES * 60 * 1000);
          const isAvailable = row.remaining > 0;

          return {
            slotStart: startDate.toISOString(),
            slotEnd: endDate.toISOString(),
            formattedTime: formatPickupSlot(startDate, DEFAULT_SLOT_MINUTES),
            remaining: row.remaining,
            isAvailable,
            disabledReason: !isAvailable ? "Slot is full" : undefined,
          };
        });

        return {
          slots,
          isClosed: false,
        };
      }
    }
  } catch {
    // Database connection or placeholder credentials: fall back to business rule generation
  }

  // Fallback to active database business rules
  const slots = generateSlotsForDate({
    dateString,
    minLeadMinutes,
    opensTime: DEFAULT_OPENS_TIME,
    closesTime: DEFAULT_CLOSES_TIME,
    slotMinutes: DEFAULT_SLOT_MINUTES,
  });

  return {
    slots,
    isClosed: false,
  };
}
