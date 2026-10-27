import Link from "next/link";
import type { Category } from "@/lib/menu/types";

interface CategoryNavProps {
  categories: Category[];
  activeSlug?: string;
}

export function CategoryNav({ categories, activeSlug }: CategoryNavProps) {
  const isAllActive = !activeSlug;

  return (
    <nav
      aria-label="Menu categories"
      className="scrollbar-none flex w-full items-center gap-2 overflow-x-auto py-2 sm:flex-wrap"
    >
      <Link
        href="/menu"
        className={`flex h-12 shrink-0 items-center justify-center rounded-sm px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel ${
          isAllActive
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-card text-foreground hover:bg-secondary hover:text-caramel"
        }`}
      >
        All Items
      </Link>

      {categories.map((category) => {
        const isActive = activeSlug === category.slug;
        return (
          <Link
            key={category.id}
            href={`/menu/${category.slug}`}
            className={`flex h-12 shrink-0 items-center gap-2 rounded-sm px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-foreground hover:bg-secondary hover:text-caramel"
            }`}
          >
            <span>{category.name}</span>
            {category.name_kn && (
              <span
                className={`font-kannada text-xs ${
                  isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                }`}
              >
                {category.name_kn}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
