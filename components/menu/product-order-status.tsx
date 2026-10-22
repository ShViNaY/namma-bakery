import { CheckCircle2, Clock, AlertTriangle, Store } from "lucide-react";
import { getOrderabilityInfo } from "@/lib/menu/utils";

interface ProductOrderStatusProps {
  isAvailable: boolean;
  orderableOnline: boolean;
  requiresConfirmation: boolean;
}

export function ProductOrderStatus({
  isAvailable,
  orderableOnline,
  requiresConfirmation,
}: ProductOrderStatusProps) {
  const info = getOrderabilityInfo({
    is_available: isAvailable,
    orderable_online: orderableOnline,
    requires_confirmation: requiresConfirmation,
  });

  return (
    <div className="rounded-sm border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        {info.status === "available" && (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
        )}
        {info.status === "requires_confirmation" && (
          <Clock className="h-4 w-4 shrink-0 text-caramel" />
        )}
        {info.status === "in_store_only" && (
          <Store className="h-4 w-4 shrink-0 text-amber-700" />
        )}
        {info.status === "unavailable" && (
          <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
        )}

        <span className="font-heading text-sm font-semibold text-foreground">
          {info.badgeText}
        </span>
      </div>

      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        {info.description}
      </p>
    </div>
  );
}
