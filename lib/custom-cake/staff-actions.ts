"use server";

import { revalidatePath } from "next/cache";
import { requireStaffSession } from "@/lib/staff/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CustomCakeStatus } from "./types";

/**
 * Updates a custom cake request status with staff authorization.
 */
export async function updateCustomCakeStatusAction(params: {
  requestId: string;
  toStatus: CustomCakeStatus;
  message?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireStaffSession();
    if (!session.isStaff) {
      return { success: false, error: "Unauthorized: Staff privileges required." };
    }

    const { requestId, toStatus, message } = params;

    // If using the database RPC transitions
    if (
      toStatus === "UNDER_REVIEW" ||
      toStatus === "NEEDS_CLARIFICATION" ||
      toStatus === "DECLINED" ||
      toStatus === "CUSTOMER_ACCEPTED"
    ) {
      const supabase = await createClient();
      const { error } = await supabase.rpc("staff_review_request", {
        p_request_id: requestId,
        p_to: toStatus,
        p_message: message?.trim() || null,
      });

      if (error) {
        console.error("[updateCustomCakeStatusAction] RPC error:", error.message);
        if (error.message.includes("MESSAGE_REQUIRED")) {
          return {
            success: false,
            error: "A note or explanation is required for this status change.",
          };
        }
        return {
          success: false,
          error: "Failed to update custom cake status. Please try again.",
        };
      }
    } else {
      // Direct administrative update (e.g. manual confirmation or cancellation)
      const adminClient = createAdminClient();
      const { error: updateError } = await adminClient
        .from("custom_cake_requests")
        .update({
          status: toStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("[updateCustomCakeStatusAction] Update error:", updateError.message);
        return { success: false, error: "Failed to update custom cake status. Please try again." };
      }

      // Record message if provided
      if (message?.trim()) {
        await adminClient.from("request_messages").insert({
          request_id: requestId,
          sender: "STAFF",
          staff_id: session.user?.id,
          body: message.trim(),
        });
      }

      // Log in audit_logs
      await adminClient.from("audit_logs").insert({
        actor_id: session.user?.id,
        actor_role: session.role || "STAFF",
        action: "custom_cake.status_changed",
        entity_type: "custom_cake_requests",
        entity_id: requestId,
        after_data: { to: toStatus, note: message },
      });
    }

    revalidatePath("/staff");
    return { success: true };
  } catch (err) {
    console.error("[updateCustomCakeStatusAction] Execution failure:", err);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Adds an internal staff note or customer message on a custom cake enquiry.
 */
export async function addCustomCakeStaffNoteAction(params: {
  requestId: string;
  body: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireStaffSession();
    if (!session.isStaff || !session.user) {
      return { success: false, error: "Unauthorized: Staff privileges required." };
    }

    const trimmed = params.body.trim();
    if (!trimmed || trimmed.length > 1000) {
      return {
        success: false,
        error: "Message must be between 1 and 1,000 characters.",
      };
    }

    const supabase = await createClient();
    const { error } = await supabase.rpc("post_request_message_staff", {
      p_request_id: params.requestId,
      p_body: trimmed,
    });

    if (error) {
      console.error("[addCustomCakeStaffNoteAction] Error:", error.message);
      return { success: false, error: "Failed to post staff note." };
    }

    revalidatePath("/staff");
    return { success: true };
  } catch (err) {
    console.error("[addCustomCakeStaffNoteAction] Execution failure:", err);
    return { success: false, error: "Failed to add note." };
  }
}

/**
 * Generates a temporary signed URL for staff to view/download a cake reference image.
 */
export async function getCustomCakeSignedUrlAction(
  storagePath: string
): Promise<{ success: boolean; signedUrl?: string; error?: string }> {
  try {
    const session = await requireStaffSession();
    if (!session.isStaff) {
      return { success: false, error: "Unauthorized: Staff privileges required." };
    }

    if (
      !storagePath ||
      typeof storagePath !== "string" ||
      !storagePath.startsWith("requests/") ||
      storagePath.includes("..")
    ) {
      return { success: false, error: "Invalid reference image path." };
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient.storage
      .from("cake-references")
      .createSignedUrl(storagePath, 3600);

    if (error || !data?.signedUrl) {
      return { success: false, error: "Failed to generate image link." };
    }

    return { success: true, signedUrl: data.signedUrl };
  } catch (err) {
    console.error("[getCustomCakeSignedUrlAction] Execution failure:", err);
    return { success: false, error: "Failed to retrieve image." };
  }
}
