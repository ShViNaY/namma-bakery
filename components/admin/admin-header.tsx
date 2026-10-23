"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Store,
  ShieldAlert,
  RotateCcw,
  LogOut,
  Clock,
  LayoutDashboard,
  UtensilsCrossed,
  ArrowUpRight,
} from "lucide-react";
import { staffSignOutAction } from "@/lib/staff/actions";
import { formatIstDateTime } from "@/lib/utils/date";

interface AdminHeaderProps {
  email?: string | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function AdminHeader({
  email,
  onRefresh,
  isRefreshing = false,
}: AdminHeaderProps) {
  const router = useRouter();
  const [currentIstTime, setCurrentIstTime] = React.useState<string>("");

  React.useEffect(() => {
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
          {/* Left: Branding & Admin Title */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex size-9 items-center justify-center rounded-sm bg-amber-500/15 text-amber-900 dark:text-amber-300"
            >
              <Store className="size-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-lg font-bold tracking-tight text-foreground">
                  Namma Bakery
                </span>
                <span className="rounded-sm border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
                  Admin Portal
                </span>
              </div>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Store Operations, Catalog & Administration · RR Nagar
              </p>
            </div>
          </div>

          {/* Right: Quick Links, Live Time, Profile, Sign Out */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick jump to Staff Operations */}
            <Link
              href="/staff"
              className="hidden md:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm border border-border bg-background text-xs font-medium text-foreground hover:bg-muted transition-colors"
              title="Go to Kitchen & Staff Orders Queue"
            >
              <LayoutDashboard className="size-3.5 text-caramel" />
              <span>Staff Queue</span>
            </Link>

            {/* Quick jump to Storefront */}
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm border border-border bg-background text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Open customer storefront in a new tab"
            >
              <UtensilsCrossed className="size-3.5" />
              <span>Storefront</span>
              <ArrowUpRight className="size-3 text-muted-foreground" />
            </Link>

            {/* Live IST clock */}
            {currentIstTime && (
              <div className="hidden sm:flex items-center gap-1.5 rounded-sm border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground font-mono">
                <Clock className="size-3.5 text-amber-700 dark:text-amber-400" />
                <span>{currentIstTime}</span>
              </div>
            )}

            {/* Admin identity badge */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-sm border border-amber-300 bg-amber-50/60 px-2.5 py-1 text-xs dark:border-amber-800 dark:bg-amber-950/40">
              <ShieldAlert className="size-3.5 text-amber-800 dark:text-amber-400" />
              <span className="font-medium text-amber-950 dark:text-amber-200 max-w-[120px] truncate">
                {email || "Administrator"}
              </span>
            </div>

            {/* Refresh Action */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh admin data"
              aria-label="Refresh admin data"
              className="flex size-9 items-center justify-center rounded-sm border border-border bg-background text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel disabled:opacity-50"
            >
              <RotateCcw
                className={`size-4 text-foreground ${
                  isRefreshing ? "animate-spin text-caramel" : ""
                }`}
              />
            </button>

            {/* Sign Out Action */}
            <form action={staffSignOutAction}>
              <button
                type="submit"
                title="Sign out of Admin Portal"
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
