"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limiter";
import { customCakeTrackingInputSchema } from "./validation";
import {
  createTrackingSessionToken,
  verifyTrackingSessionToken,
  setTrackingSessionCookie,
  getTrackingSessionCookie,
  clearTrackingSessionCookie,
  maskPhoneNumber,
} from "./tracking-session";
import type { CustomCakeTrackingItem, CustomCakeStatus, CustomCakeEggType } from "./types";

const TRACKING_IP_MAX_REQUESTS = 10;
const TRACKING_IP_WINDOW_MS = 5 * 60 * 1000; // 10 attempts per 5 minutes per IP

const TRACKING_PHONE_MAX_REQUESTS = 6;
const TRACKING_PHONE_WINDOW_MS = 5 * 60 * 1000; // 6 attempts per 5 minutes per phone

interface RawEnquiryRow {
  id: string;
  request_number: string;
  public_token: string;
  customer_name: string;
  customer_phone?: string;
  status: CustomCakeStatus;
  flavour: string;
  egg_type: CustomCakeEggType;
  weight_grams: number;
  shape?: string | null;
  cake_type?: string | null;
  message_on_cake?: string | null;
  description?: string | null;
  preferred_pickup_at: string;
  additional_notes?: string | null;
  decline_reason?: string | null;
  created_at: string;
  updated_at: string;
  custom_cake_images?: Array<{ storage_path: string; mime_type: string }>;
  custom_cake_quotes?: Array<{
    price_paise: number;
    confirmed_pickup_at: string;
    bakery_note?: string | null;
    valid_until: string;
    superseded_at?: string | null;
  }>;
  request_messages?: Array<{
    sender: "CUSTOMER" | "STAFF";
    body: string;
    created_at: string;
  }>;
}

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Normalizes any stored phone string to its 10-digit national number for comparison.
 */
function extractNationalPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

/**
 * Maps raw database custom cake rows into customer-safe tracking items.
 */
async function mapEnquiryRows(
  rows: RawEnquiryRow[],
  adminClient: AdminClient
): Promise<CustomCakeTrackingItem[]> {
  const items: CustomCakeTrackingItem[] = [];

  for (const row of rows) {
    // Generate signed URL for reference image if available
    let referenceImageUrl: string | null = null;
    const firstImg = row.custom_cake_images?.[0];
    if (firstImg?.storage_path) {
      try {
        const { data: signedData } = await adminClient.storage
          .from("cake-references")
          .createSignedUrl(firstImg.storage_path, 3600);
        referenceImageUrl = signedData?.signedUrl || null;
      } catch (err) {
        console.error("[tracking-actions] Failed to sign reference image:", err);
      }
    }

    // Active quote if any
    const activeQuote = row.custom_cake_quotes?.find(
      (q) => !q.superseded_at
    );

    // Formatted customer-safe messages
    const messages = (row.request_messages || []).map((msg) => ({
      sender: msg.sender,
      body: msg.body,
      created_at: msg.created_at,
    }));

    items.push({
      id: row.id,
      request_number: row.request_number,
      public_token: row.public_token,
      customer_name: row.customer_name,
      status: row.status,
      flavour: row.flavour,
      egg_type: row.egg_type,
      weight_grams: row.weight_grams,
      shape: row.shape,
      cake_type: row.cake_type,
      message_on_cake: row.message_on_cake,
      description: row.description,
      preferred_pickup_at: row.preferred_pickup_at,
      additional_notes: row.additional_notes,
      decline_reason: row.decline_reason,
      created_at: row.created_at,
      updated_at: row.updated_at,
      reference_image_url: referenceImageUrl,
      quote: activeQuote
        ? {
            price_paise: activeQuote.price_paise,
            confirmed_pickup_at: activeQuote.confirmed_pickup_at,
            bakery_note: activeQuote.bakery_note,
            valid_until: activeQuote.valid_until,
          }
        : null,
      messages,
    });
  }

  return items;
}

/**
 * Server Action: Verifies customer credentials (enquiry number + phone number).
 *
 * Security:
 * - Rate-limited by IP and by phone number.
 * - Strict schema validation.
 * - Validates ownership: enquiry number must exist and belong to the supplied phone.
 * - On success, generates an HMAC-signed session token stored in an HTTP-only cookie.
 * - Returns all Custom Cake enquiries for that verified phone number.
 */
export async function verifyCustomCakeTrackingAction(
  input: unknown
): Promise<{
  success: boolean;
  enquiries?: CustomCakeTrackingItem[];
  verifiedPhone?: string;
  error?: string;
}> {
  // 1. IP Rate Limiting
  const clientIp = await getClientIp();
  const ipLimit = checkRateLimit({
    key: `custom_cake_track:ip:${clientIp}`,
    maxRequests: TRACKING_IP_MAX_REQUESTS,
    windowMs: TRACKING_IP_WINDOW_MS,
  });

  if (!ipLimit.allowed) {
    return {
      success: false,
      error: `Too many tracking lookup requests. Please wait ${ipLimit.retryAfterSeconds} seconds before trying again.`,
    };
  }

  // 2. Strict Input Validation
  const parsed = customCakeTrackingInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ||
        "Please provide a valid Custom Cake enquiry number (e.g. CC1022) and 10-digit phone number.",
    };
  }

  const { enquiryNumber, phone: cleanPhone } = parsed.data;

  // 3. Phone Rate Limiting
  const phoneLimit = checkRateLimit({
    key: `custom_cake_track:phone:${cleanPhone}`,
    maxRequests: TRACKING_PHONE_MAX_REQUESTS,
    windowMs: TRACKING_PHONE_WINDOW_MS,
  });

  if (!phoneLimit.allowed) {
    return {
      success: false,
      error: `Too many lookup attempts for this phone number. Please wait ${phoneLimit.retryAfterSeconds} seconds before trying again.`,
    };
  }

  try {
    const adminClient = createAdminClient();

    // 4. Verify that the enquiry exists and belongs to the specified phone number
    const { data: targetEnquiry, error: lookupErr } = await adminClient
      .from("custom_cake_requests")
      .select("id, request_number, customer_phone")
      .eq("request_number", enquiryNumber)
      .maybeSingle();

    if (lookupErr) {
      console.error("[verifyCustomCakeTrackingAction] Database lookup error:", lookupErr);
      return {
        success: false,
        error: "Unable to verify enquiry details right now. Please try again.",
      };
    }

    // Generic error on mismatch: do not reveal whether the enquiry exists or whether the phone is wrong
    if (!targetEnquiry) {
      return {
        success: false,
        error:
          "Those details don't match a custom cake enquiry. Please check your enquiry number and phone number.",
      };
    }

    const storedCleanPhone = extractNationalPhone(targetEnquiry.customer_phone);
    if (storedCleanPhone !== cleanPhone) {
      return {
        success: false,
        error:
          "Those details don't match a custom cake enquiry. Please check your enquiry number and phone number.",
      };
    }

    // 5. Establish secure session token & HTTP-only cookie
    const token = createTrackingSessionToken({
      phone: cleanPhone,
      verifiedRequestNumber: enquiryNumber,
    });
    await setTrackingSessionCookie(token);

    // 6. Query ALL custom cake enquiries associated with this verified phone number
    const { data: allEnquiries, error: fetchErr } = await adminClient
      .from("custom_cake_requests")
      .select(`
        id,
        request_number,
        public_token,
        customer_name,
        customer_phone,
        flavour,
        egg_type,
        weight_grams,
        shape,
        cake_type,
        message_on_cake,
        description,
        preferred_pickup_at,
        additional_notes,
        status,
        decline_reason,
        created_at,
        updated_at,
        custom_cake_images (
          storage_path,
          mime_type
        ),
        custom_cake_quotes (
          price_paise,
          confirmed_pickup_at,
          bakery_note,
          valid_until,
          superseded_at
        ),
        request_messages (
          sender,
          body,
          created_at
        )
      `)
      .or(`customer_phone.eq.${cleanPhone},customer_phone.eq.+91${cleanPhone},customer_phone.eq.91${cleanPhone}`)
      .order("created_at", { ascending: false });

    if (fetchErr) {
      console.error("[verifyCustomCakeTrackingAction] Error fetching all enquiries:", fetchErr);
      return {
        success: false,
        error: "Verified access, but failed to load all enquiries. Please refresh the page.",
      };
    }

    const items = await mapEnquiryRows(allEnquiries || [], adminClient);

    return {
      success: true,
      enquiries: items,
      verifiedPhone: maskPhoneNumber(cleanPhone),
    };
  } catch (err) {
    console.error("[verifyCustomCakeTrackingAction] Unexpected error:", err);
    return {
      success: false,
      error: "An unexpected error occurred while verifying tracking details. Please try again.",
    };
  }
}

/**
 * Server Action: Checks for an existing valid tracking session and returns the dashboard items.
 */
export async function getCustomCakeDashboardAction(): Promise<{
  authenticated: boolean;
  enquiries?: CustomCakeTrackingItem[];
  verifiedPhone?: string;
  error?: string;
}> {
  try {
    const rawCookie = await getTrackingSessionCookie();
    const session = verifyTrackingSessionToken(rawCookie);

    if (!session) {
      return { authenticated: false };
    }

    const adminClient = createAdminClient();
    const { data: allEnquiries, error: fetchErr } = await adminClient
      .from("custom_cake_requests")
      .select(`
        id,
        request_number,
        public_token,
        customer_name,
        customer_phone,
        flavour,
        egg_type,
        weight_grams,
        shape,
        cake_type,
        message_on_cake,
        description,
        preferred_pickup_at,
        additional_notes,
        status,
        decline_reason,
        created_at,
        updated_at,
        custom_cake_images (
          storage_path,
          mime_type
        ),
        custom_cake_quotes (
          price_paise,
          confirmed_pickup_at,
          bakery_note,
          valid_until,
          superseded_at
        ),
        request_messages (
          sender,
          body,
          created_at
        )
      `)
      .or(`customer_phone.eq.${session.phone},customer_phone.eq.+91${session.phone},customer_phone.eq.91${session.phone}`)
      .order("created_at", { ascending: false });

    if (fetchErr) {
      console.error("[getCustomCakeDashboardAction] Error fetching enquiries:", fetchErr);
      return {
        authenticated: true,
        error: "Unable to refresh custom cake enquiries right now. Please try again.",
      };
    }

    const items = await mapEnquiryRows(allEnquiries || [], adminClient);

    return {
      authenticated: true,
      enquiries: items,
      verifiedPhone: maskPhoneNumber(session.phone),
    };
  } catch (err) {
    console.error("[getCustomCakeDashboardAction] Unexpected error:", err);
    return {
      authenticated: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Server Action: Logs out / clears the customer tracking session cookie.
 */
export async function logoutCustomCakeTrackingAction(): Promise<{ success: boolean }> {
  try {
    await clearTrackingSessionCookie();
    revalidatePath("/custom-cake/track");
    return { success: true };
  } catch (err) {
    console.error("[logoutCustomCakeTrackingAction] Error:", err);
    return { success: false };
  }
}
