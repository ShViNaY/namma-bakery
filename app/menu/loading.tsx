export default function MenuLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8 space-y-2">
        <div className="h-4 w-32 rounded bg-muted/60" />
        <div className="h-8 w-48 rounded bg-muted/80" />
        <div className="h-4 w-72 rounded bg-muted/50" />
      </div>

      {/* Category Nav skeleton */}
      <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-12 w-28 shrink-0 rounded-sm border border-border bg-card/60"
          />
        ))}
      </div>

      {/* Product Grid skeleton */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col rounded-sm border border-border bg-card overflow-hidden"
          >
            <div className="aspect-4/3 w-full bg-muted/40" />
            <div className="p-4 space-y-3">
              <div className="h-5 w-3/4 rounded bg-muted/60" />
              <div className="h-3 w-full rounded bg-muted/40" />
              <div className="pt-2 flex justify-between">
                <div className="h-3 w-20 rounded bg-muted/50" />
                <div className="h-4 w-16 rounded bg-muted/70" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
