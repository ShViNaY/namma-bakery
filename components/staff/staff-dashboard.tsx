"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { StaffHeader } from "./staff-header";
import { StaffOverview } from "./staff-overview";
import { StaffOrderList } from "./staff-order-list";
import { StaffOrderDetail } from "./staff-order-detail";
import { StaffStatusModal, type ModalType } from "./staff-status-modal";
import { StaffCustomCakeOverview } from "./staff-custom-cake-overview";
import {
  StaffCustomCakeList,
  type CustomCakeFilterTab,
} from "./staff-custom-cake-list";
import { StaffCustomCakeDetail } from "./staff-custom-cake-detail";
import {
  StaffCustomCakeModal,
  type CustomCakeModalType,
} from "./staff-custom-cake-modal";
import type {
  StaffOrder,
  StaffRole,
  OperationalSummary,
  OrderFilter,
} from "@/lib/staff/types";
import type {
  CustomCakeRequest,
  CustomCakeOperationalSummary,
} from "@/lib/custom-cake/types";
import { Coffee, ShoppingBag, Sparkles } from "lucide-react";

interface StaffDashboardProps {
  orders: StaffOrder[];
  summary: OperationalSummary;
  customCakeRequests: CustomCakeRequest[];
  customCakeSummary: CustomCakeOperationalSummary;
  userEmail?: string | null;
  role: StaffRole | null;
}

export function StaffDashboard({
  orders,
  summary,
  customCakeRequests,
  customCakeSummary,
  userEmail,
  role,
}: StaffDashboardProps) {
  const router = useRouter();

  // Navigation tab: regular orders vs custom celebration cakes
  const [activeTab, setActiveTab] = React.useState<"ORDERS" | "CUSTOM_CAKES">(
    "ORDERS"
  );

  // Orders queue state
  const [activeOrderFilter, setActiveOrderFilter] =
    React.useState<OrderFilter>("TODAY");
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(
    orders[0]?.id || null
  );
  const [activeOrderModal, setActiveOrderModal] =
    React.useState<ModalType | null>(null);

  // Custom cake queue state
  const [activeCustomCakeFilter, setActiveCustomCakeFilter] =
    React.useState<CustomCakeFilterTab>("ALL");
  const [selectedCustomCakeId, setSelectedCustomCakeId] = React.useState<
    string | null
  >(customCakeRequests[0]?.id || null);
  const [activeCustomCakeModal, setActiveCustomCakeModal] =
    React.useState<CustomCakeModalType | null>(null);

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Sync selected order objects
  const selectedOrder = React.useMemo(() => {
    return orders.find((o) => o.id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  const selectedCustomCake = React.useMemo(() => {
    return (
      customCakeRequests.find((c) => c.id === selectedCustomCakeId) || null
    );
  }, [customCakeRequests, selectedCustomCakeId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleActionSuccess = () => {
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <StaffHeader
        email={userEmail}
        role={role}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Main Dashboard Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Section Switcher Tabs: Orders vs Custom Cakes */}
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("ORDERS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === "ORDERS"
                ? "bg-cocoa text-cream"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShoppingBag className="size-4" />
            <span>Orders Queue</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === "ORDERS"
                  ? "bg-cream text-cocoa"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {orders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("CUSTOM_CAKES")}
            className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors relative ${
              activeTab === "CUSTOM_CAKES"
                ? "bg-caramel text-white"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="size-4" />
            <span>Custom Cake Requests</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === "CUSTOM_CAKES"
                  ? "bg-white text-caramel"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {customCakeRequests.length}
            </span>

            {/* Notification pip if there are pending enquiries */}
            {customCakeSummary.pending > 0 && (
              <span
                className="size-2 rounded-full bg-amber-500 absolute -top-1 -right-1 ring-2 ring-background"
                title={`${customCakeSummary.pending} pending custom cake request(s)`}
              />
            )}
          </button>
        </div>

        {/* VIEW 1: REGULAR ORDERS QUEUE */}
        {activeTab === "ORDERS" && (
          <div className="space-y-6">
            <section aria-label="Operational Overview">
              <StaffOverview
                summary={summary}
                activeFilter={activeOrderFilter}
                onSelectFilter={setActiveOrderFilter}
              />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <section
                aria-label="Order Queue"
                className={`${
                  selectedOrder
                    ? "hidden lg:block lg:col-span-7 xl:col-span-8"
                    : "col-span-12"
                }`}
              >
                <StaffOrderList
                  orders={orders}
                  selectedOrderId={selectedOrderId}
                  activeFilter={activeOrderFilter}
                  onSelectOrder={(order) => setSelectedOrderId(order.id)}
                  onSelectFilter={setActiveOrderFilter}
                />
              </section>

              {selectedOrder ? (
                <aside
                  aria-label="Order Details"
                  className="col-span-12 lg:col-span-5 xl:col-span-4 sticky top-20 rounded-sm border border-border bg-card overflow-hidden shadow-xs max-h-[calc(100vh-6rem)]"
                >
                  <StaffOrderDetail
                    order={selectedOrder}
                    role={role}
                    onClose={() => setSelectedOrderId(null)}
                    onOpenModal={(modal) => setActiveOrderModal(modal)}
                  />
                </aside>
              ) : (
                <div className="hidden lg:flex col-span-5 xl:col-span-4 rounded-sm border border-dashed border-border p-12 flex-col items-center justify-center text-center text-muted-foreground space-y-3 min-h-[300px]">
                  <Coffee className="size-8 text-muted-foreground/60" />
                  <p className="text-sm font-medium">
                    Select an order to view full details
                  </p>
                  <p className="text-xs">
                    Inspect customer notes, cake message, items, and trigger
                    status updates.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: CUSTOM CAKE ENQUIRIES */}
        {activeTab === "CUSTOM_CAKES" && (
          <div className="space-y-6">
            <section aria-label="Custom Cake Overview">
              <StaffCustomCakeOverview
                summary={customCakeSummary}
                activeFilter={activeCustomCakeFilter}
                onSelectFilter={setActiveCustomCakeFilter}
              />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <section
                aria-label="Custom Cake Queue"
                className={`${
                  selectedCustomCake
                    ? "hidden lg:block lg:col-span-7 xl:col-span-8"
                    : "col-span-12"
                }`}
              >
                <StaffCustomCakeList
                  requests={customCakeRequests}
                  selectedRequestId={selectedCustomCakeId}
                  activeFilter={activeCustomCakeFilter}
                  onSelectRequest={(req) => setSelectedCustomCakeId(req.id)}
                  onSelectFilter={setActiveCustomCakeFilter}
                />
              </section>

              {selectedCustomCake ? (
                <aside
                  aria-label="Custom Cake Details"
                  className="col-span-12 lg:col-span-5 xl:col-span-4 sticky top-20 rounded-sm border border-border bg-card overflow-hidden shadow-xs max-h-[calc(100vh-6rem)]"
                >
                  <StaffCustomCakeDetail
                    key={selectedCustomCake.id}
                    request={selectedCustomCake}
                    onClose={() => setSelectedCustomCakeId(null)}
                    onOpenModal={(modal) => setActiveCustomCakeModal(modal)}
                  />
                </aside>
              ) : (
                <div className="hidden lg:flex col-span-5 xl:col-span-4 rounded-sm border border-dashed border-border p-12 flex-col items-center justify-center text-center text-muted-foreground space-y-3 min-h-[300px]">
                  <Sparkles className="size-8 text-muted-foreground/60" />
                  <p className="text-sm font-medium">
                    Select a custom cake enquiry to inspect
                  </p>
                  <p className="text-xs">
                    Review design descriptions, reference photos, customer
                    details, and manage status.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Orders Transition Modal */}
      <StaffStatusModal
        modal={activeOrderModal}
        onClose={() => setActiveOrderModal(null)}
        onSuccess={handleActionSuccess}
      />

      {/* Custom Cake Status Modal */}
      <StaffCustomCakeModal
        modal={activeCustomCakeModal}
        onClose={() => setActiveCustomCakeModal(null)}
        onSuccess={handleActionSuccess}
      />
    </div>
  );
}
