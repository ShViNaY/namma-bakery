"use client";

import * as React from "react";
import {
  Plus,
  Edit2,
  Eye,
  EyeOff,
  Archive,
  RotateCcw,
  AlertCircle,
  X,
} from "lucide-react";
import type { AdminCategory } from "@/lib/admin/types";
import {
  upsertCategoryAction,
  toggleCategoryVisibilityAction,
  archiveCategoryAction,
} from "@/lib/admin/actions";
import { generateSlug, type AdminCategoryInput } from "@/lib/admin/validation";

interface AdminCategoriesViewProps {
  categories: AdminCategory[];
  onActionSuccess: () => void;
}

export function AdminCategoriesView({
  categories,
  onActionSuccess,
}: AdminCategoriesViewProps) {
  const [editingCategory, setEditingCategory] = React.useState<AdminCategory | null>(
    null
  );
  const [isCreating, setIsCreating] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Form state
  const [formData, setFormData] = React.useState<AdminCategoryInput>({
    name: "",
    name_kn: "",
    slug: "",
    description: "",
    sort_order: 0,
    is_visible: true,
  });

  const handleOpenCreate = () => {
    setFormData({
      name: "",
      name_kn: "",
      slug: "",
      description: "",
      sort_order: categories.length * 10,
      is_visible: true,
    });
    setErrorMessage(null);
    setIsCreating(true);
    setEditingCategory(null);
  };

  const handleOpenEdit = (cat: AdminCategory) => {
    setFormData({
      id: cat.id,
      name: cat.name,
      name_kn: cat.name_kn || "",
      slug: cat.slug,
      description: cat.description || "",
      sort_order: cat.sort_order,
      is_visible: cat.is_visible,
    });
    setErrorMessage(null);
    setEditingCategory(cat);
    setIsCreating(false);
  };

  const handleCloseModal = () => {
    setIsCreating(false);
    setEditingCategory(null);
    setErrorMessage(null);
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      // Auto-generate slug only when creating new category
      slug: isCreating ? generateSlug(name) : prev.slug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await upsertCategoryAction(formData);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || "Failed to save category.");
      return;
    }

    handleCloseModal();
    onActionSuccess();
  };

  const handleToggleVisibility = async (cat: AdminCategory) => {
    const res = await toggleCategoryVisibilityAction(cat.id, !cat.is_visible);
    if (res.success) {
      onActionSuccess();
    }
  };

  const handleToggleArchive = async (cat: AdminCategory) => {
    const isArchived = Boolean(cat.archived_at);
    const res = await archiveCategoryAction(cat.id, !isArchived);
    if (res.success) {
      onActionSuccess();
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">
            Menu Categories
          </h2>
          <p className="text-xs text-muted-foreground">
            Manage product categories, display sequence, and menu visibility.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="h-9 px-3 rounded-sm bg-caramel text-white text-xs font-semibold hover:bg-caramel/90 transition-colors flex items-center gap-1.5"
        >
          <Plus className="size-3.5" />
          <span>New Category</span>
        </button>
      </div>

      {/* Category List Table */}
      <div className="rounded-sm border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 text-muted-foreground">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Order</th>
                <th className="py-2.5 px-3 font-semibold">Category Name</th>
                <th className="py-2.5 px-3 font-semibold">Slug</th>
                <th className="py-2.5 px-3 font-semibold">Products</th>
                <th className="py-2.5 px-3 font-semibold">Visibility</th>
                <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categories.map((cat) => {
                const isArchived = Boolean(cat.archived_at);
                return (
                  <tr
                    key={cat.id}
                    className={`hover:bg-muted/20 ${
                      isArchived ? "opacity-60 bg-muted/10" : ""
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-muted-foreground">
                      {cat.sort_order}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-foreground">
                        {cat.name}
                        {isArchived && (
                          <span className="ml-2 inline-block px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Archived
                          </span>
                        )}
                      </div>
                      {cat.name_kn && (
                        <div className="text-[11px] text-muted-foreground">
                          {cat.name_kn}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                      {cat.slug}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-muted text-foreground">
                        {cat.product_count ?? 0}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(cat)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                          cat.is_visible
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                        title="Click to toggle public visibility"
                      >
                        {cat.is_visible ? (
                          <>
                            <Eye className="size-3" />
                            <span>Visible</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="size-3" />
                            <span>Hidden</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(cat)}
                          className="size-8 rounded border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Edit Category"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleArchive(cat)}
                          className={`size-8 rounded border border-border bg-background flex items-center justify-center transition-colors ${
                            isArchived
                              ? "text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400"
                              : "text-muted-foreground hover:text-amber-800 hover:bg-amber-50"
                          }`}
                          title={isArchived ? "Restore Category" : "Archive Category"}
                        >
                          {isArchived ? (
                            <RotateCcw className="size-3.5" />
                          ) : (
                            <Archive className="size-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {(isCreating || editingCategory) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-lg rounded-sm border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading font-bold text-base text-foreground">
                {isCreating ? "Create Category" : `Edit "${editingCategory?.name}"`}
              </h3>
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

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Category Name (English) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Traditional Bakes"
                  className="w-full h-9 px-3 rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-caramel"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Kannada Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.name_kn || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name_kn: e.target.value }))
                  }
                  placeholder="e.g. ಪಾರಂಪರಿಕ ತಿಂಡಿಗಳು"
                  className="w-full h-9 px-3 rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-caramel"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  placeholder="e.g. traditional-bakes"
                  className="w-full h-9 px-3 rounded-sm border border-border bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-caramel"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Brief description for menu display..."
                  className="w-full p-2.5 rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-caramel"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sort_order: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                    className="w-full h-9 px-3 rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-caramel"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="cat_is_visible"
                    checked={formData.is_visible}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        is_visible: e.target.checked,
                      }))
                    }
                    className="size-4 rounded border-border text-caramel focus:ring-caramel"
                  />
                  <label
                    htmlFor="cat_is_visible"
                    className="font-semibold text-foreground cursor-pointer select-none"
                  >
                    Visible on Menu
                  </label>
                </div>
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
                  <span>{isCreating ? "Create Category" : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
