import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { StaffRole } from "./types";

export interface StaffSession {
  user: {
    id: string;
    email?: string | null;
  } | null;
  role: StaffRole | null;
  isStaff: boolean;
  isAdmin: boolean;
}

/**
 * Retrieves the current staff session if one exists.
 *
 * Verifies that the authenticated user has an active record in the `staff_roles` table.
 */
export async function getStaffSession(): Promise<StaffSession> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        user: null,
        role: null,
        isStaff: false,
        isAdmin: false,
      };
    }

    const { data: roleRow, error: roleError } = await supabase
      .from("staff_roles")
      .select("role, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (roleError || !roleRow) {
      return {
        user: { id: user.id, email: user.email },
        role: null,
        isStaff: false,
        isAdmin: false,
      };
    }

    return {
      user: { id: user.id, email: user.email },
      role: roleRow.role as StaffRole,
      isStaff: Boolean(roleRow.is_active),
      isAdmin: roleRow.role === "ADMIN",
    };
  } catch (err) {
    console.error("[getStaffSession] Failed to verify staff session:", err);
    return {
      user: null,
      role: null,
      isStaff: false,
      isAdmin: false,
    };
  }
}

/**
 * Enforces staff access on server components and route handlers.
 * If unauthenticated, redirects to `/staff/login`.
 * If authenticated but lacking staff privileges, returns forbidden session.
 */
export async function requireStaffSession(): Promise<StaffSession> {
  const session = await getStaffSession();

  if (!session.user) {
    redirect("/staff/login");
  }

  return session;
}
