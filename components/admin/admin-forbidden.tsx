import * as React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, LogOut, LayoutDashboard } from "lucide-react";
import { staffSignOutAction } from "@/lib/staff/actions";
import type { StaffRole } from "@/lib/staff/types";

interface AdminForbiddenProps {
  userEmail?: string | null;
  role?: StaffRole | null;
}

export function AdminForbidden({ userEmail, role }: AdminForbiddenProps) {
  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full rounded-sm border border-destructive/30 bg-card p-6 sm:p-8 text-center space-y-4 shadow-sm">
        <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <ShieldAlert className="size-6" />
        </div>

        <div className="space-y-1.5">
          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-destructive/10 text-destructive">
            403 Forbidden
          </span>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
            Admin Privileges Required
          </h1>
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Your account <strong className="text-foreground">{userEmail || "staff user"}</strong> has{" "}
          <span className="font-semibold text-foreground uppercase">{role || "EMPLOYEE"}</span> privileges.
          Only active bakery administrators can access the store configuration and catalog administration portal.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/staff"
            className="w-full sm:w-auto h-10 px-4 rounded-sm bg-caramel text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-caramel/90 transition-colors"
          >
            <LayoutDashboard className="size-3.5" />
            <span>Go to Staff Dashboard</span>
          </Link>

          <form action={staffSignOutAction} className="w-full sm:w-auto">
            <button
              type="submit"
              className="w-full sm:w-auto h-10 px-4 rounded-sm border border-border bg-background text-xs font-semibold text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut className="size-3.5" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" />
            <span>Return to Namma Bakery storefront</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
