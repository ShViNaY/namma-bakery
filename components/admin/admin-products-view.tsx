"use client";

import * as React from "react";
import {
  Plus,
  Search,
  Edit2,
  Archive,
  RotateCcw,
  Layers,
  AlertCircle,
  X,
} from "lucide-react";
import type {
  AdminProduct,
  AdminCategory,
  AdminPriceTierWithRules,
} from "@/lib/admin/types";
import {
  upsertProductAction,
  toggleProductAvailabilityAction,
  archiveProductAction,
} from "@/lib/admin/actions";
import { AdminVariantsModal } from "./admin-variants-modal";
import { generateSlug, type AdminProductInput } from "@/lib/admin/validation";

interface AdminProductsViewProps {
  products: AdminProduct[];
  categories: AdminCategory[];
  priceTiers: AdminPriceTierWithRules[];
  onActionSuccess: () => void;
}

export function AdminProductsView({
  products,
  categories,
  priceTiers,
  onActionSuccess,
}: AdminProductsViewProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");
  const [statusFilter, setStatusFilter] = React.useState<
    "ALL" | "AVAILABLE" | "SOLD_OUT" | "ARCHIVED"
  >("ALL");

  // Edit / Create state
  const [isCreating, setIsCreating] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<AdminProduct | null>(
    null
  );
  const [variantsModalProduct, setVariantsModalProduct] =
    React.useState<AdminProduct | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Form State
  const [formData, setFormData] = React.useState<AdminProductInput>({
    category_id: categories[0]?.id || "",
    name: "",
    name_kn: "",
    slug: "",
    description: "",
    kind: "SIMPLE",
    price_tier_id: null,
    is_available: true,
    orderable_online: true,
    requires_confirmation: true,
    is_featured: false,
    is_best_seller: false,
    is_new_arrival: false,
    is_seasonal: false,
    lead_time_minutes: 240,
    sort_order: 0,
  });

  const handleOpenCreate = () => {
    setFormData({
      category_id: categories[0]?.id || "",
      name: "",
      name_kn: "",
      slug: "",
      description: "",
      kind: "SIMPLE",
      price_tier_id: null,
      is_available: true,
      orderable_online: true,
      requires_confirmation: true,
      is_featured: false,
      is_best_seller: false,
      is_new_arrival: false,
      is_seasonal: false,
      lead_time_minutes: 240,
      sort_order: products.length * 10,
    });
    setErrorMessage(null);
    setIsCreating(true);
    setEditingProduct(null);
  };

  const handleOpenEdit = (prod: AdminProduct) => {
    setFormData({
      id: prod.id,
      category_id: prod.category_id,
      name: prod.name,
      name_kn: prod.name_kn || "",
      slug: prod.slug,
      description: prod.description || "",
      kind: prod.kind,
      price_tier_id: prod.price_tier_id || null,
      is_available: prod.is_available,
      orderable_online: prod.orderable_online,
      requires_confirmation: prod.requires_confirmation,
      is_featured: prod.is_featured,
      is_best_seller: prod.is_best_seller,
      is_new_arrival: prod.is_new_arrival,
      is_seasonal: prod.is_seasonal,
      lead_time_minutes: prod.lead_time_minutes,
      sort_order: prod.sort_order,
    });
    setErrorMessage(null);
    setEditingProduct(prod);
    setIsCreating(false);
  };

  const handleCloseModal = () => {
    setIsCreating(false);
    setEditingProduct(null);
    setErrorMessage(null);
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: isCreating ? generateSlug(name) : prev.slug,
    }));
  };

  const handleKindChange = (kind: "SIMPLE" | "TIERED_CAKE") => {
    setFormData((prev) => ({
      ...prev,
      kind,
      price_tier_id:
        kind === "TIERED_CAKE"
          ? prev.price_tier_id || priceTiers[0]?.id || null
          : null,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await upsertProductAction(formData);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || "Failed to save product.");
      return;
    }

    handleCloseModal();
    onActionSuccess();
  };

  const handleToggleAvailability = async (prod: AdminProduct) => {
    const res = await toggleProductAvailabilityAction(prod.id, !prod.is_available);
    if (res.success) {
      onActionSuccess();
    }
  };

  const handleToggleArchive = async (prod: AdminProduct) => {
    const isArchived = Boolean(prod.archived_at);
    const res = await archiveProductAction(prod.id, !isArchived);
    if (res.success) {
      onActionSuccess();
    }
  };

  // Filter products
  const filteredProducts = React.useMemo(() => {
    return products.filter((prod) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = prod.name.toLowerCase().includes(query);
        const matchesKn = prod.name_kn?.toLowerCase().includes(query);
        const matchesSlug = prod.slug.toLowerCase().includes(query);
        if (!matchesName && !matchesKn && !matchesSlug) return false;
      }

      // Category
      if (selectedCategory !== "ALL" && prod.category_id !== selectedCategory) {
        return false;
      }

      // Status
      const isArchived = Boolean(prod.archived_at);
      if (statusFilter === "AVAILABLE") return prod.is_available && !isArchived;
      if (statusFilter === "SOLD_OUT") return !prod.is_available && !isArchived;
      if (statusFilter === "ARCHIVED") return isArchived;

      return true;
    });
  }, [products, searchQuery, selectedCategory, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">
            Product Catalog
          </h2>
          <p className="text-xs text-muted-foreground">
            Manage individual baked goods, daily availability, and variants.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="h-9 px-3 rounded-sm bg-caramel text-white text-xs font-semibold hover:bg-caramel/90 transition-colors flex items-center gap-1.5"
        >
          <Plus className="size-3.5" />
          <span>New Product</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-sm border border-border bg-card p-3 flex flex-col md:flex-row items-stretch md:items-center gap-2.5 text-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name or slug..."
            className="w-full h-8 pl-8 pr-3 rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-caramel"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="h-8 px-2.5 rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-caramel"
        >
          <option value="ALL">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="h-8 px-2.5 rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-caramel"
        >
          <option value="ALL">All Statuses</option>
          <option value="AVAILABLE">Available Now</option>
          <option value="SOLD_OUT">Marked Sold Out</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="rounded-sm border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 text-muted-foreground">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Order</th>
                <th className="py-2.5 px-3 font-semibold">Product</th>
                <th className="py-2.5 px-3 font-semibold">Category</th>
                <th className="py-2.5 px-3 font-semibold">Kind / Pricing</th>
                <th className="py-2.5 px-3 font-semibold">Flags</th>
                <th className="py-2.5 px-3 font-semibold">Availability</th>
                <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    No products found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const isArchived = Boolean(prod.archived_at);
                  const isTiered = prod.kind === "TIERED_CAKE";

                  return (
                    <tr
                      key={prod.id}
                      className={`hover:bg-muted/20 ${
                        isArchived ? "opacity-60 bg-muted/10" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-muted-foreground">
                        {prod.sort_order}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-foreground">
                          {prod.name}
                          {isArchived && (
                            <span className="ml-1.5 inline-block px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              Archived
                            </span>
                          )}
                        </div>
                        {prod.name_kn && (
                          <div className="text-[11px] text-muted-foreground">
                            {prod.name_kn}
                          </div>
                        )}
                        <div className="font-mono text-[10px] text-muted-foreground">
                          /{prod.slug}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-foreground">
                        {prod.category?.name || "—"}
                      </td>
                      <td className="py-2.5 px-3">
                        {isTiered ? (
                          <div>
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                              Tiered Cake
                            </span>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {prod.price_tiers?.name || "Standard Tier"}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-muted text-foreground">
                              Simple ({prod.product_variants?.length ?? 0} variants)
                            </span>
                            <button
                              type="button"
                              onClick={() => setVariantsModalProduct(prod)}
                              className="block text-[11px] text-caramel hover:underline mt-0.5"
                            >
                              Manage variants
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-1 max-w-[140px]">
                          {prod.is_featured && (
                            <span className="px-1 rounded text-[9px] bg-amber-100 text-amber-900">
                              Featured
                            </span>
                          )}
                          {prod.is_best_seller && (
                            <span className="px-1 rounded text-[9px] bg-emerald-100 text-emerald-900">
                              Bestseller
                            </span>
                          )}
                          {prod.is_new_arrival && (
                            <span className="px-1 rounded text-[9px] bg-blue-100 text-blue-900">
                              New
                            </span>
                          )}
                          {prod.is_seasonal && (
                            <span className="px-1 rounded text-[9px] bg-purple-100 text-purple-900">
                              Seasonal
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <button
                          type="button"
                          onClick={() => handleToggleAvailability(prod)}
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                            prod.is_available
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200"
                              : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                          }`}
                          title="Click to toggle availability"
                        >
                          {prod.is_available ? "Available" : "Sold Out"}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isTiered && (
                            <button
                              type="button"
                              onClick={() => setVariantsModalProduct(prod)}
                              className="size-8 rounded border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              title="Manage Variants"
                            >
                              <Layers className="size-3.5 text-caramel" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(prod)}
                            className="size-8 rounded border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleArchive(prod)}
                            className={`size-8 rounded border border-border bg-background flex items-center justify-center transition-colors ${
                              isArchived
                                ? "text-emerald-700 hover:bg-emerald-50"
                                : "text-muted-foreground hover:text-amber-800 hover:bg-amber-50"
                            }`}
                            title={isArchived ? "Restore Product" : "Archive Product"}
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Create Product Modal */}
      {(isCreating || editingProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-sm border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading font-bold text-base text-foreground">
                {isCreating ? "Add New Product" : `Edit "${editingProduct?.name}"`}
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

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category */}
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        category_id: e.target.value,
                      }))
                    }
                    className="w-full h-9 px-3 rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-caramel"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Product Kind */}
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Product Kind *
                  </label>
                  <select
                    required
                    value={formData.kind}
                    onChange={(e) =>
                      handleKindChange(
                        e.target.value as "SIMPLE" | "TIERED_CAKE"
                      )
                    }
                    className="w-full h-9 px-3 rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-caramel"
                  >
                    <option value="SIMPLE">Simple (Uses Variants)</option>
                    <option value="TIERED_CAKE">
                      Tiered Cake (Uses Price Tier Rules)
                    </option>
                  </select>
                </div>
              </div>

              {/* Tier Selection if TIERED_CAKE */}
              {formData.kind === "TIERED_CAKE" && (
                <div className="p-3 rounded-sm border border-amber-300/60 bg-amber-50/50 dark:bg-amber-950/20">
                  <label className="block font-semibold text-foreground mb-1">
                    Assigned Cake Price Tier *
                  </label>
                  <select
                    required
                    value={formData.price_tier_id || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price_tier_id: e.target.value || null,
                      }))
                    }
                    className="w-full h-9 px-3 rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-caramel"
                  >
                    {priceTiers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.price_tier_rules?.length ?? 0} price rules)
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Prices for weight, egg type, and finish are defined centrally under Cake Tiers.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Product Name */}
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Product Name (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Classic Honey Cake"
                    className="w-full h-9 px-3 rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-caramel"
                  />
                </div>

                {/* Kannada Name */}
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Kannada Name
                  </label>
                  <input
                    type="text"
                    value={formData.name_kn || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        name_kn: e.target.value,
                      }))
                    }
                    placeholder="e.g. ಜೇನು ಕೇಕ್"
                    className="w-full h-9 px-3 rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-caramel"
                  />
                </div>
              </div>

              {/* Slug */}
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
                  className="w-full h-9 px-3 rounded-sm border border-border bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-caramel"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Ingredients, heritage notes, allergen info..."
                  className="w-full p-2.5 rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-caramel"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Lead Time (mins) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.lead_time_minutes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        lead_time_minutes: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                    className="w-full h-9 px-3 rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-caramel"
                  />
                </div>

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

                <div className="col-span-2 sm:col-span-1 flex flex-col justify-end">
                  <label className="flex items-center gap-2 pb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_available}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          is_available: e.target.checked,
                        }))
                      }
                      className="size-4 rounded text-caramel focus:ring-caramel"
                    />
                    <span className="font-semibold text-foreground">
                      Available for Sale
                    </span>
                  </label>
                </div>
              </div>

              {/* Flags & Toggles */}
              <div className="rounded-sm border border-border p-3 space-y-2 bg-muted/20">
                <span className="font-semibold text-foreground block mb-1">
                  Product Flags & Online Settings
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.orderable_online}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          orderable_online: e.target.checked,
                        }))
                      }
                      className="size-3.5 rounded text-caramel"
                    />
                    <span>Orderable Online</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requires_confirmation}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          requires_confirmation: e.target.checked,
                        }))
                      }
                      className="size-3.5 rounded text-caramel"
                    />
                    <span>Requires Confirmation</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          is_featured: e.target.checked,
                        }))
                      }
                      className="size-3.5 rounded text-caramel"
                    />
                    <span>Featured</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_best_seller}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          is_best_seller: e.target.checked,
                        }))
                      }
                      className="size-3.5 rounded text-caramel"
                    />
                    <span>Best Seller</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_new_arrival}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          is_new_arrival: e.target.checked,
                        }))
                      }
                      className="size-3.5 rounded text-caramel"
                    />
                    <span>New Arrival</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_seasonal}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          is_seasonal: e.target.checked,
                        }))
                      }
                      className="size-3.5 rounded text-caramel"
                    />
                    <span>Seasonal</span>
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
                  {isSubmitting && (
                    <RotateCcw className="size-3.5 animate-spin" />
                  )}
                  <span>{isCreating ? "Create Product" : "Save Product"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Variants Management Modal (for simple products) */}
      {variantsModalProduct && (
        <AdminVariantsModal
          product={variantsModalProduct}
          onClose={() => setVariantsModalProduct(null)}
          onSuccess={onActionSuccess}
        />
      )}
    </div>
  );
}
