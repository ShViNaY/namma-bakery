"use client";

import * as React from "react";
import {
  X,
  Phone,
  Mail,
  Calendar,
  Clock,
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  Banknote,
} from "lucide-react";
import type { StaffOrder, StaffRole } from "@/lib/staff/types";
import type { ModalType } from "./staff-status-modal";
import { addInternalNoteAction } from "@/lib/staff/actions";
import { formatPaise } from "@/lib/utils/money";
import { formatIstDateTime } from "@/lib/utils/date";

interface StaffOrderDetailProps {
  order: StaffOrder;
  role: StaffRole | null;
  onClose: () => void;
  onOpenModal: (modal: ModalType) => void;
}

export function StaffOrderDetail({
  order,
  role,
  onClose,
  onOpenModal,
}: StaffOrderDetailProps) {
  const [internalNoteInput, setInternalNoteInput] = React.useState("");
  const [isAddingNote, setIsAddingNote] = React.useState(false);
  const [noteError, setNoteError] = React.useState<string | null>(null);

  const isAdmin = role === "ADMIN";

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalNoteInput.trim()) return;

    setNoteError(null);
    setIsAddingNote(true);

    try {
      const res = await addInternalNoteAction({
        orderId: order.id,
        body: internalNoteInput.trim(),
      });

      if (!res.success) {
        setNoteError(res.error || "Failed to add internal note.");
      } else {
        setInternalNoteInput("");
      }
    } catch (err) {
      console.error("[StaffOrderDetail] Failed to add note:", err);
      setNoteError("Failed to add note. Try again.");
    } finally {
      setIsAddingNote(false);
    }
  };

  const getStatusBadge = () => {
    switch (order.status) {
      case "PENDING":
        return "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300";
      case "ACCEPTED":
        return "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-300";
      case "PREPARING":
        return "bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950 dark:text-orange-300";
      case "READY_FOR_PICKUP":
        return "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300";
      case "COMPLETED":
        return "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-900 dark:text-slate-300";
      case "REJECTED":
      case "CANCELLED":
      case "NO_SHOW":
        return "bg-destructive/15 text-destructive border-destructive/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-border flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-mono text-lg sm:text-xl font-bold tracking-tight text-foreground">
              {order.order_number}
            </h2>
            <span
              className={`rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wider border ${getStatusBadge()}`}
            >
              {order.status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            Placed on {formatIstDateTime(order.created_at)}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Close details"
          aria-label="Close details"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
        {/* Next Actions Bar */}
        <div className="rounded-sm border border-border bg-background p-3.5 space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Available Operations
          </span>
          <div className="flex flex-wrap gap-2">
            {order.status === "PENDING" && (
              <>
                <button
                  type="button"
                  onClick={() => onOpenModal({ type: "ACCEPT", order })}
                  className="h-9 px-3 rounded-sm bg-caramel text-white text-xs font-semibold hover:bg-caramel/90"
                >
                  Accept & Schedule
                </button>
                <button
                  type="button"
                  onClick={() => onOpenModal({ type: "REJECT", order })}
                  className="h-9 px-3 rounded-sm border border-destructive/40 text-destructive text-xs font-semibold hover:bg-destructive/10"
                >
                  Reject Order
                </button>
              </>
            )}

            {order.status === "ACCEPTED" && (
              <>
                <button
                  type="button"
                  onClick={() => onOpenModal({ type: "START_PREPARING", order })}
                  className="h-9 px-3 rounded-sm bg-orange-700 text-white text-xs font-semibold hover:bg-orange-800"
                >
                  Start Preparing
                </button>
                <button
                  type="button"
                  onClick={() => onOpenModal({ type: "CANCEL", order })}
                  className="h-9 px-3 rounded-sm border border-destructive/40 text-destructive text-xs font-semibold hover:bg-destructive/10"
                >
                  Cancel Order
                </button>
              </>
            )}

            {order.status === "PREPARING" && (
              <>
                <button
                  type="button"
                  onClick={() => onOpenModal({ type: "READY", order })}
                  className="h-9 px-3 rounded-sm bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800"
                >
                  Mark Ready for Pickup
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => onOpenModal({ type: "CANCEL", order })}
                    className="h-9 px-3 rounded-sm border border-destructive/40 text-destructive text-xs font-semibold hover:bg-destructive/10"
                  >
                    Admin Cancel
                  </button>
                )}
              </>
            )}

            {order.status === "READY_FOR_PICKUP" && (
              <>
                <button
                  type="button"
                  onClick={() => onOpenModal({ type: "COMPLETE", order })}
                  className="h-9 px-3 rounded-sm bg-cocoa text-cream text-xs font-semibold hover:bg-cocoa/90"
                >
                  Complete Handover
                </button>
                <button
                  type="button"
                  onClick={() => onOpenModal({ type: "NO_SHOW", order })}
                  className="h-9 px-3 rounded-sm border border-destructive/40 text-destructive text-xs font-semibold hover:bg-destructive/10"
                >
                  Mark No Show
                </button>
              </>
            )}

            {/* In-Store Payment Recording */}
            {(order.status === "READY_FOR_PICKUP" || order.status === "COMPLETED") &&
              order.payment_status !== "paid" && (
                <button
                  type="button"
                  onClick={() => onOpenModal({ type: "RECORD_PAYMENT", order })}
                  className="h-9 px-3 rounded-sm bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1.5"
                >
                  <Banknote className="size-3.5" />
                  <span>Collect Payment ({formatPaise(order.total_paise)})</span>
                </button>
              )}
          </div>
        </div>

        {/* Customer Information */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Customer Information
          </span>
          <div className="rounded-sm border border-border bg-background p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground text-sm">
                {order.customer_name}
              </span>
              <a
                href={`tel:${order.customer_phone}`}
                className="inline-flex items-center gap-1 text-caramel hover:underline font-semibold"
              >
                <Phone className="size-3.5" />
                <span>+91 {order.customer_phone}</span>
              </a>
            </div>
            {order.customer_email && (
              <div className="flex items-center gap-1.5 text-muted-foreground pt-1 border-t border-border/50">
                <Mail className="size-3.5 shrink-0" />
                <span>{order.customer_email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Pickup Window & Scheduling */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Pickup Schedule
          </span>
          <div className="rounded-sm border border-border bg-background p-3.5 space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <Calendar className="size-4 text-caramel shrink-0 mt-0.5" />
              <div>
                <span className="text-muted-foreground block">Requested Pickup:</span>
                <span className="font-semibold text-foreground">
                  {formatIstDateTime(order.requested_pickup_at)}
                </span>
              </div>
            </div>

            {order.confirmed_pickup_at && (
              <div className="flex items-start gap-2 pt-2 border-t border-border/50">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-muted-foreground block">Confirmed Slot:</span>
                  <span className="font-semibold text-foreground">
                    {formatIstDateTime(order.confirmed_pickup_at)}
                  </span>
                </div>
              </div>
            )}

            {order.estimated_ready_at && (
              <div className="flex items-start gap-2 pt-2 border-t border-border/50">
                <Clock className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-muted-foreground block">Target Kitchen Ready:</span>
                  <span className="font-semibold text-foreground">
                    {formatIstDateTime(order.estimated_ready_at)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Items & Cake Customization */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Order Items ({order.order_items?.length || 0})
          </span>
          <div className="rounded-sm border border-border divide-y divide-border bg-background">
            {order.order_items?.map((item) => (
              <div key={item.id} className="p-3.5 space-y-2 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-semibold text-foreground text-sm">
                      {item.product_name}
                    </span>
                    {item.variant_label && (
                      <p className="text-muted-foreground mt-0.5">
                        {item.variant_label}
                        {item.weight_grams ? ` · ${item.weight_grams}g` : ""}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-semibold text-foreground">
                      {formatPaise(item.line_total_paise)}
                    </span>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      Qty: {item.quantity} × {formatPaise(item.unit_price_paise)}
                    </p>
                  </div>
                </div>

                {/* Attributes: Egg Type & Finish */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.egg_type && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        item.egg_type === "EGGLESS"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {item.egg_type}
                    </span>
                  )}
                  {item.finish && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">
                      Finish: {item.finish}
                    </span>
                  )}
                </div>

                {/* Cake Message Callout */}
                {item.cake_message && (
                  <div className="mt-2 rounded-sm border border-amber-300 bg-amber-50/70 p-2.5 text-xs text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200">
                    <div className="flex items-center gap-1.5 font-semibold text-[11px] uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-0.5">
                      <Sparkles className="size-3.5 shrink-0" />
                      <span>Cake Inscription</span>
                    </div>
                    <p className="font-serif italic text-sm pl-5">
                      &ldquo;{item.cake_message}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Financial & Payment Summary */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Payment & Total
          </span>
          <div className="rounded-sm border border-border bg-background p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-heading text-lg font-bold text-foreground">
                {formatPaise(order.total_paise)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border/50">
              <span className="text-muted-foreground">Payment Status:</span>
              <span
                className={`font-semibold uppercase text-[11px] px-2 py-0.5 rounded ${
                  order.payment_status === "paid"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                }`}
              >
                {order.payment_status === "paid" ? "Paid" : "Pay at Store (Pending)"}
              </span>
            </div>
          </div>
        </div>

        {/* Customer & Bakery Notes */}
        {(order.customer_notes || order.bakery_note || order.rejection_reason || order.cancellation_reason) && (
          <div className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
              Notes & Explanations
            </span>
            <div className="rounded-sm border border-border bg-background p-3.5 space-y-2.5 text-xs">
              {order.customer_notes && (
                <div>
                  <span className="font-semibold text-muted-foreground block mb-0.5">
                    Customer Instructions:
                  </span>
                  <p className="text-foreground bg-muted/40 p-2 rounded-xs">
                    {order.customer_notes}
                  </p>
                </div>
              )}
              {order.bakery_note && (
                <div>
                  <span className="font-semibold text-muted-foreground block mb-0.5">
                    Bakery Public Note:
                  </span>
                  <p className="text-foreground bg-muted/40 p-2 rounded-xs">
                    {order.bakery_note}
                  </p>
                </div>
              )}
              {(order.rejection_reason || order.cancellation_reason) && (
                <div>
                  <span className="font-semibold text-destructive block mb-0.5">
                    Reason for Rejection / Cancellation:
                  </span>
                  <p className="text-destructive bg-destructive/10 p-2 rounded-xs font-medium">
                    {order.rejection_reason || order.cancellation_reason}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Internal Staff Notes */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Staff-Only Internal Notes
          </span>
          <div className="rounded-sm border border-border bg-background p-3.5 space-y-3 text-xs">
            {order.order_internal_notes && order.order_internal_notes.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {order.order_internal_notes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-xs border border-border/80 bg-card p-2 space-y-1"
                  >
                    <p className="text-foreground">{note.body}</p>
                    <span className="text-[10px] text-muted-foreground font-mono block">
                      {formatIstDateTime(note.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground italic">
                No internal notes recorded yet.
              </p>
            )}

            {noteError && (
              <p className="text-destructive text-xs">{noteError}</p>
            )}

            <form onSubmit={handleAddNote} className="flex gap-2 pt-2 border-t border-border/60">
              <input
                type="text"
                placeholder="Add a private staff memo..."
                value={internalNoteInput}
                onChange={(e) => setInternalNoteInput(e.target.value)}
                disabled={isAddingNote}
                className="flex-1 min-h-[36px] rounded-xs border border-border bg-card px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-caramel"
              />
              <button
                type="submit"
                disabled={isAddingNote || !internalNoteInput.trim()}
                className="h-9 px-3 rounded-xs bg-cocoa text-cream text-xs font-semibold hover:bg-cocoa/90 disabled:opacity-50 flex items-center gap-1"
              >
                {isAddingNote ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Status History Timeline */}
        <div className="space-y-2 pb-6">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Order Lifecycle History
          </span>
          <div className="rounded-sm border border-border bg-background p-3.5 text-xs">
            {order.order_status_history && order.order_status_history.length > 0 ? (
              <ol className="relative border-l border-border/80 ml-2 space-y-4">
                {order.order_status_history.map((hist) => (
                  <li key={hist.id} className="ml-4 space-y-0.5">
                    <div className="absolute -left-1.5 mt-1.5 size-3 rounded-full border border-card bg-caramel" />
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground uppercase">
                        {hist.to_status.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        ({hist.actor_role})
                      </span>
                    </div>
                    {hist.note && (
                      <p className="text-muted-foreground italic">&ldquo;{hist.note}&rdquo;</p>
                    )}
                    <span className="text-[10px] text-muted-foreground font-mono block">
                      {formatIstDateTime(hist.created_at)}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-muted-foreground italic">No transition history logged.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
