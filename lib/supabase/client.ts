import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase Client.
 *
 * For use in Client Components ("use client").
 * Uses public URL and modern publishable API key (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).
 * Safe to import and execute in browser runtime.
 */
export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_placeholder";

  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
