"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Layers,
  FolderTree,
  Store,
  Users,
} from "lucide-react";
import { AdminHeader } from "./admin-header";
import { AdminOverviewView } from "./admin-overview-view";
import { AdminProductsView } from "./admin-products-view";
import { AdminCakeTiersView } from "./admin-cake-tiers-view";
import { AdminCategoriesView } from "./admin-categories-view";
import { AdminStoreOperationsView } from "./admin-store-operations-view";
import { AdminStaffView } from "./admin-staff-view";
import type {
  AdminOverviewSummary,
  AdminCategory,
  AdminProduct,
  AdminPriceTierWithRules,
  LocationInfo,
  StoreSettings,
  SpecialClosure,
  BusinessHour,
  AdminStaffMember,
  AuditLogEntry,
} from "@/lib/admin/types";

export type AdminTab =
  | "OVERVIEW"
  | "PRODUCTS"
  | "CAKE_TIERS"
  | "CATEGORIES"
  | "STORE_OPS"
  | "STAFF";

interface AdminDashboardProps {
  summary: AdminOverviewSummary;
  categories: AdminCategory[];
  products: AdminProduct[];
  priceTiers: AdminPriceTierWithRules[];
  location: LocationInfo | null;
  settings: StoreSettings | null;
  closures: SpecialClosure[];
  hours: BusinessHour[];
  staff: AdminStaffMember[];
  auditLogs: AuditLogEntry[];
  currentUserEmail?: string | null;
  currentUserId?: string | null;
}

export function AdminDashboard({
  summary,
  categories,
  products,
  priceTiers,
  location,
  settings,
  closures,
  hours,
  staff,
  auditLogs,
  currentUserEmail,
  currentUserId,
}: AdminDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<AdminTab>("OVERVIEW");
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleActionSuccess = () => {
    router.refresh();
  };

  const navItems: { id: AdminTab; label: string; icon: React.ElementType }[] = [
    { id: "OVERVIEW", label: "Overview", icon: LayoutDashboard },
    { id: "PRODUCTS", label: "Products", icon: Package },
    { id: "CAKE_TIERS", label: "Cake Pricing", icon: Layers },
    { id: "CATEGORIES", label: "Categories", icon: FolderTree },
    { id: "STORE_OPS", label: "Store Operations", icon: Store },
    { id: "STAFF", label: "Staff Team", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <AdminHeader
        email={currentUserEmail}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Main Tab Navigation */}
      <div className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-16 z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`h-9 px-3 rounded-sm text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-colors ${
                    isActive
                      ? "bg-caramel text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dashboard Body Content */}
      <div className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "OVERVIEW" && (
          <AdminOverviewView
            summary={summary}
            auditLogs={auditLogs}
            onNavigateTab={(tab) => setActiveTab(tab as AdminTab)}
          />
        )}

        {activeTab === "PRODUCTS" && (
          <AdminProductsView
            products={products}
            categories={categories}
            priceTiers={priceTiers}
            onActionSuccess={handleActionSuccess}
          />
        )}

        {activeTab === "CAKE_TIERS" && (
          <AdminCakeTiersView
            tiers={priceTiers}
            onActionSuccess={handleActionSuccess}
          />
        )}

        {activeTab === "CATEGORIES" && (
          <AdminCategoriesView
            categories={categories}
            onActionSuccess={handleActionSuccess}
          />
        )}

        {activeTab === "STORE_OPS" && (
          <AdminStoreOperationsView
            location={location}
            settings={settings}
            closures={closures}
            hours={hours}
            isStorePaused={summary.isStorePaused}
            onActionSuccess={handleActionSuccess}
          />
        )}

        {activeTab === "STAFF" && (
          <AdminStaffView
            staff={staff}
            currentUserEmail={currentUserEmail}
            currentUserId={currentUserId}
            onActionSuccess={handleActionSuccess}
          />
        )}
      </div>
    </div>
  );
}
