import type { Metadata } from "next";
import { getCustomCakeDashboardAction } from "@/lib/custom-cake/tracking-actions";
import { CustomCakeTrackingDashboard } from "@/components/custom-cake/custom-cake-tracking-dashboard";

export const instant = false;

export const metadata: Metadata = {
  title: "Track My Custom Cakes | Namma Bakery",
  description:
    "Check real-time status, baker review notes, and specifications for all your custom celebration cake enquiries in one place.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CustomCakeTrackPage() {
  const sessionResult = await getCustomCakeDashboardAction();

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-3xl px-4 py-5 sm:py-7">
        <CustomCakeTrackingDashboard
          initialAuthenticated={sessionResult.authenticated}
          initialEnquiries={sessionResult.enquiries || []}
          initialVerifiedPhone={sessionResult.verifiedPhone}
        />
      </div>
    </div>
  );
}
