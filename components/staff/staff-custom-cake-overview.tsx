"use client";

import * as React from "react";
import {
  Sparkles,
  Clock,
  PhoneCall,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { CustomCakeOperationalSummary } from "@/lib/custom-cake/types";
import type { CustomCakeFilterTab } from "./staff-custom-cake-list";

interface StaffCustomCakeOverviewProps {
  summary: CustomCakeOperationalSummary;
  activeFilter: CustomCakeFilterTab;
  onSelectFilter: (filter: CustomCakeFilterTab) => void;
}

export function StaffCustomCakeOverview({
  summary,
  activeFilter,
  onSelectFilter,
}: StaffCustomCakeOverviewProps) {
  const cards = [
    {
      id: "ALL" as CustomCakeFilterTab,
      label: "Total Enquiries",
      count: summary.total,
      icon: Sparkles,
      color: "text-foreground",
      activeBg: "border-cocoa bg-cocoa/5",
    },
    {
      id: "PENDING" as CustomCakeFilterTab,
      label: "Pending Review",
      count: summary.pending,
      icon: Clock,
      color: summary.pending > 0 ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground",
      highlight: summary.pending > 0,
      activeBg: "border-amber-600 bg-amber-500/10",
    },
    {
      id: "UNDER_REVIEW" as CustomCakeFilterTab,
      label: "In Review / Contacted",
      count: summary.underReview,
      icon: PhoneCall,
      color: "text-blue-700 dark:text-blue-400",
      activeBg: "border-blue-600 bg-blue-500/10",
    },
    {
      id: "CONFIRMED" as CustomCakeFilterTab,
      label: "Confirmed",
      count: summary.confirmed,
      icon: CheckCircle2,
      color: "text-emerald-700 dark:text-emerald-400",
      activeBg: "border-emerald-600 bg-emerald-500/10",
    },
    {
      id: "DECLINED" as CustomCakeFilterTab,
      label: "Declined / Closed",
      count: summary.declinedOrCancelled,
      icon: XCircle,
      color: "text-destructive",
      activeBg: "border-destructive bg-destructive/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectFilter(card.id)}
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
