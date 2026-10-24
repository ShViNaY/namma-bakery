"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HeaderCartButton } from "./header-cart-button";
import { cn } from "@/lib/utils";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        isScrolled
          ? "border-b border-border bg-background/95 backdrop-blur-md shadow-2xs"
          : "border-b border-border/40 bg-background/80 backdrop-blur-xs"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-3 sm:px-6">
        {/* Brand identity */}
        <Link
          href="/"
          className="group flex flex-col justify-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
        >
          <span className="font-kannada text-xs font-medium tracking-wide text-caramel leading-none mb-0.5">
            ನಮ್ಮ ಬೇಕರಿ
          </span>
          <span className="font-heading text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-caramel sm:text-xl">
            Namma Bakery
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-0.5 sm:gap-1.5" aria-label="Main Navigation">
          <Link
            href="/menu"
            className="flex min-h-[48px] items-center rounded-md px-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary hover:text-caramel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel sm:px-3"
          >
            Menu
          </Link>
          <Link
            href="/custom-cake"
            className="flex min-h-[48px] items-center rounded-md px-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary hover:text-caramel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel sm:px-3"
          >
            <span className="hidden min-[430px]:inline">Custom Cakes</span>
            <span className="min-[430px]:hidden">Custom</span>
          </Link>
          <Link
            href="/orders"
            aria-label="Track your order"
            className="flex min-h-[48px] items-center rounded-md px-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary hover:text-caramel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel sm:px-3"
          >
            <span className="sm:hidden">Track</span>
            <span className="hidden sm:inline">Track Order</span>
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
