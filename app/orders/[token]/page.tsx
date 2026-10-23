import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, ShoppingBag } from "lucide-react";
import { getOrderByToken } from "@/lib/orders/queries";
import { OrderTrackingView } from "@/components/orders/order-tracking-view";

export const instant = false;

interface OrderPageProps {
  params: Promise<{
    token: string;
  }>;
  searchParams: Promise<{
    confirmed?: string;
  }>;
}

export async function generateMetadata({
  params,
}: OrderPageProps): Promise<Metadata> {
  const { token } = await params;
  const order = await getOrderByToken(token);

  if (!order) {
    return {
      title: "Order Not Found",
      description: "Unable to find the requested bakery order.",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `Order ${order.order_number} Tracking`,
    description: `Track live order and pickup status for order ${order.order_number} at Namma Bakery, Rajarajeshwari Nagar.`,
    robots: { index: false, follow: false },
  };
}

export default async function OrderDetailsPage({
  params,
  searchParams,
}: OrderPageProps) {
  const { token } = await params;
  const { confirmed } = await searchParams;

  const order = await getOrderByToken(token);

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 text-center">
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-destructive/10 text-destructive mb-6">
          <AlertCircle className="h-8 w-8" aria-hidden="true" />
        </div>

        <span className="font-kannada text-xs font-semibold text-caramel block mb-1">
          ಆರ್ಡರ್ ಸಿಗಲಿಲ್ಲ
        </span>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Order Not Found
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          We could not locate an order matching this tracking link. The link may have expired or may be invalid.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/orders"
            className="inline-flex h-11 items-center justify-center rounded-sm bg-caramel px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-caramel/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel w-full sm:w-auto"
          >
            Look Up Order by Number
          </Link>
          <Link
            href="/menu"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-border bg-card px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-caramel w-full sm:w-auto"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Explore Menu</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <OrderTrackingView
        order={order}
        isFreshConfirmation={confirmed === "true"}
      />
    </div>
  );
}
