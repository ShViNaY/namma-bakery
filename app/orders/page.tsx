import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 sm:py-16 space-y-6">
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

        <OrderLookupForm />
      </div>
    </div>
  );
}
