import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Category, Product, ProductKind } from "./types";

/**
 * Calculates the starting price in paise for a product.
 * - For SIMPLE products: minimum price among available variants (e.g. Regular).
 * - For TIERED_CAKE products: minimum price among active rules in its assigned tier.
 */
export function calculateStartingPricePaise(product: {
  kind: ProductKind;
  product_variants?: { price_paise: number; is_available: boolean }[] | null;
  price_tiers?: {
    price_tier_rules?: { price_paise: number; is_active: boolean }[] | null;
  } | null;
}): number | null {
  if (product.kind === "SIMPLE" && product.product_variants?.length) {
    const available = product.product_variants.filter((v) => v.is_available);
    const pool = available.length > 0 ? available : product.product_variants;
    const prices = pool
      .map((v) => v.price_paise)
      .filter((p) => typeof p === "number" && p > 0);
    return prices.length > 0 ? Math.min(...prices) : null;
  }

  if (
    product.kind === "TIERED_CAKE" &&
    product.price_tiers?.price_tier_rules?.length
  ) {
    const active = product.price_tiers.price_tier_rules.filter(
      (r) => r.is_active
    );
    const pool =
      active.length > 0 ? active : product.price_tiers.price_tier_rules;
    const prices = pool
      .map((r) => r.price_paise)
      .filter((p) => typeof p === "number" && p > 0);
    return prices.length > 0 ? Math.min(...prices) : null;
  }

  return null;
}

/**
 * Fetches all visible, non-archived menu categories ordered by sort_order.
 */
export async function getMenuCategories(): Promise<{
  data: Category[];
  error: Error | null;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select(
        "id, slug, name, name_kn, description, image_path, sort_order, is_visible, archived_at"
      )
      .eq("is_visible", true)
      .is("archived_at", null)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[getMenuCategories] Supabase query error:", error.message);
      return { data: [], error: new Error(error.message) };
    }

    return { data: (data as Category[]) ?? [], error: null };
  } catch (err) {
    console.error("[getMenuCategories] Connection/execution failure:", err);
    return {
      data: [],
      error:
        err instanceof Error
          ? err
          : new Error("Failed to load menu categories"),
    };
  }
}

/**
 * Resolves a single category by its URL slug.
 */
export const getCategoryBySlug = cache(
  async (
    slug: string
  ): Promise<{
    data: Category | null;
    error: Error | null;
  }> => {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("categories")
        .select(
          "id, slug, name, name_kn, description, image_path, sort_order, is_visible, archived_at"
        )
        .eq("slug", slug)
        .eq("is_visible", true)
        .is("archived_at", null)
        .maybeSingle();

      if (error) {
        console.error(
          `[getCategoryBySlug] Supabase query error for slug "${slug}":`,
          error.message
        );
        return { data: null, error: new Error(error.message) };
      }

      return { data: (data as Category) ?? null, error: null };
    } catch (err) {
      console.error(
        `[getCategoryBySlug] Connection/execution failure for slug "${slug}":`,
        err
      );
      return {
        data: null,
        error:
          err instanceof Error ? err : new Error("Failed to load category"),
      };
    }
  }
);

/**
 * Fetches products for the public menu, optionally filtered by category.
 */
export async function getMenuProducts(options?: {
  categoryId?: string;
  categorySlug?: string;
}): Promise<{
  data: Product[];
  error: Error | null;
}> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("products")
      .select(`
        id,
        category_id,
        slug,
        name,
        name_kn,
        description,
        kind,
        price_tier_id,
        is_available,
        orderable_online,
        requires_confirmation,
        is_featured,
        is_best_seller,
        is_new_arrival,
        is_seasonal,
        lead_time_minutes,
        sort_order,
        archived_at,
        category:categories (
          id,
          slug,
          name,
          name_kn
        ),
        product_variants (
          id,
          label,
          price_paise,
          is_available,
          sort_order
        ),
        price_tiers (
          id,
          name,
          price_tier_rules (
            id,
            weight_grams,
            egg_type,
            finish,
            price_paise,
            is_active
          )
        ),
        product_images (
          id,
          storage_path,
          alt_text,
          sort_order,
          is_primary
        )
      `)
      .is("archived_at", null)
      .order("sort_order", { ascending: true });

    if (options?.categoryId) {
      query = query.eq("category_id", options.categoryId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[getMenuProducts] Supabase query error:", error.message);
      return { data: [], error: new Error(error.message) };
    }

    let products = (data as unknown as Product[]) ?? [];

    if (options?.categorySlug) {
      products = products.filter(
        (p) => p.category?.slug === options.categorySlug
      );
    }

    const computed: Product[] = products.map((prod) => ({
      ...prod,
      startingPricePaise: calculateStartingPricePaise(prod),
    }));

    return {
      data: computed,
      error: null,
    };
  } catch (err) {
    console.error("[getMenuProducts] Connection/execution failure:", err);
    return {
      data: [],
      error:
        err instanceof Error ? err : new Error("Failed to load products"),
    };
  }
}

/**
 * Fetches a single active product by its slug and ensures it belongs to the specified category.
 */
export const getProductBySlug = cache(
  async (
    categorySlug: string,
    productSlug: string
  ): Promise<{
    data: Product | null;
    error: Error | null;
  }> => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        category_id,
        slug,
        name,
        name_kn,
        description,
        kind,
        price_tier_id,
        is_available,
        orderable_online,
        requires_confirmation,
        is_featured,
        is_best_seller,
        is_new_arrival,
        is_seasonal,
        lead_time_minutes,
        sort_order,
        archived_at,
        category:categories (
          id,
          slug,
          name,
          name_kn,
          description
        ),
        product_variants (
          id,
          product_id,
          label,
          price_paise,
          is_available,
          sort_order
        ),
        price_tiers (
          id,
          name,
          price_tier_rules (
            id,
            tier_id,
            weight_grams,
            egg_type,
            finish,
            price_paise,
            is_active,
            note
          )
        ),
        product_images (
          id,
          product_id,
          storage_path,
          alt_text,
          sort_order,
          is_primary
        )
      `)
      .eq("slug", productSlug)
      .is("archived_at", null)
      .maybeSingle();

    if (error) {
      console.error(
        `[getProductBySlug] Supabase query error for product "${productSlug}":`,
        error.message
      );
      return { data: null, error: new Error(error.message) };
    }

    if (!data) {
      return { data: null, error: null };
    }

    const product = data as unknown as Product;

    // Verify product belongs to the requested category slug
    if (product.category?.slug !== categorySlug) {
      return { data: null, error: null };
    }

    // Attach computed starting price in paise
    product.startingPricePaise = calculateStartingPricePaise(product);

    // Sort variants by sort_order
    if (product.product_variants) {
      product.product_variants.sort((a, b) => a.sort_order - b.sort_order);
    }

    // Sort images by is_primary desc, then sort_order asc
    if (product.product_images) {
      product.product_images.sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return a.sort_order - b.sort_order;
      });
    }

    return { data: product, error: null };
  } catch (err) {
    console.error(
      `[getProductBySlug] Connection/execution failure for product "${productSlug}":`,
      err
    );
    return {
      data: null,
      error:
        err instanceof Error ? err : new Error("Failed to load product"),
    };
  }
}
);

