"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { StaffHeader } from "./staff-header";
import { StaffOverview } from "./staff-overview";
import { StaffOrderList } from "./staff-order-list";
import { StaffOrderDetail } from "./staff-order-detail";
import { StaffStatusModal, type ModalType } from "./staff-status-modal";
import type {
  StaffOrder,
  StaffRole,
  OperationalSummary,
  OrderFilter,
} from "@/lib/staff/types";
import { Coffee } from "lucide-react";

interface StaffDashboardProps {
  orders: StaffOrder[];
  summary: OperationalSummary;
  userEmail?: string | null;
  role: StaffRole | null;
}

export function StaffDashboard({
  orders,
  summary,
  userEmail,
  role,
}: StaffDashboardProps) {
  const router = useRouter();

  const [activeFilter, setActiveFilter] = React.useState<OrderFilter>("TODAY");
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(
    orders[0]?.id || null
  );
  const [activeModal, setActiveModal] = React.useState<ModalType | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Sync selected order object
  const selectedOrder = React.useMemo(() => {
    return orders.find((o) => o.id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleStatusChangeSuccess = () => {
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
        {/* Today's Operational Overview */}
        <section aria-label="Operational Overview">
          <StaffOverview
            summary={summary}
            activeFilter={activeFilter}
            onSelectFilter={setActiveFilter}
          />
        </section>

        {/* Workspace: Order Queue & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Order Queue Column */}
          <section
            aria-label="Order Queue"
            className={`${
              selectedOrder ? "hidden lg:block lg:col-span-7 xl:col-span-8" : "col-span-12"
            }`}
          >
            <StaffOrderList
              orders={orders}
              selectedOrderId={selectedOrderId}
              activeFilter={activeFilter}
              onSelectOrder={(order) => setSelectedOrderId(order.id)}
              onSelectFilter={setActiveFilter}
            />
          </section>

          {/* Order Details Column / Responsive Mobile View */}
          {selectedOrder ? (
            <aside
              aria-label="Order Details"
              className="col-span-12 lg:col-span-5 xl:col-span-4 sticky top-20 rounded-sm border border-border bg-card overflow-hidden shadow-xs max-h-[calc(100vh-6rem)]"
            >
              <StaffOrderDetail
                order={selectedOrder}
                role={role}
                onClose={() => setSelectedOrderId(null)}
                onOpenModal={(modal) => setActiveModal(modal)}
              />
            </aside>
          ) : (
            <div className="hidden lg:flex col-span-5 xl:col-span-4 rounded-sm border border-dashed border-border p-12 flex-col items-center justify-center text-center text-muted-foreground space-y-3 min-h-[300px]">
              <Coffee className="size-8 text-muted-foreground/60" />
              <p className="text-sm font-medium">Select an order to view full details</p>
              <p className="text-xs">
                Inspect customer notes, cake message, items, and trigger status updates.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Action / Transition Modal */}
      <StaffStatusModal
        modal={activeModal}
        onClose={() => setActiveModal(null)}
        onSuccess={handleStatusChangeSuccess}
      />
    </div>
  );
}
