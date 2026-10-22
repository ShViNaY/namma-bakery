import Link from "next/link";
import { Coffee } from "lucide-react";

interface MenuEmptyStateProps {
  title?: string;
  message?: string;
  showAllLink?: boolean;
}

export function MenuEmptyState({
  title = "No items available right now",
  message = "Our bakers are preparing today's fresh batch. Please check back shortly or explore other categories.",
  showAllLink = true,
}: MenuEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border bg-card/60 p-8 text-center sm:p-12">
      <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-secondary text-caramel">
        <Coffee className="h-6 w-6 stroke-[1.5]" />
      </div>
      <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">
        {title}
      </h3>
      <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
        {message}
      </p>
      {showAllLink && (
        <div className="mt-6">
          <Link
            href="/menu"
            className="inline-flex h-12 items-center justify-center rounded-sm border border-border bg-card px-5 text-sm font-medium text-foreground transition-colors hover:bg-secondary hover:text-caramel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
          >
            View All Menu Categories
          </Link>
        </div>
      )}
    </div>
  );
}
