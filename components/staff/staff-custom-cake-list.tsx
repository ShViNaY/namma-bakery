"use client";

import * as React from "react";
import {
  Search,
  Calendar,
  Sparkles,
  Phone,
  Image as ImageIcon,
  ChevronRight,
  Filter,
  AlertCircle,
} from "lucide-react";
import type { CustomCakeRequest, CustomCakeStatus } from "@/lib/custom-cake/types";
import { formatIstDate } from "@/lib/utils/date";

export type CustomCakeFilterTab =
  | "ALL"
  | "PENDING"
  | "UNDER_REVIEW"
  | "CONFIRMED"
  | "DECLINED";

interface StaffCustomCakeListProps {
  requests: CustomCakeRequest[];
  selectedRequestId: string | null;
  activeFilter: CustomCakeFilterTab;
  onSelectRequest: (request: CustomCakeRequest) => void;
  onSelectFilter: (filter: CustomCakeFilterTab) => void;
}

export function StaffCustomCakeList({
  requests,
  selectedRequestId,
  activeFilter,
  onSelectRequest,
  onSelectFilter,
}: StaffCustomCakeListProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredRequests = React.useMemo(() => {
    return requests.filter((req) => {
      // 1. Status Filter
      if (activeFilter === "PENDING" && req.status !== "SUBMITTED") {
        return false;
      }
      if (
        activeFilter === "UNDER_REVIEW" &&
        !["UNDER_REVIEW", "NEEDS_CLARIFICATION"].includes(req.status)
      ) {
        return false;
      }
      if (
        activeFilter === "CONFIRMED" &&
        !["CUSTOMER_ACCEPTED", "QUOTED"].includes(req.status)
      ) {
        return false;
      }
      if (
        activeFilter === "DECLINED" &&
        !["DECLINED", "CUSTOMER_DECLINED", "WITHDRAWN", "EXPIRED"].includes(
          req.status
        )
      ) {
        return false;
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNumber = req.request_number.toLowerCase().includes(q);
        const matchesName = req.customer_name.toLowerCase().includes(q);
        const matchesPhone = req.customer_phone.includes(q);
        return matchesNumber || matchesName || matchesPhone;
      }

      return true;
    });
  }, [requests, activeFilter, searchQuery]);

  const getStatusBadge = (status: CustomCakeStatus) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300";
      case "UNDER_REVIEW":
        return "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-300";
      case "NEEDS_CLARIFICATION":
        return "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950 dark:text-purple-300";
      case "QUOTED":
      case "CUSTOMER_ACCEPTED":
        return "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300";
      case "DECLINED":
      case "CUSTOMER_DECLINED":
      case "WITHDRAWN":
      case "EXPIRED":
        return "bg-destructive/15 text-destructive border-destructive/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const tabs: Array<{ id: CustomCakeFilterTab; label: string }> = [
    { id: "ALL", label: "All Enquiries" },
    { id: "PENDING", label: "Pending Review" },
    { id: "UNDER_REVIEW", label: "In Review / Contacted" },
    { id: "CONFIRMED", label: "Confirmed" },
    { id: "DECLINED", label: "Declined / Closed" },
  ];

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search request #, customer name, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-h-[42px] rounded-sm border border-border bg-card pl-10 pr-3.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 font-medium self-end sm:self-center">
          <Filter className="size-3.5 text-caramel" />
          <span>
            Showing <strong className="text-foreground">{filteredRequests.length}</strong> enquiries
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {tabs.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectFilter(tab.id)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors ${
                isActive
                  ? "bg-caramel text-white"
                  : "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-surface"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Enquiries List */}
      {filteredRequests.length === 0 ? (
        <div className="rounded-sm border border-border bg-card p-8 text-center space-y-2">
          <AlertCircle className="size-8 text-muted-foreground/60 mx-auto" />
          <h3 className="font-heading text-base font-semibold text-foreground">
            No custom cake enquiries found
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery
              ? `No requests matching "${searchQuery}".`
              : `There are currently no custom cake requests in the "${activeFilter.toLowerCase()}" queue.`}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredRequests.map((req) => {
            const isSelected = selectedRequestId === req.id;
            const hasPhoto = Boolean(req.custom_cake_images && req.custom_cake_images.length > 0);

            return (
              <div
                key={req.id}
                onClick={() => onSelectRequest(req)}
                className={`group cursor-pointer rounded-sm border p-4 transition-all ${
                  isSelected
                    ? "border-caramel bg-caramel/5 ring-1 ring-caramel"
                    : "border-border bg-card hover:border-caramel/50 hover:bg-surface"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-bold text-foreground">
                        {req.request_number}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                          req.status
                        )}`}
                      >
                        {req.status.replace(/_/g, " ")}
                      </span>
                      {hasPhoto && (
                        <span className="rounded bg-caramel/10 text-caramel text-[10px] font-semibold px-1.5 py-0.5 inline-flex items-center gap-1">
                          <ImageIcon className="size-2.5" />
                          <span>Photo Attached</span>
                        </span>
                      )}
                      {req.message_on_cake && (
                        <span className="rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-semibold px-1.5 py-0.5 inline-flex items-center gap-0.5 dark:bg-amber-950 dark:text-amber-300">
                          <Sparkles className="size-2.5" />
                          <span>Message</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="font-semibold text-foreground">
                        {req.customer_name}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono">
                        <Phone className="size-3" />
                        {req.customer_phone}
                      </span>
                      <span className="text-foreground font-medium">
                        · {req.cake_type || "Celebration"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                    <div className="text-left sm:text-right text-xs">
                      <div className="flex items-center gap-1 text-foreground font-medium sm:justify-end">
                        <Calendar className="size-3.5 text-caramel" />
                        <span>Pickup: {formatIstDate(req.preferred_pickup_at)}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground block mt-0.5">
                        {req.weight_grams >= 1000
                          ? `${req.weight_grams / 1000} kg`
                          : `${req.weight_grams}g`}{" "}
                        · {req.egg_type === "EGGLESS" ? "Eggless" : "Regular"}
                      </span>
                    </div>

                    <ChevronRight className="size-4 text-muted-foreground group-hover:text-caramel transition-colors" />
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-border/40 text-xs text-muted-foreground flex items-center justify-between">
                  <span className="truncate pr-2">
                    <strong className="text-foreground">{req.flavour}</strong>
                    {req.description ? ` — ${req.description}` : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
