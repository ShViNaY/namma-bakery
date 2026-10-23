import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin/auth";
import { AdminForbidden } from "@/components/admin/admin-forbidden";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import {
  getAdminOverviewSummary,
  getAdminCategories,
  getAdminProducts,
  getAdminPriceTiers,
  getAdminStoreSettings,
  getAdminStaffMembers,
  getAdminAuditLogs,
} from "@/lib/admin/queries";

export const instant = false;

export const metadata: Metadata = {
  title: "Admin Portal",
  description:
    "Store operations, catalog management, and administrative controls for Namma Bakery.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  const { authorized, session } = await requireAdminSession();

  // If user is authenticated with EMPLOYEE privileges or lacking active admin status
  if (!authorized) {
    return (
      <AdminForbidden
        userEmail={session.user?.email}
        role={session.role}
      />
    );
  }

  // Fetch admin domain data under active admin privileges
  const [
    overviewRes,
    categoriesRes,
    productsRes,
    tiersRes,
    storeOpsRes,
    staffRes,
    auditRes,
  ] = await Promise.all([
    getAdminOverviewSummary(),
    getAdminCategories(),
    getAdminProducts(),
    getAdminPriceTiers(),
    getAdminStoreSettings(),
    getAdminStaffMembers(),
    getAdminAuditLogs(25),
  ]);

  if (categoriesRes.error && productsRes.error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-background">
        <div className="max-w-md w-full rounded-sm border border-destructive/40 bg-card p-6 text-center space-y-3">
          <p className="font-semibold text-destructive text-sm">
            Failed to load admin portal data
          </p>
          <p className="text-xs text-muted-foreground">
            {categoriesRes.error || "An error occurred while connecting to Supabase."}
          </p>
          <Link
            href="/admin"
            className="inline-block mt-2 h-9 px-4 rounded-sm bg-caramel text-white text-xs font-semibold leading-9"
          >
            Retry
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AdminDashboard
      summary={overviewRes.summary}
      categories={categoriesRes.categories}
      products={productsRes.products}
      priceTiers={tiersRes.tiers}
      location={storeOpsRes.location}
      settings={storeOpsRes.settings}
      closures={storeOpsRes.closures}
      hours={storeOpsRes.hours}
      staff={staffRes.staff}
      auditLogs={auditRes.logs}
      currentUserEmail={session.user?.email}
      currentUserId={session.user?.id}
    />
  );
}
