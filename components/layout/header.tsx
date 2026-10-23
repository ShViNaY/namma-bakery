import Link from "next/link";
import { HeaderCartButton } from "./header-cart-button";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand identity */}
        <Link
          href="/"
          className="group flex flex-col justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
        >
          <span className="font-kannada text-xs font-medium tracking-wide text-caramel">
            ನಮ್ಮ ಬೇಕರಿ
          </span>
          <span className="font-heading text-xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-caramel">
            Namma Bakery
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/menu"
            className="flex h-11 items-center rounded-md px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary hover:text-caramel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
          >
            Menu
          </Link>
          <HeaderCartButton />
          <div className="hidden items-center gap-2 border-l border-border pl-3 sm:flex">
            <span className="text-xs font-medium text-muted-foreground">
              RR Nagar, Bengaluru
            </span>
          </div>
        </nav>
      </div>
    </header>
  );
}
