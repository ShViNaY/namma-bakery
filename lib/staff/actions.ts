"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStaffSession } from "./auth";
import type { OrderStatus } from "@/lib/orders/types";

export interface ActionState {
  error?: string | null;
  success?: boolean;
}

/**
 * Signs in a staff member and ensures they have active staff privileges in `staff_roles`.
 */
export async function staffLoginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Please enter both email and password." };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return { error: "Invalid email or password. Please try again." };
    }

    // Explicitly verify active staff role in staff_roles
    const { data: roleRow, error: roleError } = await supabase
      .from("staff_roles")
      .select("role, is_active")
      .eq("user_id", data.user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (roleError || !roleRow) {
      // Non-staff user attempting to access staff portal: sign out immediately
      await supabase.auth.signOut();
      return {
        error:
          "Access denied. Only authorized bakery staff members can access the staff dashboard.",
      };
    }
  } catch (err) {
    console.error("[staffLoginAction] Login error:", err);
    return { error: "An unexpected error occurred. Please try again later." };
  }

  redirect("/staff");
}

/**
 * Signs out the current staff user and redirects to the staff login page.
 */
export async function staffSignOutAction(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("[staffSignOutAction] Sign out error:", err);
  }
  redirect("/staff/login");
}

/**
 * Server action to transition order status using the database RPC `transition_order`.
 * Enforces staff privileges and maps database error codes to clear staff messages.
 */
export async function transitionOrderAction(params: {
  orderId: string;
  toStatus: OrderStatus;
  note?: string;
  estimatedReadyAt?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireStaffSession();
    if (!session.isStaff) {
      return { success: false, error: "Forbidden: Staff privileges required." };
    }

    const supabase = await createClient();
    const { error } = await supabase.rpc("transition_order", {
      p_order_id: params.orderId,
      p_to: params.toStatus,
      p_note: params.note?.trim() || null,
      p_estimated_ready_at: params.estimatedReadyAt || null,
    });

    if (error) {
      console.error("[transitionOrderAction] Transition RPC error:", error.message);
      if (error.message.includes("REASON_REQUIRED")) {
        return { success: false, error: "A note/reason is required for this status change." };
      }
      if (error.message.includes("ESTIMATED_READY_TIME_REQUIRED")) {
        return {
          success: false,
          error: "An estimated ready time is required to accept this order.",
        };
      }
      if (error.message.includes("INVALID_TRANSITION")) {
        return {
          success: false,
          error: "Invalid status transition. Orders must follow the approved workflow.",
        };
      }
      if (error.message.includes("admin only")) {
        return {
          success: false,
          error: "This transition requires Administrator authorization.",
        };
      }
      return { success: false, error: error.message };
    }

    revalidatePath("/staff");
    return { success: true };
  } catch (err) {
    console.error("[transitionOrderAction] Execution failure:", err);
    return {
      success: false,
      error: "Failed to update order status. Please check connectivity and try again.",
    };
  }
}

/**
 * Server action to record an in-store counter payment using the database RPC `record_store_payment`.
 */
export async function recordStorePaymentAction(params: {
  orderId: string;
  amountPaise: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireStaffSession();
    if (!session.isStaff) {
      return { success: false, error: "Forbidden: Staff privileges required." };
    }

    const supabase = await createClient();
    const { error } = await supabase.rpc("record_store_payment", {
      p_order_id: params.orderId,
      p_amount_paise: params.amountPaise,
    });

    if (error) {
      console.error("[recordStorePaymentAction] Payment RPC error:", error.message);
      if (error.message.includes("ORDER_NOT_READY_FOR_PAYMENT")) {
        return {
          success: false,
          error: "Payment can only be recorded when the order is ready for pickup or completed.",
        };
      }
      if (error.message.includes("ALREADY_PAID")) {
        return { success: false, error: "This order is already marked as paid." };
      }
      return { success: false, error: error.message };
    }

    revalidatePath("/staff");
    return { success: true };
  } catch (err) {
    console.error("[recordStorePaymentAction] Execution failure:", err);
    return {
      success: false,
      error: "Failed to record payment. Please try again.",
    };
  }
}

/**
 * Server action to add an internal bakery staff note on an order.
 */
export async function addInternalNoteAction(params: {
  orderId: string;
  body: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireStaffSession();
    if (!session.isStaff || !session.user) {
      return { success: false, error: "Forbidden: Staff privileges required." };
    }

    const trimmed = params.body.trim();
    if (!trimmed || trimmed.length > 1000) {
      return {
        success: false,
        error: "Note must be between 1 and 1000 characters.",
      };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("order_internal_notes").insert({
      order_id: params.orderId,
      author_id: session.user.id,
      body: trimmed,
    });

    if (error) {
      console.error("[addInternalNoteAction] Database error:", error.message);
      return { success: false, error: "Failed to save internal note." };
    }

    revalidatePath("/staff");
    return { success: true };
  } catch (err) {
    console.error("[addInternalNoteAction] Execution failure:", err);
    return { success: false, error: "Failed to save note." };
  }
}
