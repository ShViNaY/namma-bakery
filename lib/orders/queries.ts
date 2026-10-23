import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OrderTrackDetails } from "./types";

/**
 * Fetches order details for public tracking via the secure 64-character unguessable public_token.
 *
 * Calls the database SECURITY DEFINER function `get_order_by_token(p_token)`
 * which limits customer PII (e.g. only exposes first_name, never full customer details)
 * and retrieves line items and state transitions.
 * Memoized per-request to avoid redundant roundtrips across metadata and page render.
 */
export const getOrderByToken = cache(
  async (token: string): Promise<OrderTrackDetails | null> => {
    if (!token || typeof token !== "string" || token.trim().length === 0) {
      return null;
    }

    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase.rpc("get_order_by_token", {
        p_token: token.trim(),
      });

      if (error || !data) {
        if (error) {
          console.error("[getOrderByToken] Supabase RPC error:", error.message);
        }
        return null;
      }

      return data as OrderTrackDetails;
    } catch (err) {
      console.error("[getOrderByToken] Execution failure:", err);
      return null;
    }
  }
);
