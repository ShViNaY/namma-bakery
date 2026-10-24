import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server Supabase Client.
 *
 * For use in Server Components, Server Actions, and Route Handlers.
 * Synchronizes auth session state via Next.js cookies (getAll / setAll).
 * Uses public publishable key (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) so operations
 * are constrained by Row Level Security (RLS).
 * Never exposes secret key credentials.
 */
export async function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_placeholder";

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      async getAll() {
        const cookieStore = await cookies();
        return cookieStore.getAll();
      },
      async setAll(cookiesToSet) {
        try {
          const cookieStore = await cookies();
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // In Next.js App Router, cookies cannot be modified during Server Component rendering.
          // This can be safely ignored when middleware handles session refresh.
        }
      },
    },
  });
}
