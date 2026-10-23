export default function CustomCakeLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 animate-pulse space-y-8">
      {/* Hero skeleton */}
      <div className="rounded-sm border border-border bg-card p-6 sm:p-8 space-y-3">
        <div className="h-4 w-32 rounded bg-muted/60" />
        <div className="h-8 w-64 rounded bg-muted/80" />
        <div className="h-4 w-96 rounded bg-muted/50" />
      </div>

      {/* Form sections skeleton */}
      <div className="rounded-sm border border-border bg-card p-6 space-y-6">
        <div className="h-6 w-48 rounded bg-muted/70" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-11 rounded bg-muted/40" />
          ))}
        </div>
        <div className="h-24 w-full rounded bg-muted/30" />
      </div>
    </div>
  );
}
