"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import {
  placeOrderInputSchema,
  lookupOrderTokenSchema,
} from "./validation";
import type { PlaceOrderResult } from "./types";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limiter";

const DEFAULT_LOCATION_SLUG = "namma-bakery-rr-nagar";

// Rate limiting thresholds
const ORDER_IP_MAX_REQUESTS = 6;
const ORDER_IP_WINDOW_MS = 10 * 60 * 1000; // 6 orders per 10 minutes per IP

const ORDER_PHONE_MAX_REQUESTS = 3;
const ORDER_PHONE_WINDOW_MS = 10 * 60 * 1000; // 3 orders per 10 minutes per phone

const LOOKUP_IP_MAX_REQUESTS = 10;
const LOOKUP_IP_WINDOW_MS = 5 * 60 * 1000; // 10 lookups per 5 minutes per IP

/**
 * Server Action: Places a customer order.
 *
 * HARDENED SECURITY & ARCHITECTURAL BOUNDARY:
 * 1. Rate Limiting: Sliding window per IP and per customer phone number.
 * 2. Strict Input Validation: Zod schema with `.strict()` rejects unknown fields, validates UUIDs, and enforces quantity bounds.
 * 3. Zero Trust Client Data: Server ignores all client prices and totals completely.
 * 4. Concurrency & Slot Locking: `place_order` locks store settings row in Postgres to prevent race conditions.
 * 5. Lead Time & Capacity: Authoritatively checked in Postgres against real menu items.
 * 6. PII & Error Sanitization: Database internal stack traces and SQL errors are never returned to client.
 */
export async function placeOrderAction(input: unknown): Promise<PlaceOrderResult> {
  // 1. IP-level rate limit check
  const clientIp = await getClientIp();
  const ipLimit = checkRateLimit({
    key: `order:ip:${clientIp}`,
    maxRequests: ORDER_IP_MAX_REQUESTS,
    windowMs: ORDER_IP_WINDOW_MS,
  });

  if (!ipLimit.allowed) {
    return {
      success: false,
      error: `Too many order attempts from your network. Please wait ${ipLimit.retryAfterSeconds} seconds before trying again.`,
      code: "RATE_LIMITED",
    };
  }

  // 2. Strict Zod Schema validation
  const parsed = placeOrderInputSchema.safeParse(input);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      success: false,
      error: firstIssue?.message || "Invalid order information provided.",
      code: "VALIDATION_FAILED",
    };
  }

  // 3. Phone-level rate limit check
  const cleanPhone = parsed.data.customerDetails.customerPhone;
  const phoneLimit = checkRateLimit({
    key: `order:phone:${cleanPhone}`,
    maxRequests: ORDER_PHONE_MAX_REQUESTS,
    windowMs: ORDER_PHONE_WINDOW_MS,
  });

  if (!phoneLimit.allowed) {
    return {
      success: false,
      error: `Too many order placement attempts for this phone number. Please wait ${phoneLimit.retryAfterSeconds} seconds before submitting again.`,
      code: "RATE_LIMITED",
    };
  }

  try {
    const supabase = createAdminClient();

    // 4. Resolve store location ID
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

    // 5. Identify authenticated customer if present, otherwise null for guest
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

    // 6. Format items matching database place_order(..., p_items jsonb) specification
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

    // 7. Invoke Postgres place_order RPC with database-level concurrency & pricing authority
    const { data: rpcData, error: rpcError } = await supabase.rpc("place_order", {
      p_location_id: locationId,
      p_customer_id: customerId,
      p_name: parsed.data.customerDetails.customerName.trim(),
      p_phone: cleanPhone,
      p_email: parsed.data.customerDetails.customerEmail?.trim() || null,
      p_pickup: parsed.data.pickupSlotStart,
      p_notes: parsed.data.customerDetails.customerNotes?.trim() || null,
      p_items: p_items,
    });

    // 8. Handle and translate database business errors safely
    if (rpcError) {
      const msg = rpcError.message || "";
      // Log sanitized error code without customer PII
      console.error("[placeOrderAction] Order placement refused by database:", {
        code: rpcError.code,
        message: msg.slice(0, 100),
      });

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

    // 9. Return generated order info
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
    // Avoid logging sensitive client PII
    console.error("[placeOrderAction] Unexpected server exception:", {
      message: err instanceof Error ? err.message : "Unknown error",
    });
    return {
      success: false,
      error:
        "An unexpected error occurred while placing your order. Please try again.",
    };
  }
}

/**
 * Server Action: Looks up an order's secure public_token using order number + customer phone number.
 *
 * HARDENED ABUSE PROTECTION:
 * - Rate limited by IP (max 10 attempts per 5 minutes) to prevent brute force scraping or enumeration.
 * - Strict regex input validation for order number and Indian mobile format.
 * - Database RPC only returns the public_token if BOTH order number and phone number match.
 */
export async function lookupOrderTokenAction(
  input: unknown
): Promise<{ success: boolean; token?: string; error?: string }> {
  // 1. IP Rate Limiting
  const clientIp = await getClientIp();
  const ipLimit = checkRateLimit({
    key: `lookup:ip:${clientIp}`,
    maxRequests: LOOKUP_IP_MAX_REQUESTS,
    windowMs: LOOKUP_IP_WINDOW_MS,
  });

  if (!ipLimit.allowed) {
    return {
      success: false,
      error: `Too many tracking lookup requests. Please wait ${ipLimit.retryAfterSeconds} seconds before searching again.`,
    };
  }

  // 2. Strict Input Validation
  const parsed = lookupOrderTokenSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ||
        "Please provide a valid order number (e.g. NB1001) and 10-digit phone number.",
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
    console.error("[lookupOrderTokenAction] Unexpected error:", {
      message: err instanceof Error ? err.message : "Unknown error",
    });
    return {
      success: false,
      error: "Unable to search orders at this time. Please try again later.",
    };
  }
}
