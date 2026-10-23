"use client";

import * as React from "react";
import {
  Store,
  Clock,
  Calendar,
  RotateCcw,
  Plus,
  Trash2,
  AlertCircle,
  Sliders,
} from "lucide-react";
import type {
  LocationInfo,
  StoreSettings,
  SpecialClosure,
  BusinessHour,
} from "@/lib/admin/types";
import {
  updateStoreSettingsAction,
  toggleStorePauseAction,
  addSpecialClosureAction,
  removeSpecialClosureAction,
} from "@/lib/admin/actions";
import { formatIstDateTime } from "@/lib/utils/date";

interface AdminStoreOperationsViewProps {
  location: LocationInfo | null;
  settings: StoreSettings | null;
  closures: SpecialClosure[];
  hours: BusinessHour[];
  isStorePaused?: boolean;
  onActionSuccess: () => void;
}

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function AdminStoreOperationsView({
  location,
  settings,
  closures,
  hours,
  isStorePaused = false,
  onActionSuccess,
}: AdminStoreOperationsViewProps) {
  // Store Pause State derived from server summary
  const isCurrentlyPaused = isStorePaused;

  const [pauseDurationHours, setPauseDurationHours] = React.useState("4");
  const [pauseMessage, setPauseMessage] = React.useState(
    settings?.pause_message || "Online ordering is temporarily paused due to heavy in-store rush."
  );
  const [isTogglingPause, setIsTogglingPause] = React.useState(false);
  const [pauseError, setPauseError] = React.useState<string | null>(null);

  // Slot settings state
  const [slotMinutes, setSlotMinutes] = React.useState<15 | 30 | 60>(
    settings?.slot_minutes || 30
  );
  const [maxOrdersPerSlot, setMaxOrdersPerSlot] = React.useState(
    settings?.max_orders_per_slot?.toString() || "6"
  );
  const [maxCustomPerDay, setMaxCustomPerDay] = React.useState(
    settings?.max_custom_per_day?.toString() || "4"
  );
  const [quoteValidityHours, setQuoteValidityHours] = React.useState(
    settings?.quote_validity_hours?.toString() || "24"
  );
  const [cancelCutoffHours, setCancelCutoffHours] = React.useState(
    settings?.cancel_cutoff_hours?.toString() || "4"
  );
  const [pendingAlertMinutes, setPendingAlertMinutes] = React.useState(
    settings?.pending_alert_minutes?.toString() || "15"
  );
  const [isSavingSettings, setIsSavingSettings] = React.useState(false);
  const [settingsFeedback, setSettingsFeedback] = React.useState<string | null>(null);

  // Special Closure Add state
  const [newClosureDate, setNewClosureDate] = React.useState("");
  const [newClosureReason, setNewClosureReason] = React.useState("");
  const [isAddingClosure, setIsAddingClosure] = React.useState(false);
  const [closureError, setClosureError] = React.useState<string | null>(null);

  const handleTogglePause = async (pause: boolean) => {
    if (!location) return;
    setIsTogglingPause(true);
    setPauseError(null);

    let paused_until: string | null = null;
    if (pause) {
      const hoursNum = parseInt(pauseDurationHours, 10) || 4;
      paused_until = new Date(Date.now() + hoursNum * 3600 * 1000).toISOString();
    }

    const res = await toggleStorePauseAction({
      location_id: location.id,
      is_paused: pause,
      paused_until,
      pause_message: pause ? pauseMessage : null,
    });
    setIsTogglingPause(false);

    if (!res.success) {
      setPauseError(res.error || "Failed to update store pause state.");
      return;
    }

    onActionSuccess();
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) return;

    setIsSavingSettings(true);
    setSettingsFeedback(null);

    const res = await updateStoreSettingsAction({
      location_id: location.id,
      slot_minutes: slotMinutes,
      max_orders_per_slot: parseInt(maxOrdersPerSlot, 10) || 6,
      max_custom_per_day: parseInt(maxCustomPerDay, 10) || 4,
      quote_validity_hours: parseInt(quoteValidityHours, 10) || 24,
      cancel_cutoff_hours: parseInt(cancelCutoffHours, 10) || 4,
      pending_alert_minutes: parseInt(pendingAlertMinutes, 10) || 15,
    });
    setIsSavingSettings(false);

    if (!res.success) {
      setSettingsFeedback(res.error || "Failed to save settings.");
      return;
    }

    setSettingsFeedback("Settings saved successfully.");
    setTimeout(() => setSettingsFeedback(null), 3000);
    onActionSuccess();
  };

  const handleAddClosure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location || !newClosureDate) return;

    setIsAddingClosure(true);
    setClosureError(null);

    const res = await addSpecialClosureAction({
      location_id: location.id,
      closure_date: newClosureDate,
      reason: newClosureReason.trim() || "Scheduled bakery closure",
    });
    setIsAddingClosure(false);

    if (!res.success) {
      setClosureError(res.error || "Failed to add closure date.");
      return;
    }

    setNewClosureDate("");
    setNewClosureReason("");
    onActionSuccess();
  };

  const handleRemoveClosure = async (closureId: string) => {
    const res = await removeSpecialClosureAction(closureId);
    if (res.success) {
      onActionSuccess();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Title */}
      <div>
        <h2 className="font-heading text-lg font-bold text-foreground">
          Store Operations & Scheduling
        </h2>
        <p className="text-xs text-muted-foreground">
          Control live order intake, slot capacities, lead time limits, and scheduled holiday closures.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Live Pause Controls */}
        <div className="rounded-sm border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Store className="size-4 text-caramel" />
            <h3 className="font-heading font-bold text-sm text-foreground">
              Online Ordering Intake
            </h3>
          </div>

          <div
            className={`p-3.5 rounded-sm border ${
              isCurrentlyPaused
                ? "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
                : "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`size-2.5 rounded-full ${
                    isCurrentlyPaused ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                />
                <span className="font-bold text-xs uppercase tracking-wider">
                  {isCurrentlyPaused ? "Store Paused" : "Accepting Orders"}
                </span>
              </div>
              {settings?.orders_paused_until && (
                <span className="text-[11px] font-mono">
                  Paused until {formatIstDateTime(settings.orders_paused_until)}
                </span>
              )}
            </div>
            {settings?.pause_message && (
              <p className="text-xs mt-2 italic">&ldquo;{settings.pause_message}&rdquo;</p>
            )}
          </div>

          {pauseError && (
            <div className="flex items-center gap-2 p-2 rounded text-xs bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="size-3.5 shrink-0" />
              <span>{pauseError}</span>
            </div>
          )}

          {isCurrentlyPaused ? (
            <div className="space-y-3 pt-2">
              <p className="text-xs text-muted-foreground">
                Online order intake is currently blocked for customers. Resuming will immediately open available pickup slots on the storefront.
              </p>
              <button
                type="button"
                disabled={isTogglingPause}
                onClick={() => handleTogglePause(false)}
                className="w-full h-9 rounded-sm bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isTogglingPause && <RotateCcw className="size-3.5 animate-spin" />}
                <span>Resume Store Orders Now</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-2 text-xs">
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Pause Duration
                </label>
                <select
                  value={pauseDurationHours}
                  onChange={(e) => setPauseDurationHours(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-caramel"
                >
                  <option value="1">1 Hour</option>
                  <option value="2">2 Hours</option>
                  <option value="4">4 Hours (Kitchen Rush)</option>
                  <option value="8">8 Hours (End of shift)</option>
                  <option value="24">24 Hours (Full day)</option>
                  <option value="48">48 Hours (2 days)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Customer Banner Message
                </label>
                <input
                  type="text"
                  value={pauseMessage}
                  onChange={(e) => setPauseMessage(e.target.value)}
                  placeholder="Reason displayed on checkout/menu..."
                  className="w-full h-8 px-2.5 rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-caramel"
                />
              </div>

              <button
                type="button"
                disabled={isTogglingPause}
                onClick={() => handleTogglePause(true)}
                className="w-full h-9 rounded-sm bg-amber-700 text-white text-xs font-semibold hover:bg-amber-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isTogglingPause && <RotateCcw className="size-3.5 animate-spin" />}
                <span>Pause Online Orders</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Slot Capacity & Limits */}
        <div className="rounded-sm border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sliders className="size-4 text-caramel" />
            <h3 className="font-heading font-bold text-sm text-foreground">
              Slot Capacities & Timing
            </h3>
          </div>

          {settingsFeedback && (
            <div className="p-2 rounded text-xs bg-emerald-100 text-emerald-900 border border-emerald-200">
              {settingsFeedback}
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Slot Interval
                </label>
                <select
                  value={slotMinutes}
                  onChange={(e) =>
                    setSlotMinutes(parseInt(e.target.value, 10) as 15 | 30 | 60)
                  }
                  className="w-full h-8 px-2.5 rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-caramel"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes (Recommended)</option>
                  <option value={60}>60 Minutes</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Max Orders / Slot
                </label>
                <input
                  type="number"
                  min={0}
                  value={maxOrdersPerSlot}
                  onChange={(e) => setMaxOrdersPerSlot(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-caramel"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Max Custom Cakes / Day
                </label>
                <input
                  type="number"
                  min={0}
                  value={maxCustomPerDay}
                  onChange={(e) => setMaxCustomPerDay(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-caramel"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Cancellation Cutoff (Hrs)
                </label>
                <input
                  type="number"
                  min={0}
                  value={cancelCutoffHours}
                  onChange={(e) => setCancelCutoffHours(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-caramel"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Quote Validity (Hrs)
                </label>
                <input
                  type="number"
                  min={1}
                  value={quoteValidityHours}
                  onChange={(e) => setQuoteValidityHours(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-caramel"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Kitchen Alert (Mins)
                </label>
                <input
                  type="number"
                  min={1}
                  value={pendingAlertMinutes}
                  onChange={(e) => setPendingAlertMinutes(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-caramel"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingSettings}
              className="w-full h-9 rounded-sm bg-caramel text-white font-semibold hover:bg-caramel/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {isSavingSettings && <RotateCcw className="size-3.5 animate-spin" />}
              <span>Save Slot Settings</span>
            </button>
          </form>
        </div>
      </div>

      {/* Special Closures & Regular Hours Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Special Closures Table & Add */}
        <div className="rounded-sm border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-caramel" />
            <h3 className="font-heading font-bold text-sm text-foreground">
              Scheduled Holiday Closures
            </h3>
          </div>

          {closureError && (
            <div className="p-2 rounded text-xs bg-destructive/10 text-destructive border border-destructive/20">
              {closureError}
            </div>
          )}

          {/* Add closure form */}
          <form onSubmit={handleAddClosure} className="flex flex-col sm:flex-row gap-2 text-xs">
            <input
              type="date"
              required
              value={newClosureDate}
              onChange={(e) => setNewClosureDate(e.target.value)}
              className="h-8 px-2.5 rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-caramel"
            />
            <input
              type="text"
              value={newClosureReason}
              onChange={(e) => setNewClosureReason(e.target.value)}
              placeholder="e.g. Ayudha Pooja, Bakery maintenance"
              className="flex-1 h-8 px-2.5 rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-caramel"
            />
            <button
              type="submit"
              disabled={isAddingClosure || !newClosureDate}
              className="h-8 px-3 rounded-sm bg-caramel text-white font-semibold hover:bg-caramel/90 flex items-center justify-center gap-1 disabled:opacity-50"
            >
              {isAddingClosure ? (
                <RotateCcw className="size-3 animate-spin" />
              ) : (
                <Plus className="size-3" />
              )}
              <span>Add</span>
            </button>
          </form>

          {/* Closures table */}
          <div className="rounded-sm border border-border overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground">
                <tr>
                  <th className="py-2 px-3 font-semibold">Date</th>
                  <th className="py-2 px-3 font-semibold">Reason</th>
                  <th className="py-2 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {closures.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-muted-foreground">
                      No special closures scheduled.
                    </td>
                  </tr>
                ) : (
                  closures.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/20">
                      <td className="py-2 px-3 font-mono font-bold text-foreground">
                        {c.closure_date}
                      </td>
                      <td className="py-2 px-3 text-foreground">{c.reason || "Closed"}</td>
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveClosure(c.id)}
                          className="size-7 rounded border border-border inline-flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors"
                          title="Remove closure date"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Regular Operating Hours */}
        <div className="rounded-sm border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-caramel" />
            <h3 className="font-heading font-bold text-sm text-foreground">
              Standard Weekly Operating Hours
            </h3>
          </div>

          <div className="rounded-sm border border-border overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground">
                <tr>
                  <th className="py-2 px-3 font-semibold">Day of Week</th>
                  <th className="py-2 px-3 font-semibold">Opening Time</th>
                  <th className="py-2 px-3 font-semibold">Closing Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {hours.map((h) => (
                  <tr key={h.id} className="hover:bg-muted/20">
                    <td className="py-2 px-3 font-semibold text-foreground">
                      {WEEKDAYS[h.weekday] || `Day ${h.weekday}`}
                    </td>
                    <td className="py-2 px-3 font-mono text-muted-foreground">
                      {h.opens.slice(0, 5)}
                    </td>
                    <td className="py-2 px-3 font-mono text-muted-foreground">
                      {h.closes.slice(0, 5)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
