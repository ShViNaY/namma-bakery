import { AlertTriangle } from "lucide-react";

export function DemoBanner() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
    return null;
  }

  return (
    <aside
      id="demo-preview-banner"
      role="region"
      aria-label="Demo preview notice"
      className="w-full border-b border-amber-300 bg-amber-100/90 text-amber-950 dark:border-amber-800 dark:bg-amber-950/80 dark:text-amber-200"
    >
      <div className="mx-auto flex max-w-6xl items-start gap-2.5 px-3 py-2 sm:items-center sm:gap-3 sm:px-6">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-xs bg-amber-200/90 text-amber-800 dark:bg-amber-900/70 dark:text-amber-300 mt-0.5 sm:mt-0">
          <AlertTriangle className="size-3.5" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-0.5 text-xs sm:flex-row sm:items-baseline sm:gap-2 min-w-0">
          <span className="font-bold tracking-wide uppercase text-[11px] sm:text-xs text-amber-900 dark:text-amber-200 shrink-0">
            DEMO PREVIEW — SAMPLE DATA
          </span>
          <span className="hidden sm:inline text-amber-600/70 dark:text-amber-400/70" aria-hidden="true">
            •
          </span>
          <p className="text-[11px] sm:text-xs leading-relaxed text-amber-900/90 dark:text-amber-200/90">
            Product availability, prices, opening hours and pickup settings are demonstration values pending confirmation by the bakery. Please do not use this website for real purchases or pickup orders.
          </p>
        </div>
      </div>
    </aside>
  );
}
