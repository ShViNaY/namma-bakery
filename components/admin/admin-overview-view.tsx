"use client";

import * as React from "react";
import Link from "next/link";
import {
  Package,
  FolderTree,
  ShoppingBag,
  Sparkles,
  Store,
  Users,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  History,
} from "lucide-react";
import type { AdminOverviewSummary, AuditLogEntry } from "@/lib/admin/types";
import { formatIstDateTime } from "@/lib/utils/date";

interface AdminOverviewViewProps {
  summary: AdminOverviewSummary;
  auditLogs: AuditLogEntry[];
  onNavigateTab: (tab: string) => void;
}

export function AdminOverviewView({
  summary,
  auditLogs,
  onNavigateTab,
}: AdminOverviewViewProps) {
  return (
    <div className="space-y-6">
      {/* Store Pause Alert Banner (if store is paused) */}
      {summary.isStorePaused && (
        <div className="rounded-sm border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="size-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-semibold text-xs sm:text-sm">
                  Online Ordering is Currently Paused
                </p>
                <p className="text-xs text-amber-900/80 dark:text-amber-300/80 mt-0.5">
                  {summary.pauseMessage || "Store orders are temporarily halted."}
                  {summary.ordersPausedUntil && (
                    <span className="ml-1 font-mono text-[11px]">
                      (until {formatIstDateTime(summary.ordersPausedUntil)})
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("STORE_OPS")}
              className="h-8 px-3 rounded-sm bg-amber-700 text-white text-xs font-semibold hover:bg-amber-800 transition-colors shrink-0"
            >
              Manage Store Settings
            </button>
          </div>
        </div>
      )}

      {/* 6 Key KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* Products */}
        <div
          onClick={() => onNavigateTab("PRODUCTS")}
          className="rounded-sm border border-border bg-card p-4 flex flex-col justify-between cursor-pointer hover:border-caramel/50 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Products</span>
            <div className="size-7 rounded-sm bg-caramel/10 text-caramel flex items-center justify-center">
              <Package className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold font-heading text-foreground">
              {summary.totalProducts}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center justify-between">
              <span>{summary.availableProducts} active</span>
              {summary.archivedProducts > 0 && (
                <span className="text-amber-700 dark:text-amber-400">
                  {summary.archivedProducts} archived
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Categories */}
        <div
          onClick={() => onNavigateTab("CATEGORIES")}
          className="rounded-sm border border-border bg-card p-4 flex flex-col justify-between cursor-pointer hover:border-caramel/50 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Categories</span>
            <div className="size-7 rounded-sm bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <FolderTree className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold font-heading text-foreground">
              {summary.totalCategories}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {summary.visibleCategories} visible on menu
            </div>
          </div>
        </div>

        {/* Active Orders Queue */}
        <Link
          href="/staff"
          className="rounded-sm border border-border bg-card p-4 flex flex-col justify-between hover:border-caramel/50 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Orders In Queue</span>
            <div className="size-7 rounded-sm bg-blue-500/10 text-blue-700 dark:text-blue-400 flex items-center justify-center">
              <ShoppingBag className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold font-heading text-foreground">
              {summary.pendingOrders}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 group-hover:text-caramel">
              <span>Open in kitchen</span>
              <ArrowRight className="size-3" />
            </div>
          </div>
        </Link>

        {/* Custom Cake Enquiries */}
        <Link
          href="/staff"
          className="rounded-sm border border-border bg-card p-4 flex flex-col justify-between hover:border-caramel/50 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Cake Enquiries</span>
            <div className="size-7 rounded-sm bg-purple-500/10 text-purple-700 dark:text-purple-400 flex items-center justify-center">
              <Sparkles className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold font-heading text-foreground">
              {summary.pendingCustomCakes}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 group-hover:text-caramel">
              <span>Review in queue</span>
              <ArrowRight className="size-3" />
            </div>
          </div>
        </Link>

        {/* Store Status */}
        <div
          onClick={() => onNavigateTab("STORE_OPS")}
          className="rounded-sm border border-border bg-card p-4 flex flex-col justify-between cursor-pointer hover:border-caramel/50 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Store Status</span>
            <div className="size-7 rounded-sm bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Store className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-sm sm:text-base font-bold font-heading flex items-center gap-1.5 text-foreground">
              <span
                className={`size-2.5 rounded-full ${
                  summary.isStorePaused ? "bg-amber-500" : "bg-emerald-500"
                }`}
              />
              <span>{summary.isStorePaused ? "Paused" : "Open & Active"}</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {summary.maxOrdersPerSlot} orders / {summary.slotMinutes}m slot
            </div>
          </div>
        </div>

        {/* Staff Team */}
        <div
          onClick={() => onNavigateTab("STAFF")}
          className="rounded-sm border border-border bg-card p-4 flex flex-col justify-between cursor-pointer hover:border-caramel/50 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Staff Team</span>
            <div className="size-7 rounded-sm bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Users className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold font-heading text-foreground">
              {summary.activeStaff}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {summary.adminCount} active admins
            </div>
          </div>
        </div>
      </div>

      {/* Quick Admin Actions & Direct Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Shortcut: Add New Product */}
        <div className="rounded-sm border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Package className="size-4 text-caramel" />
            <h3 className="font-heading font-bold text-sm text-foreground">
              Menu & Products
            </h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Manage baked goods, prices, availability, dietary tags, and cake pricing tiers.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => onNavigateTab("PRODUCTS")}
              className="h-8 px-3 rounded-sm bg-caramel text-white text-xs font-semibold hover:bg-caramel/90 transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="size-3.5" />
              <span>Catalog Manager</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab("CAKE_TIERS")}
              className="h-8 px-3 rounded-sm border border-border bg-background text-xs font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Cake Tiers
            </button>
          </div>
        </div>

        {/* Shortcut: Store Operations */}
        <div className="rounded-sm border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Store className="size-4 text-emerald-700 dark:text-emerald-400" />
            <h3 className="font-heading font-bold text-sm text-foreground">
              Store & Closures
            </h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Configure order capacities, time slots, emergency pause, and scheduled holiday closures.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => onNavigateTab("STORE_OPS")}
              className="h-8 px-3 rounded-sm border border-border bg-background text-xs font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Configure Store Operations
            </button>
          </div>
        </div>

        {/* Shortcut: Staff Team */}
        <div className="rounded-sm border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-amber-700 dark:text-amber-400" />
            <h3 className="font-heading font-bold text-sm text-foreground">
              Staff Authorization
            </h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Review bakery personnel, manage employee roles, and control access to bakery portals.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => onNavigateTab("STAFF")}
              className="h-8 px-3 rounded-sm border border-border bg-background text-xs font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Manage Staff Team
            </button>
          </div>
        </div>
      </div>

      {/* Recent Administrative Audit Trail */}
      <div className="rounded-sm border border-border bg-card p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="size-4 text-caramel" />
            <h3 className="font-heading font-bold text-sm sm:text-base text-foreground">
              Administrative Audit Log
            </h3>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Automated database trigger log (audit_logs)
          </span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">
            No audit log entries recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="py-2 px-3 font-semibold">Timestamp (IST)</th>
                  <th className="py-2 px-3 font-semibold">Actor Role</th>
                  <th className="py-2 px-3 font-semibold">Entity</th>
                  <th className="py-2 px-3 font-semibold">Action</th>
                  <th className="py-2 px-3 font-semibold">Entity ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {auditLogs.slice(0, 10).map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20">
                    <td className="py-2 px-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                      {formatIstDateTime(log.created_at)}
                    </td>
                    <td className="py-2 px-3 font-semibold text-foreground">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-muted uppercase">
                        {log.actor_role}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-medium text-foreground">
                      {log.entity_type}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-muted-foreground">
                      {log.action}
                    </td>
                    <td className="py-2 px-3 font-mono text-[10px] text-muted-foreground truncate max-w-[140px]">
                      {log.entity_id || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
