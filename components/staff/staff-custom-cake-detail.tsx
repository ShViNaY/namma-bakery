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
  ExternalLink,
} from "lucide-react";
import type { CustomCakeRequest, CustomCakeStatus } from "@/lib/custom-cake/types";
import type { CustomCakeModalType } from "./staff-custom-cake-modal";
import {
  addCustomCakeStaffNoteAction,
  getCustomCakeSignedUrlAction,
} from "@/lib/custom-cake/staff-actions";
import { formatIstDate, formatIstTime, formatIstDateTime } from "@/lib/utils/date";

interface StaffCustomCakeDetailProps {
  request: CustomCakeRequest;
  onClose: () => void;
  onOpenModal: (modal: CustomCakeModalType) => void;
}

export function StaffCustomCakeDetail({
  request,
  onClose,
  onOpenModal,
}: StaffCustomCakeDetailProps) {
  const [internalNoteInput, setInternalNoteInput] = React.useState("");
  const [isAddingNote, setIsAddingNote] = React.useState(false);
  const [noteError, setNoteError] = React.useState<string | null>(null);

  const referenceImage = request.custom_cake_images?.[0];
  const storagePath = referenceImage?.storage_path;
  const [signedImageUrl, setSignedImageUrl] = React.useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = React.useState(Boolean(storagePath));

  React.useEffect(() => {
    let isMounted = true;

    if (storagePath) {
      getCustomCakeSignedUrlAction(storagePath).then((res) => {
        if (isMounted) {
          setIsLoadingImage(false);
          if (res.success && res.signedUrl) {
            setSignedImageUrl(res.signedUrl);
          }
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [storagePath]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalNoteInput.trim()) return;

    setNoteError(null);
    setIsAddingNote(true);

    try {
      const res = await addCustomCakeStaffNoteAction({
        requestId: request.id,
        body: internalNoteInput.trim(),
      });

      if (!res.success) {
        setNoteError(res.error || "Failed to add note.");
      } else {
        setInternalNoteInput("");
      }
    } catch (err) {
      console.error("[StaffCustomCakeDetail] Error adding note:", err);
      setNoteError("Failed to save note.");
    } finally {
      setIsAddingNote(false);
    }
  };

  const getStatusBadge = (status: CustomCakeStatus) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300";
      case "UNDER_REVIEW":
        return "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-300";
      case "NEEDS_CLARIFICATION":
        return "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950 dark:text-purple-300";
      case "QUOTED":
      case "CUSTOMER_ACCEPTED":
        return "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300";
      case "DECLINED":
      case "CUSTOMER_DECLINED":
      case "WITHDRAWN":
      case "EXPIRED":
        return "bg-destructive/15 text-destructive border-destructive/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-border flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-mono text-lg sm:text-xl font-bold tracking-tight text-foreground">
              {request.request_number}
            </h2>
            <span
              className={`rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wider border ${getStatusBadge(
                request.status
              )}`}
            >
              {request.status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            Submitted on {formatIstDateTime(request.created_at)}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-caramel"
          title="Close details"
          aria-label="Close details"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
        {/* Next Operations Bar */}
        <div className="rounded-sm border border-border bg-background p-3.5 space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Custom Cake Operations
          </span>
          <div className="flex flex-wrap gap-2">
            {request.status === "SUBMITTED" && (
              <>
                <button
                  type="button"
                  onClick={() => onOpenModal({ type: "REVIEW", request })}
                  className="h-9 px-3 rounded-sm bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800"
                >
                  Mark In Review / Contacted
                </button>
                <button
                  type="button"
                  onClick={() => onOpenModal({ type: "CONFIRM", request })}
                  className="h-9 px-3 rounded-sm bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                >
                  Confirm Order
                </button>
                <button
                  type="button"
                  onClick={() => onOpenModal({ type: "CLARIFICATION", request })}
                  className="h-9 px-3 rounded-sm border border-purple-400 text-purple-800 text-xs font-semibold hover:bg-purple-50 dark:text-purple-300 dark:border-purple-800"
                >
                  Need Clarification
                </button>
                <button
                  type="button"
                  onClick={() => onOpenModal({ type: "DECLINE", request })}
                  className="h-9 px-3 rounded-sm border border-destructive/40 text-destructive text-xs font-semibold hover:bg-destructive/10"
                >
                  Decline Request
                </button>
              </>
            )}

            {request.status === "UNDER_REVIEW" && (
              <>
                <button
                  type="button"
                  onClick={() => onOpenModal({ type: "CONFIRM", request })}
                  className="h-9 px-3 rounded-sm bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                >
                  Confirm Order
                </button>
                <button
                  type="button"
                  onClick={() => onOpenModal({ type: "CLARIFICATION", request })}
                  className="h-9 px-3 rounded-sm border border-purple-400 text-purple-800 text-xs font-semibold hover:bg-purple-50 dark:text-purple-300 dark:border-purple-800"
                >
                  Need Clarification
                </button>
                <button
                  type="button"
                  onClick={() => onOpenModal({ type: "DECLINE", request })}
                  className="h-9 px-3 rounded-sm border border-destructive/40 text-destructive text-xs font-semibold hover:bg-destructive/10"
                >
                  Decline Request
                </button>
              </>
            )}

            {request.status === "NEEDS_CLARIFICATION" && (
              <>
                <button
                  type="button"
                  onClick={() => onOpenModal({ type: "REVIEW", request })}
                  className="h-9 px-3 rounded-sm bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800"
                >
                  Customer Clarified (In Review)
                </button>
                <button
                  type="button"
                  onClick={() => onOpenModal({ type: "CONFIRM", request })}
                  className="h-9 px-3 rounded-sm bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                >
                  Confirm Order
                </button>
                <button
                  type="button"
                  onClick={() => onOpenModal({ type: "DECLINE", request })}
                  className="h-9 px-3 rounded-sm border border-destructive/40 text-destructive text-xs font-semibold hover:bg-destructive/10"
                >
                  Decline Request
                </button>
              </>
            )}

            {(request.status === "CUSTOMER_ACCEPTED" || request.status === "DECLINED") && (
              <span className="text-xs text-muted-foreground italic py-1.5">
                This enquiry is currently in a resolved status ({request.status.replace(/_/g, " ")}).
              </span>
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
                {request.customer_name}
              </span>
              <a
                href={`tel:${request.customer_phone}`}
                className="inline-flex items-center gap-1 text-caramel hover:underline font-semibold"
              >
                <Phone className="size-3.5" />
                <span>+91 {request.customer_phone}</span>
              </a>
            </div>
            {request.customer_email && (
              <div className="flex items-center gap-1.5 text-muted-foreground pt-1 border-t border-border/50">
                <Mail className="size-3.5 shrink-0" />
                <span>{request.customer_email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Pickup Schedule */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Preferred Pickup Schedule
          </span>
          <div className="rounded-sm border border-border bg-background p-3.5 space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <Calendar className="size-4 text-caramel shrink-0 mt-0.5" />
              <div>
                <span className="text-muted-foreground block">Preferred Date:</span>
                <span className="font-semibold text-foreground text-sm">
                  {formatIstDate(request.preferred_pickup_at)}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2 pt-1 border-t border-border/50">
              <Clock className="size-4 text-caramel shrink-0 mt-0.5" />
              <div>
                <span className="text-muted-foreground block">Time Window:</span>
                <span className="font-semibold text-foreground">
                  Around {formatIstTime(request.preferred_pickup_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cake Specifications */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Cake Specifications
          </span>
          <div className="rounded-sm border border-border bg-background p-3.5 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-muted-foreground block">Occasion / Type:</span>
                <span className="font-semibold text-foreground">
                  {request.cake_type || "Celebration"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Flavour:</span>
                <span className="font-semibold text-foreground">
                  {request.flavour}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Weight:</span>
                <span className="font-semibold text-foreground">
                  {request.weight_grams >= 1000
                    ? `${request.weight_grams / 1000} kg`
                    : `${request.weight_grams}g`}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Shape:</span>
                <span className="font-semibold text-foreground">
                  {request.shape || "Round"}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-border/50">
              <span className="text-muted-foreground block mb-1">Dietary / Egg Type:</span>
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase inline-block ${
                  request.egg_type === "EGGLESS"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                }`}
              >
                {request.egg_type === "EGGLESS" ? "Eggless (Pure Veg)" : "Regular (With Egg)"}
              </span>
            </div>

            {request.message_on_cake && (
              <div className="pt-2 border-t border-border/50">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1 mb-1">
                  <Sparkles className="size-3" />
                  <span>Inscription on Cake</span>
                </span>
                <p className="font-serif italic text-sm text-foreground bg-amber-50/70 p-2.5 rounded-xs border border-amber-300 dark:bg-amber-950/40 dark:border-amber-800">
                  &ldquo;{request.message_on_cake}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Theme & Design Instructions */}
        {request.description && (
          <div className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
              Theme / Design Description
            </span>
            <div className="rounded-sm border border-border bg-background p-3.5 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
              {request.description}
            </div>
          </div>
        )}

        {/* Reference Image Photo */}
        {referenceImage && (
          <div className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
              Customer Reference Photo
            </span>
            <div className="rounded-sm border border-border bg-background p-3.5 space-y-3">
              {isLoadingImage ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Loading reference image...</span>
                </div>
              ) : signedImageUrl ? (
                <div className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={signedImageUrl}
                    alt="Customer cake reference"
                    className="max-h-56 w-auto object-contain rounded-xs border border-border mx-auto"
                  />
                  <a
                    href={signedImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-caramel hover:underline"
                  >
                    <ExternalLink className="size-3.5" />
                    <span>View High-Resolution Image</span>
                  </a>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Image path recorded: {referenceImage.storage_path}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Additional Notes or Decline Reasons */}
        {(request.additional_notes || request.decline_reason) && (
          <div className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
              Notes & Status Explanations
            </span>
            <div className="rounded-sm border border-border bg-background p-3.5 space-y-2 text-xs">
              {request.additional_notes && (
                <div>
                  <span className="font-semibold text-muted-foreground block mb-0.5">
                    Customer Instructions:
                  </span>
                  <p className="text-foreground bg-muted/40 p-2 rounded-xs">
                    {request.additional_notes}
                  </p>
                </div>
              )}
              {request.decline_reason && (
                <div>
                  <span className="font-semibold text-destructive block mb-0.5">
                    Decline Reason:
                  </span>
                  <p className="text-destructive bg-destructive/10 p-2 rounded-xs font-medium">
                    {request.decline_reason}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Staff Messages & Internal Notes */}
        <div className="space-y-2 pb-6">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Staff Messages & Internal Notes
          </span>
          <div className="rounded-sm border border-border bg-background p-3.5 space-y-3 text-xs">
            {request.request_messages && request.request_messages.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {request.request_messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="rounded-xs border border-border/80 bg-card p-2.5 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground text-[11px] uppercase">
                        {msg.sender === "STAFF" ? "Staff Memo" : "Customer Message"}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {formatIstDateTime(msg.created_at)}
                      </span>
                    </div>
                    <p className="text-foreground">{msg.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground italic">No notes recorded yet.</p>
            )}

            {noteError && <p className="text-destructive text-xs">{noteError}</p>}

            <form onSubmit={handleAddNote} className="flex gap-2 pt-2 border-t border-border/60">
              <input
                type="text"
                placeholder="Add a staff note or memo..."
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
      </div>
    </div>
  );
}
