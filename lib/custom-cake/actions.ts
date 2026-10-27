"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limiter";
import {
  customCakeFormSchema,
  validateReferenceImageFile,
  validateImageMagicBytes,
} from "./validation";
import type { CustomCakePublicView } from "./types";

const DEFAULT_LOCATION_SLUG = "namma-bakery-rr-nagar";

export interface CustomCakeSubmitResult {
  success: boolean;
  requestId?: string;
  id?: string;
  requestNumber?: string;
  token?: string;
  error?: string;
}

/**
 * Combines a calendar date (YYYY-MM-DD) and a time string into an Asia/Kolkata ISO timestamptz string.
 */
function buildIstPickupIso(dateStr: string, timeStr: string): string {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  let hours = 16;
  let minutes = 0;

  if (match) {
    hours = parseInt(match[1], 10);
    minutes = parseInt(match[2], 10);
    const meridiem = match[3]?.toUpperCase();
    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
  }

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dateStr}T${pad(hours)}:${pad(minutes)}:00+05:30`;
}

/**
 * Submits a custom celebration cake request.
 *
 * Security:
 * - Rate limited by client IP (5 requests / 10 minutes)
 * - Strict schema validation with Zod
 * - File mime type & size validation
 * - Invokes database submit_custom_request RPC via admin client
 * - Uploads reference photo to controlled private Supabase storage bucket
 */
export async function submitCustomCakeRequestAction(
  formData: FormData
): Promise<CustomCakeSubmitResult> {
  // 1. IP Rate Limiting
  const ip = await getClientIp();
  const limit = checkRateLimit({
    key: `custom_cake_submit:${ip}`,
    maxRequests: 5,
    windowMs: 10 * 60 * 1000,
  });

  if (!limit.allowed) {
    return {
      success: false,
      error: `Too many cake enquiries submitted. Please wait ${limit.retryAfterSeconds} seconds before trying again.`,
    };
  }

  // 2. Extract and validate text fields
  const rawData = {
    customerName: formData.get("customerName") as string,
    customerPhone: formData.get("customerPhone") as string,
    customerEmail: (formData.get("customerEmail") as string) || undefined,
    cakeType: formData.get("cakeType") as string,
    flavour: formData.get("flavour") as string,
    eggType: formData.get("eggType") as string,
    weightGrams: Number(formData.get("weightGrams")),
    shape: (formData.get("shape") as string) || "Round",
    preferredPickupDate: formData.get("preferredPickupDate") as string,
    preferredPickupTime: formData.get("preferredPickupTime") as string,
    description: formData.get("description") as string,
    messageOnCake: (formData.get("messageOnCake") as string) || undefined,
    additionalNotes: (formData.get("additionalNotes") as string) || undefined,
  };

  const parsed = customCakeFormSchema.safeParse(rawData);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "Invalid custom cake details.";
    return { success: false, error: firstError };
  }

  // 3. Validate reference image file if present
  const imageFile = formData.get("referenceImage") as File | null;
  const imageValidation = validateReferenceImageFile(imageFile);
  if (!imageValidation.valid) {
    return { success: false, error: imageValidation.error };
  }

  try {
    const supabase = createAdminClient();

    // 4. Resolve configured bakery location ID authoritatively using admin client
    const { data: locationData, error: locationError } = await supabase
       .from("locations")
       .select("id")
       .eq("slug", DEFAULT_LOCATION_SLUG)
       .eq("is_active", true)
       .maybeSingle();

    if (locationError) {
      console.error("[submitCustomCakeRequestAction] Database error querying location:", {
        slug: DEFAULT_LOCATION_SLUG,
        message: locationError.message,
        code: locationError.code,
      });
      return {
        success: false,
        error: "Bakery location could not be resolved. Please try again later.",
      };
    }

    if (!locationData?.id) {
      console.error("[submitCustomCakeRequestAction] Active bakery location not found:", {
        slug: DEFAULT_LOCATION_SLUG,
      });
      return {
        success: false,
        error: "Bakery location could not be resolved. Please try again later.",
      };
    }

    const locationId = locationData.id;

    // 5. Identify authenticated customer if logged in
    let customerId: string | null = null;
    try {
      const serverAuth = await createServerClient();
      const userRes = await serverAuth.auth.getUser().catch(() => ({ data: { user: null }, error: null }));
      if (userRes.data?.user?.id) customerId = userRes.data.user.id;
    } catch {
      customerId = null;
    }

    // 6. Format pickup timestamp in IST
    const pickupIso = buildIstPickupIso(
      parsed.data.preferredPickupDate,
      parsed.data.preferredPickupTime
    );

    // 7. Invoke PostgreSQL submit_custom_request RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "submit_custom_request",
      {
        p_location_id: locationId,
        p_customer_id: customerId,
        p_name: parsed.data.customerName.trim(),
        p_phone: parsed.data.customerPhone,
        p_email: parsed.data.customerEmail || null,
        p_flavour: parsed.data.flavour.trim(),
        p_egg: parsed.data.eggType,
        p_weight_grams: parsed.data.weightGrams,
        p_shape: parsed.data.shape,
        p_cake_type: parsed.data.cakeType.trim(),
        p_message: parsed.data.messageOnCake || null,
        p_description: parsed.data.description.trim(),
        p_pickup: pickupIso,
        p_notes: parsed.data.additionalNotes || null,
      }
    );

    if (rpcError) {
      console.error("[submitCustomCakeRequestAction] Database error:", rpcError.message);
      if (rpcError.message.includes("ORDERS_PAUSED")) {
        return {
          success: false,
          error: "Custom cake orders are temporarily paused. Please check back shortly.",
        };
      }
      if (rpcError.message.includes("TOO_MANY_OPEN_REQUESTS")) {
        return {
          success: false,
          error: "You have reached the maximum open custom cake requests for this phone number.",
        };
      }
      if (rpcError.message.includes("INVALID_PHONE")) {
        return {
          success: false,
          error: "Please enter a valid 10-digit mobile phone number.",
        };
      }
      return {
        success: false,
        error: "Failed to submit custom cake enquiry. Please verify details and try again.",
      };
    }

    const created = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    if (!created?.request_id || !created?.public_token) {
      return {
        success: false,
        error: "Enquiry creation failed. Please try again.",
      };
    }

    const requestId = created.request_id as string;
    const requestNumber = created.request_number as string;
    const publicToken = created.public_token as string;

    // 8. Upload reference image if attached
    if (imageFile && imageFile.size > 0) {
      try {
        const fileBytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(fileBytes);

        // Verify magic bytes header
        if (!validateImageMagicBytes(buffer)) {
          console.warn("[submitCustomCakeRequestAction] Image upload rejected: invalid file signature.");
        } else {
          const ext = imageFile.type === "image/png" ? "png" : imageFile.type === "image/webp" ? "webp" : "jpg";
          const storagePath = `requests/${requestId}/${crypto.randomUUID()}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from("cake-references")
            .upload(storagePath, buffer, {
              contentType: imageFile.type,
              upsert: false,
            });

          if (uploadError) {
            console.error("[submitCustomCakeRequestAction] Image upload failed:", uploadError.message);
          } else {
            // Record image reference in custom_cake_images table
            await supabase.from("custom_cake_images").insert({
              request_id: requestId,
              storage_path: storagePath,
              mime_type: imageFile.type,
              size_bytes: imageFile.size,
            });
          }
        }
      } catch (imgErr) {
        console.error("[submitCustomCakeRequestAction] Image handling error:", imgErr);
        // Do not fail the whole enquiry if only the image upload errored
      }
    }

    return {
      success: true,
      requestId,
      id: requestId,
      requestNumber,
      token: publicToken,
    };
  } catch (err) {
    console.error("[submitCustomCakeRequestAction] Unexpected error:", err);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again later.",
    };
  }
}

/**
 * Retrieves public confirmation & tracking details for a custom cake request using its public token.
 *
 * Security:
 * - Secret unguessable public capability token required
 * - Omits sensitive customer PII (full phone, full surname, email)
 * - Returns signed URL for reference image
 */
export async function getCustomCakePublicViewAction(
  token: string
): Promise<{ success: boolean; data?: CustomCakePublicView; error?: string }> {
  if (!token || typeof token !== "string" || !/^[a-zA-Z0-9_-]{20,128}$/.test(token.trim())) {
    return { success: false, error: "Invalid tracking token format." };
  }

  const trimmed = token.trim();

  try {
    const supabase = createAdminClient();

    // 1. Fetch from custom_cake_requests via database SECURITY DEFINER function
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "get_request_by_token",
      { p_token: trimmed }
    );

    if (rpcError || !rpcData) {
      if (rpcError) {
        console.error("[getCustomCakePublicViewAction] RPC query error:", rpcError.message);
      }
      return { success: false, error: "Custom cake request not found." };
    }

    // 2. Construct privacy-safe response from RPC data
    const publicView: CustomCakePublicView = {
      request_number: rpcData.request_number,
      status: rpcData.status,
      first_name: rpcData.first_name,
      flavour: rpcData.flavour,
      egg_type: rpcData.egg_type,
      weight_grams: rpcData.weight_grams,
      shape: rpcData.shape || null,
      cake_type: rpcData.cake_type || null,
      message_on_cake: rpcData.message_on_cake || null,
      description: rpcData.description || null,
      preferred_pickup_at: rpcData.preferred_pickup_at,
      additional_notes: rpcData.additional_notes || null,
      decline_reason: rpcData.decline_reason || null,
      created_at: rpcData.created_at || null,
      reference_image_url: null,
      quote: rpcData.quote || null,
      messages: rpcData.messages || [],
      order_token: rpcData.order_token || null,
    };

    return { success: true, data: publicView };
  } catch (err) {
    console.error("[getCustomCakePublicViewAction] Execution error:", err);
    return { success: false, error: "Failed to retrieve request details." };
  }
}
