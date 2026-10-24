import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Admin / Secret-Key Supabase Client.
 *
 * SECURITY:
 * - Uses SUPABASE_SECRET_KEY which bypasses Row Level Security (RLS).
 * - "server-only" prevents this module from ever being imported or bundled into client code.
 * - This client is strictly for trusted backend operations.
 * - Never expose or pass this client to the browser runtime.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !secretKey) {
    throw new Error(
      "Missing Supabase admin environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set."
    );
  }

  return createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
