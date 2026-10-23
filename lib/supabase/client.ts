import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase Client.
 *
 * For use in Client Components ("use client").
 * Uses public URL and public publishable (anon) key.
 * Safe to import and execute in browser runtime.
 */
export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
