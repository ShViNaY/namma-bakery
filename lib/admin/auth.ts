import "server-only";
import { redirect } from "next/navigation";
import { getStaffSession, type StaffSession } from "@/lib/staff/auth";

export interface AdminAuthCheck {
  authorized: boolean;
  session: StaffSession;
}

/**
 * Server guard for the /admin page.
 * - If unauthenticated -> redirects to /staff/login?redirect=/admin.
 * - If authenticated but not an active ADMIN -> returns authorized: false (caller renders 403).
 * - If active ADMIN -> returns authorized: true with session.
 */
export async function requireAdminSession(): Promise<AdminAuthCheck> {
  const session = await getStaffSession();

  if (!session.user) {
    redirect("/staff/login?redirect=/admin");
  }

  const authorized = Boolean(session.isStaff && session.isAdmin);

  return {
    authorized,
    session,
  };
}

/**
 * Server action guard. Throws an error immediately if the user is not an active ADMIN.
 */
export async function assertAdminSession(): Promise<StaffSession> {
  const session = await getStaffSession();

  if (!session.user) {
    throw new Error("Unauthorized: Authentication required.");
  }

  if (!session.isStaff || !session.isAdmin) {
    throw new Error("Forbidden: Admin privileges required.");
  }

  return session;
}
