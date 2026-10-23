"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import {
  placeOrderInputSchema,
  lookupOrderTokenSchema,
} from "./validation";
import type { PlaceOrderResult } from "./types";

const DEFAULT_LOCATION_SLUG = "namma-bakery-rr-nagar";

/**
 * Server Action: Places a customer order.
 *
 * SECURITY & ARCHITECTURAL BOUNDARY:
 * - Client data is completely untrusted.
 * - Server ignores all client prices and totals.
 * - Server invokes `place_order` PostgreSQL SECURITY DEFINER function via `service_role`.
 * - Database authoritative logic verifies:
 *   1. Store is open and orders are not paused.
 *   2. Products and variants exist, are active, and orderable online.
 *   3. Price tier rules are applied from the database snapshot.
 *   4. Lead times for all items are satisfied.
 *   5. Slot capacity is available with database lock concurrency serialization.
 *   6. Customer open-order rate limit is enforced.
 */
export async function placeOrderAction(input: unknown): Promise<PlaceOrderResult> {
  const parsed = placeOrderInputSchema.safeParse(input);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      success: false,
      error: firstIssue?.message || "Invalid order information provided.",
    };
  }

  try {
    const supabase = createAdminClient();

    // 1. Resolve store location ID
    const { data: locData } = await supabase
      .from("locations")
      .select("id")
      .eq("slug", DEFAULT_LOCATION_SLUG)
      .eq("is_active", true)
      .maybeSingle();

    let locationId = locData?.id;

    if (!locationId) {
      const { data: fallbackLoc } = await supabase
        .from("locations")
        .select("id")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      locationId = fallbackLoc?.id;
    }

    if (!locationId) {
      return {
        success: false,
        error: "Bakery location could not be resolved. Please try again later.",
      };
    }

    // 2. Identify authenticated customer if present, otherwise null for guest
    let customerId: string | null = null;
    try {
      const serverAuthClient = await createServerClient();
      const {
        data: { user },
      } = await serverAuthClient.auth.getUser();
      if (user?.id) {
        customerId = user.id;
      }
    } catch {
      // Guest order
      customerId = null;
    }

    // 3. Format items matching database place_order(..., p_items jsonb) specification
    const p_items = parsed.data.items.map((it) => {
      if (it.kind === "TIERED_CAKE" && it.cakeConfig) {
        return {
          product_id: it.productId,
          quantity: it.quantity,
          weight_grams: it.cakeConfig.weightGrams,
          egg_type: it.cakeConfig.eggType,
          finish: it.cakeConfig.finish || "STANDARD",
          cake_message: it.cakeMessage ? it.cakeMessage.trim() : null,
        };
      }
      return {
        product_id: it.productId,
        variant_id: it.variantId,
        quantity: it.quantity,
      };
    });

    // 4. Invoke Postgres place_order RPC with database-level concurrency & pricing authority
    const { data: rpcData, error: rpcError } = await supabase.rpc("place_order", {
      p_location_id: locationId,
      p_customer_id: customerId,
      p_name: parsed.data.customerDetails.customerName.trim(),
      p_phone: parsed.data.customerDetails.customerPhone.trim(),
      p_email: parsed.data.customerDetails.customerEmail?.trim() || null,
      p_pickup: parsed.data.pickupSlotStart,
      p_notes: parsed.data.customerDetails.customerNotes?.trim() || null,
      p_items: p_items,
    });

    // 5. Handle and translate database business errors
    if (rpcError) {
      const msg = rpcError.message || "";
      console.error("[placeOrderAction] Database error placing order:", msg);

      if (msg.includes("SLOT_FULL")) {
        return {
          success: false,
          error:
            "The selected pickup time slot is now full. Please choose another pickup slot.",
          code: "SLOT_FULL",
        };
      }
      if (msg.includes("ORDERS_PAUSED")) {
        return {
          success: false,
          error:
            "Order placement is currently paused by the bakery. Please check back shortly.",
          code: "ORDERS_PAUSED",
        };
      }
      if (msg.includes("TOO_MANY_OPEN_ORDERS")) {
        return {
          success: false,
          error:
            "You already have active open orders for this phone number. Please await fulfillment before placing another order.",
          code: "TOO_MANY_OPEN_ORDERS",
        };
      }
      if (msg.includes("CLOSED_DAY")) {
        return {
          success: false,
          error:
            "The bakery is closed on the selected date. Please pick another date.",
          code: "CLOSED_DAY",
        };
      }
      if (msg.includes("OUTSIDE_OPENING_HOURS")) {
        return {
          success: false,
          error:
            "The selected pickup time is outside store operating hours. Please pick another time slot.",
          code: "OUTSIDE_OPENING_HOURS",
        };
      }
      if (msg.includes("LEAD_TIME_NOT_MET")) {
        return {
          success: false,
          error:
            "Items in your cart require advance preparation time that is no longer satisfied by the selected slot. Please select a later pickup slot.",
          code: "LEAD_TIME_NOT_MET",
        };
      }
      if (msg.includes("PRODUCT_UNAVAILABLE")) {
        return {
          success: false,
          error:
            "One or more items in your cart is currently unavailable or out of stock. Please review your cart.",
          code: "PRODUCT_UNAVAILABLE",
        };
      }
      if (msg.includes("OPTION_NOT_AVAILABLE")) {
        return {
          success: false,
          error:
            "One of the selected size or finish options is no longer available. Please update your cart.",
          code: "OPTION_NOT_AVAILABLE",
        };
      }
      if (msg.includes("INVALID_QUANTITY")) {
        return {
          success: false,
          error: "Item quantity must be between 1 and 20.",
          code: "INVALID_QUANTITY",
        };
      }
      if (msg.includes("INVALID_NAME")) {
        return {
          success: false,
          error: "Customer name must be between 2 and 80 characters.",
          code: "INVALID_NAME",
        };
      }
      if (msg.includes("INVALID_PHONE")) {
        return {
          success: false,
          error: "Please enter a valid 10-digit Indian phone number.",
          code: "INVALID_PHONE",
        };
      }
      if (msg.includes("INVALID_ITEMS")) {
        return {
          success: false,
          error: "Invalid cart items provided. Please review your cart.",
          code: "INVALID_ITEMS",
        };
      }

      return {
        success: false,
        error:
          "We could not process your order at this time. Please check your details and try again.",
      };
    }

    // 6. Return generated order info
    const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    if (!row?.order_number || !row?.public_token) {
      return {
        success: false,
        error:
          "Order was received but tracking information was missing. Please contact the bakery.",
      };
    }

    return {
      success: true,
      orderId: row.order_id,
      orderNumber: row.order_number,
      publicToken: row.public_token,
    };
  } catch (err) {
    console.error("[placeOrderAction] Unexpected failure:", err);
    return {
      success: false,
      error:
        "An unexpected error occurred while placing your order. Please try again.",
    };
  }
}

/**
 * Server Action: Looks up an order's secure public_token using order number + customer phone number.
 */
export async function lookupOrderTokenAction(
  input: unknown
): Promise<{ success: boolean; token?: string; error?: string }> {
  const parsed = lookupOrderTokenSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ||
        "Please provide a valid order number and phone number.",
    };
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("find_order_token", {
      p_order_number: parsed.data.orderNumber.trim(),
      p_phone: parsed.data.phone.trim(),
    });

    if (error || !data) {
      return {
        success: false,
        error:
          "No matching order found. Please verify your order number (e.g. NB1001) and 10-digit phone number.",
      };
    }

    return {
      success: true,
      token: data as string,
    };
  } catch (err) {
    console.error("[lookupOrderTokenAction] Unexpected error:", err);
    return {
      success: false,
      error: "Unable to search orders at this time. Please try again later.",
    };
  }
}
