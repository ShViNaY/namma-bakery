import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles, ArrowRight } from "lucide-react";
import { OrderLookupForm } from "@/components/orders/order-lookup-form";

export const metadata: Metadata = {
  title: "Track Order",
  description:
    "Check live preparation and pickup status for your bakery order in RR Nagar, Bengaluru.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrdersIndexPage() {
  return (
    <div className="bg-background">
      <div className="mx-auto max-w-xl px-4 py-8 sm:py-10 space-y-6">
        <nav aria-label="Breadcrumb">
          <Link
            href="/"
            className="inline-flex min-touch-target items-center gap-1.5 text-xs text-muted-foreground hover:text-caramel focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-caramel transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Home</span>
          </Link>
        </nav>

        <div>
          <span className="font-kannada text-xs font-semibold text-caramel block mb-1">
            ನಿಮ್ಮ ಆರ್ಡರ್ ಸ್ಥಿತಿ ತಿಳಿಯಿರಿ
          </span>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Order Status &amp; Tracking
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Follow your order from baking to packaging and pickup at our RR Nagar counter.
          </p>
        </div>

        {/* Regular Bakery Order Tracking Card */}
        <OrderLookupForm />

        {/* Dedicated Prominent Custom Cake Tracking Section */}
        <div className="rounded-sm border border-border bg-card p-6 sm:p-7 space-y-4 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="size-10 rounded-sm bg-caramel/15 text-caramel flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="size-5" />
            </div>
            <div className="space-y-1">
              <h2 className="font-heading text-lg font-bold text-foreground">
                Have a Custom Cake Enquiry?
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Track your custom cake enquiries and see their latest status in one place.
              </p>
            </div>
          </div>

          <div className="pt-1">
            <Link
              href="/custom-cake/track"
              className="inline-flex min-h-[48px] h-12 w-full sm:w-auto px-6 items-center justify-center gap-2 rounded-sm bg-caramel text-sm font-semibold text-white shadow-xs transition-colors hover:bg-caramel/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
            >
              <span>Track Custom Cakes</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
