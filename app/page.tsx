import Link from "next/link";
import { ArrowRight, Cake, Clock, MapPin, Sparkles, UtensilsCrossed } from "lucide-react";
import { getMenuCategories } from "@/lib/menu/queries";

export const instant = false;

export default async function HomePage() {
  const { data: categories } = await getMenuCategories();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="border-b border-border bg-card/40 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-secondary/80 px-3 py-1 text-xs text-caramel">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="font-kannada font-medium">ಆರ್ ಆರ್ ನಗರದ ನೆಚ್ಚಿನ ಬೇಕರಿ</span>
            <span className="text-muted-foreground">•</span>
            <span>BEML Layout, RR Nagar</span>
          </div>

          <h1 className="mt-6 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-5xl sm:leading-tight">
            Handcrafted Cakes &amp; Fresh Neighbourhood Bakes
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            From custom birthday celebrations to everyday tea-time savouries,
            every item at Namma Bakery is baked fresh with care in Bengaluru.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/menu"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-sm bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-caramel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
            >
              <span>Explore Bakery Menu</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/menu/cakes"
              className="inline-flex h-12 items-center justify-center rounded-sm border border-border bg-card px-6 text-sm font-medium text-foreground transition-colors hover:bg-secondary hover:text-caramel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
            >
              Celebration Cakes
            </Link>
          </div>

          {/* Quick timing indicator */}
          <div className="mt-10 inline-flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-caramel" />
              Open Daily: 10:00 AM – 9:30 PM
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-caramel" />
              BEML Layout 3rd Stage, RR Nagar
            </span>
          </div>
        </div>
      </section>

      {/* Categories Showcase */}
      {categories.length > 0 && (
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <span className="font-kannada text-xs font-medium text-caramel">
                  ಬೇಕರಿ ಮೆನು
                </span>
                <h2 className="font-heading text-2xl font-semibold text-foreground">
                  Browse by Category
                </h2>
              </div>
              <Link
                href="/menu"
                className="inline-flex items-center gap-1 text-sm font-medium text-caramel hover:underline"
              >
                <span>View all items</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/menu/${category.slug}`}
                  className="group flex flex-col justify-between rounded-sm border border-border bg-card p-5 transition-all hover:border-caramel/60 hover:bg-card/90"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-secondary text-caramel">
                      {category.slug === "cakes" ? (
                        <Cake className="h-5 w-5 stroke-[1.5]" />
                      ) : (
                        <UtensilsCrossed className="h-5 w-5 stroke-[1.5]" />
                      )}
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
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {category.description ?? "Freshly prepared every day at our bakery."}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-1 text-xs font-medium text-caramel group-hover:underline">
                    <span>Explore items</span>
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
