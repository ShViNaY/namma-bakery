import type { Metadata } from "next";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { requireStaffSession } from "@/lib/staff/auth";
import { getStaffOrders, calculateOperationalSummary } from "@/lib/staff/queries";
import { StaffDashboard } from "@/components/staff/staff-dashboard";
import { staffSignOutAction } from "@/lib/staff/actions";

export const instant = false;

export const metadata: Metadata = {
  title: "Staff Dashboard | Namma Bakery",
  description: "Internal operations dashboard for Namma Bakery orders and kitchen queue.",
};

export default async function StaffPage() {
  const session = await requireStaffSession();

  // If user is authenticated but not authorized in staff_roles (forbidden)
  if (!session.isStaff) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-background">
        <div className="max-w-md w-full rounded-sm border border-border bg-card p-6 sm:p-8 text-center space-y-4">
          <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <ShieldAlert className="size-6" />
          </div>
          <h1 className="font-heading text-xl font-bold text-foreground">
            Access Restricted
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Your account ({session.user?.email}) does not have active staff or admin
            privileges to access the Namma Bakery operations dashboard.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <form action={staffSignOutAction} className="w-full sm:w-auto">
              <button
                type="submit"
                className="w-full sm:w-auto h-10 px-4 rounded-sm border border-border bg-background text-xs font-semibold text-foreground hover:bg-muted"
              >
                Sign Out
              </button>
            </form>
            <Link
              href="/"
              className="w-full sm:w-auto h-10 px-4 rounded-sm bg-caramel text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-caramel/90"
            >
              <ArrowLeft className="size-3.5" />
              <span>Return to Storefront</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fetch live orders under staff RLS
  const { orders, error } = await getStaffOrders();
  const summary = calculateOperationalSummary(orders);

  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-background">
        <div className="max-w-md w-full rounded-sm border border-destructive/40 bg-card p-6 text-center space-y-3">
          <p className="font-semibold text-destructive text-sm">
            Failed to load staff orders
          </p>
          <p className="text-xs text-muted-foreground">{error}</p>
          <Link
            href="/staff"
            className="inline-block mt-2 h-9 px-4 rounded-sm bg-caramel text-white text-xs font-semibold leading-9"
          >
            Retry
          </Link>
        </div>
      </div>
    );
  }

  return (
    <StaffDashboard
      orders={orders}
      summary={summary}
      userEmail={session.user?.email}
      role={session.role}
    />
  );
}
