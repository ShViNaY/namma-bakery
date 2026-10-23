"use client";

import * as React from "react";
import {
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import type { OrderStatus } from "@/lib/orders/types";
import type { StaffOrder } from "@/lib/staff/types";
import {
  transitionOrderAction,
  recordStorePaymentAction,
} from "@/lib/staff/actions";
import { formatPaise } from "@/lib/utils/money";
import { formatIstDateTime } from "@/lib/utils/date";

export type ModalType =
  | { type: "ACCEPT"; order: StaffOrder }
  | { type: "REJECT"; order: StaffOrder }
  | { type: "CANCEL"; order: StaffOrder }
  | { type: "START_PREPARING"; order: StaffOrder }
  | { type: "READY"; order: StaffOrder }
  | { type: "COMPLETE"; order: StaffOrder }
  | { type: "NO_SHOW"; order: StaffOrder }
  | { type: "RECORD_PAYMENT"; order: StaffOrder };

interface StaffStatusModalProps {
  modal: ModalType | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function StaffStatusModal({
  modal,
  onClose,
  onSuccess,
}: StaffStatusModalProps) {
  if (!modal) return null;

  return (
    <StaffStatusModalContent
      key={`${modal.type}-${modal.order.id}`}
      modal={modal}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

function StaffStatusModalContent({
  modal,
  onClose,
  onSuccess,
}: {
  modal: NonNullable<ModalType>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { order, type } = modal;

  const defaultIso = React.useMemo(() => {
    if (modal.type === "ACCEPT") {
      const date = new Date(modal.order.requested_pickup_at);
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
        date.getDate()
      )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }
    return "";
  }, [modal]);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [estimatedReadyAt, setEstimatedReadyAt] = React.useState<string>(defaultIso);
  const [reasonNote, setReasonNote] = React.useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (type === "RECORD_PAYMENT") {
        const res = await recordStorePaymentAction({
          orderId: order.id,
          amountPaise: order.total_paise,
        });

        if (!res.success) {
          setErrorMessage(res.error || "Failed to record payment.");
          setIsSubmitting(false);
          return;
        }

        onSuccess();
        onClose();
        return;
      }

      let targetStatus: OrderStatus;
      let readyTime: string | undefined = undefined;
      let note: string | undefined = undefined;

      switch (type) {
        case "ACCEPT":
          targetStatus = "ACCEPTED";
          if (!estimatedReadyAt) {
            setErrorMessage("Please set an estimated ready time.");
            setIsSubmitting(false);
            return;
          }
          readyTime = new Date(estimatedReadyAt).toISOString();
          note = reasonNote.trim() || undefined;
          break;

        case "START_PREPARING":
          targetStatus = "PREPARING";
          note = reasonNote.trim() || undefined;
          break;

        case "READY":
          targetStatus = "READY_FOR_PICKUP";
          note = reasonNote.trim() || undefined;
          break;

        case "COMPLETE":
          targetStatus = "COMPLETED";
          note = reasonNote.trim() || undefined;
          break;

        case "NO_SHOW":
          targetStatus = "NO_SHOW";
          note = reasonNote.trim() || undefined;
          break;

        case "REJECT":
          targetStatus = "REJECTED";
          if (!reasonNote.trim()) {
            setErrorMessage("A rejection reason is required.");
            setIsSubmitting(false);
            return;
          }
          note = reasonNote.trim();
          break;

        case "CANCEL":
          targetStatus = "CANCELLED";
          if (!reasonNote.trim()) {
            setErrorMessage("A cancellation reason is required.");
            setIsSubmitting(false);
            return;
          }
          note = reasonNote.trim();
          break;
      }

      const res = await transitionOrderAction({
        orderId: order.id,
        toStatus: targetStatus,
        note,
        estimatedReadyAt: readyTime,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to update order status.");
        setIsSubmitting(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("[StaffStatusModal] Action error:", err);
      setErrorMessage("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case "ACCEPT":
        return "Accept Order & Confirm Schedule";
      case "START_PREPARING":
        return "Start Preparing Order";
      case "READY":
        return "Mark Order Ready for Pickup";
      case "COMPLETE":
        return "Complete & Handover Order";
      case "NO_SHOW":
        return "Mark Order as No-Show";
      case "REJECT":
        return "Reject Order";
      case "CANCEL":
        return "Cancel Order";
      case "RECORD_PAYMENT":
        return "Record Counter Payment";
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cocoa/40 backdrop-blur-xs"
    >
      <div className="w-full max-w-lg rounded-sm border border-border bg-card p-6 shadow-md space-y-5 animate-in fade-in-50 zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 id="modal-title" className="font-heading text-lg font-bold text-foreground">
              {getTitle()}
            </h2>
            <p className="text-xs text-muted-foreground">
              Order <span className="font-mono font-semibold text-foreground">{order.order_number}</span> · {order.customer_name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-sm border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
          >
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ACCEPT: estimated ready time */}
          {type === "ACCEPT" && (
            <div className="space-y-3">
              <div className="rounded-sm border border-border bg-background p-3 text-xs space-y-1">
                <span className="text-muted-foreground">Requested Pickup:</span>
                <p className="font-semibold text-foreground">
                  {formatIstDateTime(order.requested_pickup_at)}
                </p>
              </div>

              <div>
                <label
                  htmlFor="estimatedReadyAt"
                  className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1.5"
                >
                  Estimated Ready Time <span className="text-destructive">*</span>
                </label>
                <input
                  id="estimatedReadyAt"
                  type="datetime-local"
                  required
                  value={estimatedReadyAt}
                  onChange={(e) => setEstimatedReadyAt(e.target.value)}
                  className="w-full min-h-[44px] rounded-sm border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Defaulted to customer&apos;s requested pickup time. Adjust if the kitchen requires more time.
                </p>
              </div>

              <div>
                <label
                  htmlFor="acceptNote"
                  className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1.5"
                >
                  Optional Note / Kitchen Memo
                </label>
                <input
                  id="acceptNote"
                  type="text"
                  placeholder="e.g. Sponge cooling, will ice by 3 PM"
                  value={reasonNote}
                  onChange={(e) => setReasonNote(e.target.value)}
                  className="w-full min-h-[42px] rounded-sm border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
                />
              </div>
            </div>
          )}

          {/* REJECT / CANCEL: Reason is REQUIRED */}
          {(type === "REJECT" || type === "CANCEL") && (
            <div className="space-y-3">
              <div className="rounded-sm border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                This action is destructive and will notify staff and customer tracking. A specific reason must be recorded in the audit log.
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  "Ingredients unavailable",
                  "Kitchen at capacity",
                  "Outside operational hours",
                  "Customer requested cancel",
                  "Duplicate order",
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setReasonNote(preset)}
                    className="rounded-sm border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground hover:border-caramel hover:bg-caramel/5"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div>
                <label
                  htmlFor="reasonNote"
                  className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1.5"
                >
                  Reason <span className="text-destructive">*</span>
                </label>
                <textarea
                  id="reasonNote"
                  required
                  rows={3}
                  placeholder="Explain why this order is being rejected or cancelled..."
                  value={reasonNote}
                  onChange={(e) => setReasonNote(e.target.value)}
                  className="w-full rounded-sm border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
                />
              </div>
            </div>
          )}

          {/* RECORD_PAYMENT */}
          {type === "RECORD_PAYMENT" && (
            <div className="space-y-3">
              <div className="rounded-sm border border-emerald-300 bg-emerald-50/60 p-4 text-center dark:bg-emerald-950/30 dark:border-emerald-800">
                <span className="text-xs uppercase tracking-wider text-emerald-800 dark:text-emerald-300 font-semibold">
                  Collect at Counter
                </span>
                <p className="font-heading text-3xl font-bold text-foreground mt-1">
                  {formatPaise(order.total_paise)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Cash or UPI received at bakery counter
                </p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Confirming this will mark the order as <strong className="text-foreground">PAID</strong> in the database and record a payment entry attributed to your staff user ID.
              </p>
            </div>
          )}

          {/* SIMPLE CONFIRMATIONS: START_PREPARING, READY, COMPLETE, NO_SHOW */}
          {(type === "START_PREPARING" ||
            type === "READY" ||
            type === "COMPLETE" ||
            type === "NO_SHOW") && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Confirm updating status from <strong className="text-foreground">{order.status}</strong> to{" "}
                <strong className="text-foreground">
                  {type === "START_PREPARING"
                    ? "PREPARING"
                    : type === "READY"
                    ? "READY_FOR_PICKUP"
                    : type === "COMPLETE"
                    ? "COMPLETED"
                    : "NO_SHOW"}
                </strong>.
              </p>

              <div>
                <label
                  htmlFor="memoNote"
                  className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1.5"
                >
                  Optional Note / Memo
                </label>
                <input
                  id="memoNote"
                  type="text"
                  placeholder="Optional note for order history"
                  value={reasonNote}
                  onChange={(e) => setReasonNote(e.target.value)}
                  className="w-full min-h-[42px] rounded-sm border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-10 px-4 rounded-sm border border-border bg-background text-xs font-semibold text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`h-10 px-5 rounded-sm text-xs font-semibold text-white flex items-center gap-1.5 ${
                type === "REJECT" || type === "CANCEL" || type === "NO_SHOW"
                  ? "bg-destructive hover:bg-destructive/90"
                  : type === "RECORD_PAYMENT"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-caramel hover:bg-caramel/90"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Confirm</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
