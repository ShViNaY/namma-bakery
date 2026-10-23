import Link from "next/link";
import { ArrowRight, Cake, UtensilsCrossed, Pizza, Soup } from "lucide-react";
import type { Category } from "@/lib/menu/types";

interface CategoryShowcaseProps {
  categories: Category[];
}

function getCategoryIcon(slug: string) {
  switch (slug) {
    case "cakes":
      return <Cake className="h-5 w-5 stroke-[1.5]" />;
    case "mini-pizzas":
      return <Pizza className="h-5 w-5 stroke-[1.5]" />;
    case "soups":
      return <Soup className="h-5 w-5 stroke-[1.5]" />;
    case "sandwiches":
    default:
      return <UtensilsCrossed className="h-5 w-5 stroke-[1.5]" />;
  }
}

export function CategoryShowcase({ categories }: CategoryShowcaseProps) {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="border-b border-border py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="font-kannada text-xs font-medium text-caramel">
              ಬೇಕರಿ ಮೆನು
            </span>
            <h2 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">
              Browse by Category
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Handcrafted cakes, warm savoury bakes, and neighbourhood snacks.
            </p>
          </div>
          <Link
            href="/menu"
            className="inline-flex min-h-[48px] items-center gap-1.5 text-sm font-medium text-caramel transition-colors hover:text-caramel/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
          >
            <span>View full menu</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/menu/${category.slug}`}
              className="group flex flex-col justify-between rounded-sm border border-border bg-card p-5 transition-all hover:border-caramel/60 hover:bg-card/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-secondary text-caramel transition-colors group-hover:bg-caramel group-hover:text-primary-foreground">
                  {getCategoryIcon(category.slug)}
                </div>
                {category.name_kn && (
                  <span className="font-kannada text-xs text-muted-foreground">
                    {category.name_kn}
                  </span>
                )}
              </div>

              <div className="mt-6">
                <h3 className="font-heading text-lg font-semibold text-foreground group-hover:text-caramel">
                  {category.name}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {category.description ?? "Freshly prepared every day at our bakery."}
                </p>
              </div>

              <div className="mt-4 flex min-h-[44px] items-center gap-1 text-xs font-medium text-caramel group-hover:underline">
                <span>Explore items</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
