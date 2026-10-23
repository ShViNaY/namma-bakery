import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getIstDateString } from "@/lib/utils/date";
import type { OperationalSummary, StaffOrder } from "./types";

/**
 * Fetches recent orders for the staff dashboard using the authenticated staff session.
 *
 * Constrained by RLS policy `orders_read` which verifies `is_staff()`.
 */
export async function getStaffOrders(options?: {
  limit?: number;
}): Promise<{
  orders: StaffOrder[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        customer_id,
        customer_name,
        customer_phone,
        customer_email,
        status,
        payment_status,
        payment_method,
        requested_pickup_at,
        confirmed_pickup_at,
        estimated_ready_at,
        total_paise,
        customer_notes,
        bakery_note,
        rejection_reason,
        cancellation_reason,
        cancelled_by,
        created_at,
        updated_at,
        completed_at,
        order_items (
          id,
          order_id,
          product_id,
          variant_id,
          product_name,
          variant_label,
          egg_type,
          finish,
          weight_grams,
          unit_price_paise,
          quantity,
          line_total_paise,
          cake_message
        ),
        order_status_history (
          id,
          order_id,
          from_status,
          to_status,
          changed_by,
          actor_role,
          note,
          created_at
        ),
        order_internal_notes (
          id,
          order_id,
          author_id,
          body,
          created_at
        )
      `)
      .order("requested_pickup_at", { ascending: true })
      .limit(options?.limit ?? 100);

    if (error) {
      console.error("[getStaffOrders] Database error fetching orders:", error.message);
      return { orders: [], error: error.message };
    }

    return { orders: (data as unknown as StaffOrder[]) ?? [], error: null };
  } catch (err) {
    console.error("[getStaffOrders] Unexpected execution failure:", err);
    return {
      orders: [],
      error: "Failed to load orders. Please refresh or verify connection.",
    };
  }
}

/**
 * Computes today's operational summary metrics in Asia/Kolkata timezone.
 */
export function calculateOperationalSummary(
  orders: StaffOrder[]
): OperationalSummary {
  const todayIst = getIstDateString();

  let totalToday = 0;
  let pending = 0;
  let accepted = 0;
  let preparing = 0;
  let readyForPickup = 0;
  let completed = 0;
  let cancelledOrRejected = 0;

  for (const order of orders) {
    const isToday =
      getIstDateString(order.requested_pickup_at) === todayIst ||
      getIstDateString(order.created_at) === todayIst;

    if (isToday) {
      totalToday++;
    }

    switch (order.status) {
      case "PENDING":
        pending++;
        break;
      case "ACCEPTED":
        accepted++;
        break;
      case "PREPARING":
        preparing++;
        break;
      case "READY_FOR_PICKUP":
        readyForPickup++;
        break;
      case "COMPLETED":
        if (isToday) completed++;
        break;
      case "CANCELLED":
      case "REJECTED":
      case "NO_SHOW":
        if (isToday) cancelledOrRejected++;
        break;
    }
  }

  return {
    totalToday,
    pending,
    accepted,
    preparing,
    readyForPickup,
    completed,
    cancelledOrRejected,
  };
}
