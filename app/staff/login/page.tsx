import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff/auth";
import { StaffLoginForm } from "@/components/staff/staff-login-form";

export const instant = false;

export const metadata: Metadata = {
  title: "Staff Login | Namma Bakery",
  description: "Internal staff sign in for Namma Bakery kitchen and operations.",
};

export default async function StaffLoginPage() {
  const session = await getStaffSession();

  // If already authenticated with staff privileges, go directly to the dashboard
  if (session.isStaff) {
    redirect("/staff");
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <StaffLoginForm />
    </div>
  );
}
