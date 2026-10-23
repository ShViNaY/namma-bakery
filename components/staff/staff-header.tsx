"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  RotateCcw,
  LogOut,
  ShieldCheck,
  User,
  Clock,
  Store,
} from "lucide-react";
import type { StaffRole } from "@/lib/staff/types";
import { staffSignOutAction } from "@/lib/staff/actions";
import { formatIstDateTime } from "@/lib/utils/date";

interface StaffHeaderProps {
  email?: string | null;
  role: StaffRole | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function StaffHeader({
  email,
  role,
  onRefresh,
  isRefreshing = false,
}: StaffHeaderProps) {
  const router = useRouter();
  const [currentIstTime, setCurrentIstTime] = React.useState<string>("");

  React.useEffect(() => {
    // Update live IST clock every minute
    const updateTime = () => {
      setCurrentIstTime(formatIstDateTime(new Date()));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      router.refresh();
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left: Branding & Staff Title */}
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-sm bg-caramel/15 text-caramel">
              <Store className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-lg font-bold tracking-tight text-foreground">
                  Namma Bakery
                </span>
                <span className="rounded-sm bg-caramel/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-caramel">
                  Staff
                </span>
              </div>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Operations & Kitchen Queue · RR Nagar
              </p>
            </div>
          </div>

          {/* Right: Time, User Badge, Refresh, Logout */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Live IST clock */}
            {currentIstTime && (
              <div className="hidden md:flex items-center gap-1.5 rounded-sm border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground font-mono">
                <Clock className="size-3.5 text-caramel" />
                <span>{currentIstTime} (IST)</span>
              </div>
            )}

            {/* Role & User */}
            <div className="hidden sm:flex items-center gap-2 rounded-sm border border-border bg-background px-2.5 py-1 text-xs">
              {role === "ADMIN" ? (
                <ShieldCheck className="size-3.5 text-caramel" />
              ) : (
                <User className="size-3.5 text-muted-foreground" />
              )}
              <span className="font-medium text-foreground max-w-[140px] truncate">
                {email || "Staff Member"}
              </span>
              <span
                className={`rounded px-1.5 py-0.2 text-[10px] font-bold uppercase ${
                  role === "ADMIN"
                    ? "bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-200"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {role || "STAFF"}
              </span>
            </div>

            {/* Refresh Action */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh order queue"
              aria-label="Refresh orders"
              className="flex size-9 items-center justify-center rounded-sm border border-border bg-background text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel disabled:opacity-50"
            >
              <RotateCcw
                className={`size-4 text-foreground ${
                  isRefreshing ? "animate-spin text-caramel" : ""
                }`}
              />
            </button>

            {/* Sign Out Form Action */}
            <form action={staffSignOutAction}>
              <button
                type="submit"
                title="Sign out of staff portal"
                className="flex h-9 items-center gap-1.5 rounded-sm border border-border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
              >
                <LogOut className="size-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
