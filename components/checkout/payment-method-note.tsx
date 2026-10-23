import * as React from "react";
import { Banknote, CreditCard, QrCode, Store } from "lucide-react";

export function PaymentMethodNote() {
  return (
    <div className="rounded-sm border border-border bg-card p-5 sm:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Store className="h-5 w-5 text-caramel" aria-hidden="true" />
        <h3 className="font-heading text-lg font-semibold text-foreground">
          Payment Method
        </h3>
      </div>

      <div className="rounded-sm border border-amber-200/80 bg-amber-50/70 p-4 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
        <p className="font-semibold text-sm">
          Pay at Bakery Counter
        </p>
        <p className="mt-1 leading-relaxed text-amber-900/90 dark:text-amber-300/90">
          Online payment gateway integration is currently in progress and coming soon. For all orders, payment is collected in person at the bakery counter during pickup.
        </p>
      </div>

      <div className="space-y-2 pt-1 text-xs text-muted-foreground">
        <span className="font-medium text-foreground block">
          Accepted at our RR Nagar counter:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="flex items-center gap-2 rounded-xs border border-border bg-secondary/30 px-3 py-2">
            <QrCode className="h-4 w-4 text-caramel" aria-hidden="true" />
            <span>UPI / QR Scan</span>
          </div>
          <div className="flex items-center gap-2 rounded-xs border border-border bg-secondary/30 px-3 py-2">
            <CreditCard className="h-4 w-4 text-caramel" aria-hidden="true" />
            <span>Debit / Credit Cards</span>
          </div>
          <div className="flex items-center gap-2 rounded-xs border border-border bg-secondary/30 px-3 py-2">
            <Banknote className="h-4 w-4 text-caramel" aria-hidden="true" />
            <span>Cash</span>
          </div>
        </div>
      </div>
    </div>
  );
}
