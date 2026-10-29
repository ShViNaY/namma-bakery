"use client";

import * as React from "react";
import {
  Search,
  Clock,
  Sparkles,
  Phone,
  AlertCircle,
  ChevronRight,
  Filter,
} from "lucide-react";
import type { StaffOrder, OrderFilter } from "@/lib/staff/types";
import { formatPaise } from "@/lib/utils/money";
import { formatIstDate, formatIstTime, getIstDateString } from "@/lib/utils/date";
import { formatOrderItemVariant } from "@/lib/staff/formatters";

interface StaffOrderListProps {
  orders: StaffOrder[];
  selectedOrderId: string | null;
  activeFilter: OrderFilter;
  onSelectOrder: (order: StaffOrder) => void;
  onSelectFilter: (filter: OrderFilter) => void;
}

export function StaffOrderList({
  orders,
  selectedOrderId,
  activeFilter,
  onSelectOrder,
  onSelectFilter,
}: StaffOrderListProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const todayIst = getIstDateString();

  // Filter orders based on active filter tab and search query
  const filteredOrders = React.useMemo(() => {
    return orders.filter((order) => {
      // 1. Status Filter
      if (activeFilter === "TODAY") {
        const isToday =
          getIstDateString(order.requested_pickup_at) === todayIst ||
          getIstDateString(order.created_at) === todayIst;
        if (!isToday) return false;
      } else if (activeFilter === "PENDING" && order.status !== "PENDING") {
        return false;
      } else if (activeFilter === "ACCEPTED" && order.status !== "ACCEPTED") {
        return false;
      } else if (activeFilter === "PREPARING" && order.status !== "PREPARING") {
        return false;
      } else if (
        activeFilter === "READY_FOR_PICKUP" &&
        order.status !== "READY_FOR_PICKUP"
      ) {
        return false;
      } else if (activeFilter === "COMPLETED" && order.status !== "COMPLETED") {
        return false;
      } else if (
        activeFilter === "CANCELLED_OR_REJECTED" &&
        !["CANCELLED", "REJECTED", "NO_SHOW"].includes(order.status)
      ) {
        return false;
      }

      // 2. Search Query (order_number, customer_name, customer_phone)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesOrder = order.order_number.toLowerCase().includes(q);
        const matchesName = order.customer_name.toLowerCase().includes(q);
        const matchesPhone = order.customer_phone.includes(q);
        return matchesOrder || matchesName || matchesPhone;
      }

      return true;
    });
  }, [orders, activeFilter, searchQuery, todayIst]);

  const getStatusBadge = (status: StaffOrder["status"]) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300";
      case "ACCEPTED":
        return "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-300";
      case "PREPARING":
        return "bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950 dark:text-orange-300";
      case "READY_FOR_PICKUP":
        return "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300";
      case "COMPLETED":
        return "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-900 dark:text-slate-300";
      case "REJECTED":
      case "CANCELLED":
      case "NO_SHOW":
        return "bg-destructive/15 text-destructive border-destructive/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filterTabs: Array<{ id: OrderFilter; label: string }> = [
    { id: "ALL", label: "All Orders" },
    { id: "TODAY", label: "Today" },
    { id: "PENDING", label: "Pending" },
    { id: "ACCEPTED", label: "Accepted" },
    { id: "PREPARING", label: "Preparing" },
    { id: "READY_FOR_PICKUP", label: "Ready" },
    { id: "COMPLETED", label: "Completed" },
    { id: "CANCELLED_OR_REJECTED", label: "Cancelled / Rejected" },
  ];

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search order #, customer name, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-h-[42px] rounded-sm border border-border bg-card pl-10 pr-3.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
          />
        </div>

        {/* Status count indicator */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 font-medium self-end sm:self-center">
          <Filter className="size-3.5 text-caramel" />
          <span>
            Showing <strong className="text-foreground">{filteredOrders.length}</strong> orders
          </span>
        </div>
      </div>

      {/* Filter Tabs Scrollable Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {filterTabs.map((tab) => {
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

      {/* Order Cards List */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-sm border border-border bg-card p-8 text-center space-y-2">
          <AlertCircle className="size-8 text-muted-foreground/60 mx-auto" />
          <h3 className="font-heading text-base font-semibold text-foreground">
            No orders found
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery
              ? `No orders matching "${searchQuery}". Try searching with a different term.`
              : `There are no orders in the "${activeFilter.toLowerCase()}" queue right now.`}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredOrders.map((order) => {
            const isSelected = selectedOrderId === order.id;
            const isToday = getIstDateString(order.requested_pickup_at) === todayIst;
            const hasCakeMessage = order.order_items?.some(
              (item) => Boolean(item.cake_message)
            );

            return (
              <div
                key={order.id}
                onClick={() => onSelectOrder(order)}
                className={`group cursor-pointer rounded-sm border p-4 transition-all ${
                  isSelected
                    ? "border-caramel bg-caramel/5 ring-1 ring-caramel"
                    : "border-border bg-card hover:border-caramel/50 hover:bg-surface"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  {/* Left: Order #, Customer, Time */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-bold text-foreground">
                        {order.order_number}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                          order.status
                        )}`}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                      {isToday && (
                        <span className="rounded bg-caramel/10 text-caramel text-[10px] font-bold px-1.5 py-0.5 uppercase">
                          Today
                        </span>
                      )}
                      {hasCakeMessage && (
                        <span className="rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-semibold px-1.5 py-0.5 inline-flex items-center gap-0.5 dark:bg-amber-950 dark:text-amber-300">
                          <Sparkles className="size-2.5" />
                          <span>Custom Message</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="font-semibold text-foreground">
                        {order.customer_name}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono">
                        <Phone className="size-3" />
                        {order.customer_phone}
                      </span>
                    </div>
                  </div>

                  {/* Right: Pickup Slot & Total */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                    <div className="text-left sm:text-right">
                      <div className="flex items-center gap-1 text-xs text-foreground font-medium sm:justify-end">
                        <Clock className="size-3.5 text-caramel" />
                        <span>
                          {formatIstDate(order.requested_pickup_at)},{" "}
                          {formatIstTime(order.requested_pickup_at)}
                        </span>
                      </div>
                      <span className="font-heading text-sm font-bold text-foreground block mt-0.5">
                        {formatPaise(order.total_paise)}
                      </span>
                    </div>

                    <ChevronRight className="size-4 text-muted-foreground group-hover:text-caramel transition-colors" />
                  </div>
                </div>

                {/* Items Summary Line */}
                <div className="mt-2.5 pt-2 border-t border-border/40 text-xs text-muted-foreground flex items-center justify-between">
                  <span className="truncate pr-2">
                    {order.order_items?.length || 0} item(s):{" "}
                    {order.order_items
                      ?.map((i) => {
                        const variant = formatOrderItemVariant(i);
                        return `${i.quantity}x ${i.product_name}${
                          variant ? ` (${variant})` : ""
                        }`;
                      })
                      .join(", ")}
                  </span>
                  <span
                    className={`shrink-0 text-[10px] font-bold uppercase ${
                      order.payment_status === "paid"
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    {order.payment_status === "paid" ? "Paid" : "Pay at Store"}
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
