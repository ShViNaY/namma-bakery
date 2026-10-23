"use client";

import * as React from "react";
import { AlertCircle, Loader2, X } from "lucide-react";
import type { CustomCakeRequest, CustomCakeStatus } from "@/lib/custom-cake/types";
import { updateCustomCakeStatusAction } from "@/lib/custom-cake/staff-actions";

export type CustomCakeModalType =
  | { type: "REVIEW"; request: CustomCakeRequest }
  | { type: "CONFIRM"; request: CustomCakeRequest }
  | { type: "DECLINE"; request: CustomCakeRequest }
  | { type: "CLARIFICATION"; request: CustomCakeRequest };

interface StaffCustomCakeModalProps {
  modal: CustomCakeModalType | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function StaffCustomCakeModal({
  modal,
  onClose,
  onSuccess,
}: StaffCustomCakeModalProps) {
  if (!modal) return null;

  return (
    <StaffCustomCakeModalContent
      key={`${modal.type}-${modal.request.id}`}
      modal={modal}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

function StaffCustomCakeModalContent({
  modal,
  onClose,
  onSuccess,
}: {
  modal: NonNullable<CustomCakeModalType>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { request, type } = modal;

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [noteMessage, setNoteMessage] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    let toStatus: CustomCakeStatus;
    switch (type) {
      case "REVIEW":
        toStatus = "UNDER_REVIEW";
        break;
      case "CONFIRM":
        toStatus = "CUSTOMER_ACCEPTED";
        break;
      case "CLARIFICATION":
        toStatus = "NEEDS_CLARIFICATION";
        if (!noteMessage.trim()) {
          setErrorMessage("Please enter what clarification is needed from the customer.");
          setIsSubmitting(false);
          return;
        }
        break;
      case "DECLINE":
        toStatus = "DECLINED";
        if (!noteMessage.trim()) {
          setErrorMessage("A decline reason is required.");
          setIsSubmitting(false);
          return;
        }
        break;
    }

    try {
      const res = await updateCustomCakeStatusAction({
        requestId: request.id,
        toStatus,
        message: noteMessage.trim() || undefined,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to update status.");
        setIsSubmitting(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("[StaffCustomCakeModal] Error:", err);
      setErrorMessage("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case "REVIEW":
        return "Mark Under Review / Contacted";
      case "CONFIRM":
        return "Confirm Custom Cake Order";
      case "CLARIFICATION":
        return "Request Clarification from Customer";
      case "DECLINE":
        return "Decline Custom Cake Request";
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-cake-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cocoa/40 backdrop-blur-xs"
    >
      <div className="w-full max-w-lg rounded-sm border border-border bg-card p-6 shadow-md space-y-5 animate-in fade-in-50 zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 id="custom-cake-modal-title" className="font-heading text-lg font-bold text-foreground">
              {getTitle()}
            </h2>
            <p className="text-xs text-muted-foreground">
              Request <span className="font-mono font-semibold text-foreground">{request.request_number}</span> · {request.customer_name}
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
          {type === "DECLINE" && (
            <div className="space-y-3">
              <div className="rounded-sm border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                Declining this request will close the enquiry and record your reason in the audit log.
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  "Kitchen at capacity on date",
                  "Design not feasible with current ingredients",
                  "Insufficient lead time",
                  "Customer requested cancellation",
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setNoteMessage(preset)}
                    className="rounded-sm border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground hover:border-caramel hover:bg-caramel/5"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div>
                <label
                  htmlFor="declineReason"
                  className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1.5"
                >
                  Decline Reason <span className="text-destructive">*</span>
                </label>
                <textarea
                  id="declineReason"
                  required
                  rows={3}
                  placeholder="Explain why this custom cake request cannot be accommodated..."
                  value={noteMessage}
                  onChange={(e) => setNoteMessage(e.target.value)}
                  className="w-full rounded-sm border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
                />
              </div>
            </div>
          )}

          {type === "CLARIFICATION" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Set request status to <strong className="text-foreground">Needs Clarification</strong> and record notes on what details need to be confirmed with the customer.
              </p>
              <div>
                <label
                  htmlFor="clarificationNote"
                  className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1.5"
                >
                  Clarification Note <span className="text-destructive">*</span>
                </label>
                <textarea
                  id="clarificationNote"
                  required
                  rows={3}
                  placeholder="e.g. Need confirmation on fondant vs whipped cream finish, or exact cartoon character choice..."
                  value={noteMessage}
                  onChange={(e) => setNoteMessage(e.target.value)}
                  className="w-full rounded-sm border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
                />
              </div>
            </div>
          )}

          {type === "REVIEW" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Marking this enquiry as <strong className="text-foreground">Under Review</strong> indicates that bakery staff has reviewed the specifications and is contacting the customer via phone.
              </p>
              <div>
                <label
                  htmlFor="reviewNote"
                  className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1.5"
                >
                  Optional Staff Memo
                </label>
                <input
                  id="reviewNote"
                  type="text"
                  placeholder="e.g. Called customer, checking sponge availability"
                  value={noteMessage}
                  onChange={(e) => setNoteMessage(e.target.value)}
                  className="w-full min-h-[42px] rounded-sm border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
                />
              </div>
            </div>
          )}

          {type === "CONFIRM" && (
            <div className="space-y-3">
              <div className="rounded-sm border border-emerald-300 bg-emerald-50/60 p-3 text-xs text-emerald-950 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200">
                Confirm that you have spoken with the customer and agreed on the design, flavours, and collection schedule.
              </div>
              <div>
                <label
                  htmlFor="confirmNote"
                  className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1.5"
                >
                  Confirmation Note / Agreed Price
                </label>
                <input
                  id="confirmNote"
                  type="text"
                  placeholder="e.g. Agreed on ₹2,400 with sugar paste figurines"
                  value={noteMessage}
                  onChange={(e) => setNoteMessage(e.target.value)}
                  className="w-full min-h-[42px] rounded-sm border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
                />
              </div>
            </div>
          )}

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
                type === "DECLINE"
                  ? "bg-destructive hover:bg-destructive/90"
                  : type === "CONFIRM"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-caramel hover:bg-caramel/90"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Updating...</span>
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
