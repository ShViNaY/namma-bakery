import Link from "next/link";
import { Coffee } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-20 sm:px-6">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-secondary text-caramel">
          <Coffee className="h-7 w-7 stroke-[1.5]" />
        </div>

        <span className="mt-4 font-kannada text-xs font-medium text-caramel">
          ಪುಟ ಕಂಡುಬಂದಿಲ್ಲ
        </span>
        <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Page Not Found
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The bakery category or page you are looking for doesn&apos;t exist or may have
          moved.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/menu"
            className="inline-flex h-12 items-center justify-center rounded-sm bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-caramel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
          >
            Explore Bakery Menu
          </Link>
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-sm border border-border bg-card px-5 text-sm font-medium text-foreground transition-colors hover:bg-secondary hover:text-caramel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
