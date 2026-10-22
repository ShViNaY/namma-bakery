import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server Supabase Client.
 *
 * For use in Server Components, Server Actions, and Route Handlers.
 * Synchronizes auth session state via Next.js cookies (getAll / setAll).
 * Uses public anon key so operations are constrained by Row Level Security (RLS).
 * Never exposes service-role credentials.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
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
