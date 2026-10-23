"use client";

import * as React from "react";
import { X, Plus, RotateCcw, AlertCircle, Archive } from "lucide-react";
import type { AdminProduct } from "@/lib/admin/types";
import type { ProductVariant } from "@/lib/menu/types";
import {
  upsertVariantAction,
  toggleVariantAvailabilityAction,
  archiveVariantAction,
} from "@/lib/admin/actions";
import { formatPaise } from "@/lib/utils/money";

interface AdminVariantsModalProps {
  product: AdminProduct;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminVariantsModal({
  product,
  onClose,
  onSuccess,
}: AdminVariantsModalProps) {
  const [variants, setVariants] = React.useState<ProductVariant[]>(
    product.product_variants ?? []
  );
  const [newLabel, setNewLabel] = React.useState("");
  const [newPriceRupees, setNewPriceRupees] = React.useState("");
  const [newSortOrder, setNewSortOrder] = React.useState(
    (product.product_variants?.length ?? 0) * 10
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const priceNum = parseFloat(newPriceRupees);
    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMessage("Price must be greater than ₹0.");
      return;
    }

    const price_paise = Math.round(priceNum * 100);

    setIsSubmitting(true);
    const res = await upsertVariantAction({
      product_id: product.id,
      label: newLabel.trim(),
      price_paise,
      is_available: true,
      sort_order: newSortOrder,
    });
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || "Failed to add variant.");
      return;
    }

    setNewLabel("");
    setNewPriceRupees("");
    setNewSortOrder((prev) => prev + 10);
    onSuccess();
  };

  const handleToggleAvailability = async (variant: ProductVariant) => {
    const res = await toggleVariantAvailabilityAction(
      variant.id,
      !variant.is_available
    );
    if (res.success) {
      setVariants((prev) =>
        prev.map((v) =>
          v.id === variant.id ? { ...v, is_available: !v.is_available } : v
        )
      );
      onSuccess();
    }
  };

  const handleArchive = async (variant: ProductVariant) => {
    const isArchived = Boolean(variant.archived_at);
    const res = await archiveVariantAction(variant.id, !isArchived);
    if (res.success) {
      setVariants((prev) =>
        prev.map((v) =>
          v.id === variant.id
            ? { ...v, archived_at: isArchived ? null : new Date().toISOString() }
            : v
        )
      );
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-lg rounded-sm border border-border bg-card p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="font-heading font-bold text-base text-foreground">
              Manage Variants
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Product: <span className="font-semibold text-foreground">{product.name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
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

        {/* Existing variants table */}
        <div className="rounded-sm border border-border overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground">
              <tr>
                <th className="py-2 px-3 font-semibold">Variant</th>
                <th className="py-2 px-3 font-semibold">Price</th>
                <th className="py-2 px-3 font-semibold">Status</th>
                <th className="py-2 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {variants.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-muted-foreground">
                    No variants defined yet. Add the first variant below.
                  </td>
                </tr>
              ) : (
                variants.map((v) => {
                  const isArchived = Boolean(v.archived_at);
                  return (
                    <tr
                      key={v.id}
                      className={`hover:bg-muted/20 ${
                        isArchived ? "opacity-60 bg-muted/10" : ""
                      }`}
                    >
                      <td className="py-2 px-3 font-medium text-foreground">
                        {v.label}
                        {isArchived && (
                          <span className="ml-1.5 inline-block text-[10px] px-1 bg-muted text-muted-foreground rounded">
                            Archived
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-bold text-foreground">
                        {formatPaise(v.price_paise)}
                      </td>
                      <td className="py-2 px-3">
                        <button
                          type="button"
                          onClick={() => handleToggleAvailability(v)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                            v.is_available
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {v.is_available ? "Available" : "Sold Out"}
                        </button>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleArchive(v)}
                          className={`size-7 rounded border border-border flex items-center justify-center transition-colors ${
                            isArchived
                              ? "text-emerald-700 hover:bg-emerald-50"
                              : "text-muted-foreground hover:bg-muted"
                          }`}
                          title={isArchived ? "Restore Variant" : "Archive Variant"}
                        >
                          {isArchived ? (
                            <RotateCcw className="size-3" />
                          ) : (
                            <Archive className="size-3" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Add new variant form */}
        <form onSubmit={handleAddVariant} className="space-y-3 pt-2 border-t border-border">
          <p className="text-xs font-semibold text-foreground">Add New Variant</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="col-span-1">
              <label className="block text-muted-foreground mb-1">Label *</label>
              <input
                type="text"
                required
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. Pack of 4"
                className="w-full h-8 px-2.5 rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-caramel"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-muted-foreground mb-1">Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={newPriceRupees}
                onChange={(e) => setNewPriceRupees(e.target.value)}
                placeholder="e.g. 150"
                className="w-full h-8 px-2.5 rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-caramel"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-muted-foreground mb-1">Sort Order</label>
              <input
                type="number"
                value={newSortOrder}
                onChange={(e) => setNewSortOrder(parseInt(e.target.value, 10) || 0)}
                className="w-full h-8 px-2.5 rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-caramel"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-8 px-3 rounded-sm bg-caramel text-white text-xs font-semibold hover:bg-caramel/90 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <RotateCcw className="size-3 animate-spin" />
              ) : (
                <Plus className="size-3" />
              )}
              <span>Add Variant</span>
            </button>
          </div>
        </form>

        <div className="flex justify-end pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-3 rounded-sm border border-border bg-background text-xs font-semibold text-foreground hover:bg-muted"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
