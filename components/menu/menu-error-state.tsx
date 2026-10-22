import Link from "next/link";
import { AlertCircle, Clock, MapPin } from "lucide-react";

interface MenuErrorStateProps {
  message?: string;
}

export function MenuErrorState({
  message = "We are currently having trouble reaching our bakery menu system.",
}: MenuErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-sm border border-border bg-card p-8 text-center sm:p-12">
      <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-destructive/10 text-destructive">
        <AlertCircle className="h-6 w-6 stroke-[1.5]" />
      </div>
      <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">
        Menu Unavailable
      </h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {message} Please refresh the page, or visit us directly at our bakery in
        Rajarajeshwari Nagar.
      </p>

      {/* Direct store info */}
      <div className="mt-6 flex flex-col items-center gap-2 rounded-sm border border-border bg-secondary/40 px-5 py-3 text-xs text-muted-foreground sm:flex-row sm:gap-6">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-caramel" />
          <span>BEML Layout 3rd Stage, RR Nagar</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-caramel" />
          <span>Open Daily 10:00 AM – 9:30 PM</span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-12 items-center justify-center rounded-sm border border-border bg-card px-5 text-sm font-medium text-foreground transition-colors hover:bg-secondary hover:text-caramel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
        >
          Return Home
        </Link>
        <Link
          href="/menu"
          className="inline-flex h-12 items-center justify-center rounded-sm bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-caramel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
        >
          Try Again
        </Link>
      </div>
    </div>
  );
}
