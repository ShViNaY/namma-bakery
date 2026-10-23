"use client";

import * as React from "react";
import {
  ShieldCheck,
  User,
  RotateCcw,
  AlertCircle,
  X,
  Phone,
  AlertTriangle,
} from "lucide-react";
import type { AdminStaffMember, StaffRole } from "@/lib/admin/types";
import { updateStaffRoleAction } from "@/lib/admin/actions";
import { formatIstDateTime } from "@/lib/utils/date";

interface AdminStaffViewProps {
  staff: AdminStaffMember[];
  currentUserEmail?: string | null;
  currentUserId?: string | null;
  onActionSuccess: () => void;
}

export function AdminStaffView({
  staff,
  currentUserEmail,
  currentUserId,
  onActionSuccess,
}: AdminStaffViewProps) {
  const [selectedStaff, setSelectedStaff] = React.useState<AdminStaffMember | null>(
    null
  );
  const [targetRole, setTargetRole] = React.useState<StaffRole>("EMPLOYEE");
  const [targetIsActive, setTargetIsActive] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const activeAdminCount = React.useMemo(() => {
    return staff.filter((s) => s.role === "ADMIN" && s.is_active).length;
  }, [staff]);

  const handleOpenEdit = (member: AdminStaffMember) => {
    setSelectedStaff(member);
    setTargetRole(member.role);
    setTargetIsActive(member.is_active);
    setErrorMessage(null);
  };

  const handleCloseModal = () => {
    setSelectedStaff(null);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const isTargetSelf = selectedStaff.user_id === currentUserId;
    const isRemovingAdmin =
      selectedStaff.role === "ADMIN" &&
      (targetRole !== "ADMIN" || !targetIsActive);

    if (isTargetSelf && isRemovingAdmin && activeAdminCount <= 1) {
      setIsSubmitting(false);
      setErrorMessage(
        "Self-lockout safeguard: You are currently the only active administrator. You must designate another active administrator first."
      );
      return;
    }

    const res = await updateStaffRoleAction({
      user_id: selectedStaff.user_id,
      role: targetRole,
      is_active: targetIsActive,
    });
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || "Failed to update staff member.");
      return;
    }

    handleCloseModal();
    onActionSuccess();
  };

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">
            Staff & Authorization Management
          </h2>
          <p className="text-xs text-muted-foreground">
            View bakery team accounts, grant administrative access, or suspend staff memberships.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs text-muted-foreground">
          {currentUserEmail && (
            <span>Logged in as: <strong className="text-foreground">{currentUserEmail}</strong></span>
          )}
          <span className="hidden sm:inline">·</span>
          <span>
            Active Admins: <strong className="text-foreground">{activeAdminCount}</strong>
          </span>
        </div>
      </div>

      {/* Staff directory table */}
      <div className="rounded-sm border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 text-muted-foreground">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Staff Member</th>
                <th className="py-2.5 px-3 font-semibold">Phone</th>
                <th className="py-2.5 px-3 font-semibold">Role</th>
                <th className="py-2.5 px-3 font-semibold">Membership</th>
                <th className="py-2.5 px-3 font-semibold">Joined (IST)</th>
                <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {staff.map((member) => {
                const isSelf = member.user_id === currentUserId;

                return (
                  <tr
                    key={member.user_id}
                    className={`hover:bg-muted/20 ${
                      !member.is_active ? "opacity-60 bg-muted/10" : ""
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`size-7 rounded-sm flex items-center justify-center ${
                            member.role === "ADMIN"
                              ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {member.role === "ADMIN" ? (
                            <ShieldCheck className="size-4" />
                          ) : (
                            <User className="size-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            <span>{member.full_name || "Bakery Staff Member"}</span>
                            {isSelf && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-caramel/15 text-caramel">
                                You
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[10px] text-muted-foreground truncate max-w-[150px]">
                            {member.user_id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-muted-foreground">
                      {member.phone ? (
                        <div className="flex items-center gap-1">
                          <Phone className="size-3 text-muted-foreground" />
                          <span>{member.phone}</span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                          member.role === "ADMIN"
                            ? "border border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {member.role}
                      </span>
                    </td>

                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          member.is_active
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {member.is_active ? "Active" : "Suspended"}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                      {formatIstDateTime(member.created_at)}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(member)}
                        className="h-7 px-2.5 rounded border border-border bg-background text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                      >
                        Edit Role
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Staff Role Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-md rounded-sm border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-heading font-bold text-base text-foreground">
                  Update Staff Privileges
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Member:{" "}
                  <strong className="text-foreground">
                    {selectedStaff.full_name || selectedStaff.user_id.slice(0, 8)}
                  </strong>
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 p-2.5 rounded text-xs bg-destructive/10 text-destructive border border-destructive/20">
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {selectedStaff.user_id === currentUserId && (
              <div className="flex items-start gap-2 p-2.5 rounded text-xs bg-amber-50 text-amber-950 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-200">
                <AlertTriangle className="size-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Note:</strong> You are modifying your own account. Demoting or deactivating your own account will immediately revoke your administrative privileges upon saving.
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Assigned Staff Role *
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value as StaffRole)}
                  className="w-full h-9 px-3 rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-caramel"
                >
                  <option value="EMPLOYEE">
                    EMPLOYEE (Standard Staff / Kitchen Queue Only)
                  </option>
                  <option value="ADMIN">
                    ADMIN (Full Store Operations & Catalog Access)
                  </option>
                </select>
                <p className="text-[11px] text-muted-foreground mt-1">
                  EMPLOYEE users can only view and manage orders and custom cakes under /staff.
                </p>
              </div>

              <div className="p-3 rounded-sm border border-border bg-muted/20">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={targetIsActive}
                    onChange={(e) => setTargetIsActive(e.target.checked)}
                    className="size-4 rounded text-caramel focus:ring-caramel"
                  />
                  <div>
                    <span className="font-semibold text-foreground block">
                      Active Staff Membership
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      Deactivating will immediately lock the user out of all internal bakery portals.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="h-9 px-3 rounded-sm border border-border bg-background text-foreground font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-9 px-4 rounded-sm bg-caramel text-white font-semibold hover:bg-caramel/90 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting && <RotateCcw className="size-3.5 animate-spin" />}
                  <span>Save Privileges</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
