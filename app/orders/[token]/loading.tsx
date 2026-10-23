export default function OrderTrackingLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12 animate-pulse space-y-6">
      <div className="h-4 w-32 rounded bg-muted/60" />

      {/* Hero Card Skeleton */}
      <div className="rounded-sm border border-border bg-card p-6 sm:p-8 space-y-4">
        <div className="h-6 w-48 rounded bg-muted/70" />
        <div className="h-4 w-72 rounded bg-muted/50" />
        <div className="h-10 w-full rounded bg-muted/40" />
      </div>

      {/* Details Box Skeleton */}
      <div className="rounded-sm border border-border bg-card p-6 space-y-4">
        <div className="h-5 w-40 rounded bg-muted/60" />
        <div className="space-y-3 pt-2">
          <div className="h-12 w-full rounded bg-muted/30" />
          <div className="h-12 w-full rounded bg-muted/30" />
        </div>
      </div>
    </div>
  );
}
