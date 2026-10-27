"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { Category } from "@/lib/menu/types";
import { cn } from "@/lib/utils";

interface CategoryNavProps {
  categories: Category[];
  activeSlug?: string;
  className?: string;
}

export function CategoryNav({ categories, activeSlug, className }: CategoryNavProps) {
  const isAllActive = !activeSlug;
  const activeTabRef = useRef<HTMLAnchorElement>(null);

  // Automatically scroll active category tab into view on mobile
  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [activeSlug]);

  return (
    <div
      className={cn(
        "sticky top-16 z-30 w-full border-b border-border bg-background shadow-xs transition-colors",
        className
      )}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-2 sm:py-2.5">
        <nav
          aria-label="Menu categories"
          className="scrollbar-none flex w-full items-center gap-2 overflow-x-auto py-0.5 sm:flex-wrap"
        >
          <Link
            ref={isAllActive ? activeTabRef : undefined}
            href="/menu"
            className={cn(
              "flex h-10 shrink-0 items-center justify-center rounded-sm px-3.5 text-xs sm:text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel",
              isAllActive
                ? "bg-primary text-primary-foreground shadow-xs"
                : "border border-border bg-card text-foreground hover:bg-secondary hover:text-caramel"
            )}
          >
            All Items
          </Link>

          {categories.map((category) => {
            const isActive = activeSlug === category.slug;
            return (
              <Link
                key={category.id}
                ref={isActive ? activeTabRef : undefined}
                href={`/menu/${category.slug}`}
                className={cn(
                  "flex h-10 shrink-0 items-center gap-1.5 sm:gap-2 rounded-sm px-3.5 text-xs sm:text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "border border-border bg-card text-foreground hover:bg-secondary hover:text-caramel"
                )}
              >
                <span>{category.name}</span>
                {category.name_kn && (
                  <span
                    className={cn(
                      "font-kannada text-[11px] sm:text-xs",
                      isActive
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                    )}
                  >
                    {category.name_kn}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
