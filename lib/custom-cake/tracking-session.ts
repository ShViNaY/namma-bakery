import crypto from "node:crypto";
import { cookies } from "next/headers";

export const TRACKING_SESSION_COOKIE_NAME = "cc_tracking_session";
export const TRACKING_SESSION_MAX_AGE_SECONDS = 2 * 60 * 60; // 2 hours

export interface CustomCakeTrackingSessionPayload {
  phone: string;
  verifiedRequestNumber: string;
  issuedAt: number;
  expiresAt: number;
}

/**
 * Derives a secure signing secret from environment configuration.
 */
function getSigningSecret(): string {
  const secret =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "namma-bakery-local-tracking-secret-key-fallback";
  return secret;
}

/**
 * Generates a tamper-proof HMAC-SHA256 signed tracking session token.
 */
export function createTrackingSessionToken(payload: Omit<CustomCakeTrackingSessionPayload, "issuedAt" | "expiresAt">): string {
  const secret = getSigningSecret();
  const now = Date.now();
  const fullPayload: CustomCakeTrackingSessionPayload = {
    ...payload,
    issuedAt: now,
    expiresAt: now + TRACKING_SESSION_MAX_AGE_SECONDS * 1000,
  };

  const payloadB64 = Buffer.from(JSON.stringify(fullPayload), "utf8").toString("base64url");
  const hmac = crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");
  return `${payloadB64}.${hmac}`;
}

/**
 * Verifies an HMAC-SHA256 signed tracking session token.
 * Returns the decoded payload if valid and unexpired, otherwise null.
 */
export function verifyTrackingSessionToken(token: string | null | undefined): CustomCakeTrackingSessionPayload | null {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  if (!payloadB64 || !signature) return null;

  try {
    const secret = getSigningSecret();
    const expectedSignature = crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");

    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const jsonStr = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload = JSON.parse(jsonStr) as CustomCakeTrackingSessionPayload;

    if (!payload.phone || !payload.verifiedRequestNumber || !payload.expiresAt) {
      return null;
    }

    if (payload.expiresAt < Date.now()) {
      return null; // Expired
    }

    return payload;
  } catch (err) {
    console.error("[tracking-session] Verification failed:", err);
    return null;
  }
}

/**
 * Writes the tracking session token to a secure, HTTP-only cookie.
 */
export async function setTrackingSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(TRACKING_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: TRACKING_SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

/**
 * Reads the current tracking session token from cookies.
 */
export async function getTrackingSessionCookie(): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(TRACKING_SESSION_COOKIE_NAME)?.value;
  } catch {
    return undefined;
  }
}

/**
 * Deletes the tracking session cookie.
 */
export async function clearTrackingSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TRACKING_SESSION_COOKIE_NAME);
}

/**
 * Helper to mask a 10-digit phone number for customer display (e.g. "+91 ••••• •3215").
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 4) return "+91 ••••• •••••";
  const last4 = phone.slice(-4);
  return `+91 ••••• •${last4}`;
}
