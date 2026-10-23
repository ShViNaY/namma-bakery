"use client";

import * as React from "react";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  ChefHat,
  ShoppingBag,
  CheckCheck,
  XCircle,
} from "lucide-react";
import type { OperationalSummary, OrderFilter } from "@/lib/staff/types";

interface StaffOverviewProps {
  summary: OperationalSummary;
  activeFilter: OrderFilter;
  onSelectFilter: (filter: OrderFilter) => void;
}

export function StaffOverview({
  summary,
  activeFilter,
  onSelectFilter,
}: StaffOverviewProps) {
  const cards = [
    {
      id: "TODAY" as OrderFilter,
      label: "Today's Orders",
      count: summary.totalToday,
      icon: CalendarDays,
      color: "text-foreground",
      activeBg: "border-cocoa bg-cocoa/5",
    },
    {
      id: "PENDING" as OrderFilter,
      label: "Pending Orders",
      count: summary.pending,
      icon: Clock,
      color: summary.pending > 0 ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground",
      highlight: summary.pending > 0,
      activeBg: "border-amber-600 bg-amber-500/10",
    },
    {
      id: "ACCEPTED" as OrderFilter,
      label: "Accepted",
      count: summary.accepted,
      icon: CheckCircle2,
      color: "text-blue-700 dark:text-blue-400",
      activeBg: "border-blue-600 bg-blue-500/10",
    },
    {
      id: "PREPARING" as OrderFilter,
      label: "Preparing",
      count: summary.preparing,
      icon: ChefHat,
      color: "text-orange-700 dark:text-orange-400",
      activeBg: "border-orange-600 bg-orange-500/10",
    },
    {
      id: "READY_FOR_PICKUP" as OrderFilter,
      label: "Ready for Pickup",
      count: summary.readyForPickup,
      icon: ShoppingBag,
      color: summary.readyForPickup > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground",
      highlight: summary.readyForPickup > 0,
      activeBg: "border-emerald-600 bg-emerald-500/10",
    },
    {
      id: "COMPLETED" as OrderFilter,
      label: "Completed",
      count: summary.completed,
      icon: CheckCheck,
      color: "text-muted-foreground",
      activeBg: "border-border bg-muted",
    },
    {
      id: "CANCELLED_OR_REJECTED" as OrderFilter,
      label: "Cancelled / Rejected",
      count: summary.cancelledOrRejected,
      icon: XCircle,
      color: "text-destructive",
      activeBg: "border-destructive bg-destructive/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectFilter(isActive ? "ALL" : card.id)}
            className={`flex flex-col justify-between p-3 sm:p-3.5 rounded-sm border text-left transition-all ${
              isActive
                ? card.activeBg
                : "border-border bg-card hover:border-caramel/40 hover:bg-surface"
            } ${card.highlight && !isActive ? "border-amber-300 bg-amber-50/50" : ""}`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground line-clamp-1">
                {card.label}
              </span>
              <Icon className={`size-3.5 shrink-0 ${card.color}`} />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`font-heading text-2xl font-bold ${card.color}`}>
                {card.count}
              </span>
              {isActive && (
                <span className="text-[10px] font-medium text-caramel uppercase">
                  (Active)
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
