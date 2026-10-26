import { PRODUCT_IMAGE_MANIFEST } from "./product-images-manifest";
import type { ProductImage } from "./types";

/**
 * Normalizes a category or product identifier to a URL-safe lowercase slug.
 * Safely strips punctuation, spaces, and optional parenthesized modifiers (e.g. "(baby size)", "(junior)").
 */
export function normalizeImageSlug(value: string): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/\s*\([^)]*\)/g, "") // strip parenthesized notes
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Resolves a local optimized WebP image URL for a given category and product slug or name.
 * Returns null if no local asset is found in the manifest.
 */
export function getLocalProductImageUrl(
  categorySlug?: string | null,
  productSlugOrName?: string | null
): string | null {
  if (!categorySlug || !productSlugOrName) return null;

  // Direct lookup first
  const directKey = `${categorySlug}/${productSlugOrName}`;
  if (PRODUCT_IMAGE_MANIFEST[directKey]) {
    return PRODUCT_IMAGE_MANIFEST[directKey];
  }

  // Normalized lookup
  const normCat = normalizeImageSlug(categorySlug);
  const normProd = normalizeImageSlug(productSlugOrName);
  const normKey = `${normCat}/${normProd}`;
  if (PRODUCT_IMAGE_MANIFEST[normKey]) {
    return PRODUCT_IMAGE_MANIFEST[normKey];
  }

  return null;
}

export interface ResolvedProductImage {
  url: string | null;
  alt: string;
  isLocal: boolean;
}

/**
 * Resolves the primary image for a product.
 * Resolution hierarchy:
 * 1. Matching local optimized image (preferred)
 * 2. Supabase storage image from product_images table (fallback)
 * 3. Null (triggers UI icon placeholder)
 */
export function resolvePrimaryProductImage(product: {
  slug?: string;
  name?: string;
  category?: { slug?: string; name?: string } | null;
  product_images?: ProductImage[] | null;
}): ResolvedProductImage {
  const categorySlug = product.category?.slug;
  const localUrl =
    getLocalProductImageUrl(categorySlug, product.slug) ||
    getLocalProductImageUrl(categorySlug, product.name);

  if (localUrl) {
    return {
      url: localUrl,
      alt: `${product.name ?? "Bakery item"} — Handcrafted at Namma Bakery`,
      isLocal: true,
    };
  }

  const primarySupabaseImage =
    product.product_images?.find((img) => img.is_primary) ??
    product.product_images?.[0];

  if (primarySupabaseImage) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const url = primarySupabaseImage.storage_path.startsWith("http")
      ? primarySupabaseImage.storage_path
      : `${supabaseUrl}/storage/v1/object/public/product-images/${primarySupabaseImage.storage_path}`;
    return {
      url,
      alt: primarySupabaseImage.alt_text || product.name || "Bakery item",
      isLocal: false,
    };
  }

  return {
    url: null,
    alt: product.name || "Bakery item",
    isLocal: false,
  };
}

export interface GalleryDisplayImage {
  id: string;
  url: string;
  alt: string;
  isLocal: boolean;
}

/**
 * Resolves the gallery display images for the product detail page.
 * Returns an ordered list:
 * - Local optimized image (if present) as the primary image
 * - Any additional Supabase storage images
 * Returns an empty array if no images exist, prompting the fallback placeholder.
 */
export function resolveGalleryImages(product: {
  slug?: string;
  name?: string;
  category?: { slug?: string } | null;
  product_images?: ProductImage[] | null;
}): GalleryDisplayImage[] {
  const result: GalleryDisplayImage[] = [];
  const categorySlug = product.category?.slug;

  const localUrl =
    getLocalProductImageUrl(categorySlug, product.slug) ||
    getLocalProductImageUrl(categorySlug, product.name);

  if (localUrl) {
    result.push({
      id: "local-primary",
      url: localUrl,
      alt: `${product.name ?? "Bakery item"} — Handcrafted at Namma Bakery`,
      isLocal: true,
    });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (product.product_images && product.product_images.length > 0) {
    for (const img of product.product_images) {
      const url = img.storage_path.startsWith("http")
        ? img.storage_path
        : `${supabaseUrl}/storage/v1/object/public/product-images/${img.storage_path}`;

      // Avoid duplicate URL if storage_path happens to match localUrl
      if (!result.some((r) => r.url === url)) {
        result.push({
          id: img.id,
          url,
          alt: img.alt_text || product.name || "Product photo",
          isLocal: false,
        });
      }
    }
  }

  return result;
}
