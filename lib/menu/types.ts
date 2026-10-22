/**
 * Types representing the Namma Bakery menu and catalog domain.
 * Derived directly from the Supabase PostgreSQL database schema.
 */

export type ProductKind = "SIMPLE" | "TIERED_CAKE";
export type EggType = "EGG" | "EGGLESS";
export type CakeFinish = "STANDARD" | "RICE_PAPER" | "SHAPE_CAKE" | "GUM_PASTE";

export interface Category {
  id: string;
  slug: string;
  name: string;
  name_kn: string | null;
  description: string | null;
  image_path: string | null;
  sort_order: number;
  is_visible: boolean;
  archived_at: string | null;
  created_at?: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  label: string;
  price_paise: number;
  is_available: boolean;
  sort_order: number;
  archived_at: string | null;
}

export interface PriceTierRule {
  id: string;
  tier_id: string;
  weight_grams: number;
  egg_type: EggType;
  finish: CakeFinish;
  price_paise: number;
  is_active: boolean;
  verified?: boolean;
  note?: string | null;
}

export interface PriceTier {
  id: string;
  name: string;
  sort_order: number;
  price_tier_rules?: PriceTierRule[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  storage_path: string;
  alt_text: string;
  sort_order: number;
  is_primary: boolean;
}

export interface Product {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  name_kn: string | null;
  description: string | null;
  kind: ProductKind;
  price_tier_id: string | null;
  is_available: boolean;
  orderable_online: boolean;
  requires_confirmation: boolean;
  is_featured: boolean;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  is_seasonal: boolean;
  lead_time_minutes: number;
  sort_order: number;
  archived_at: string | null;

  // Joined relations
  category?: Category | null;
  product_variants?: ProductVariant[];
  price_tiers?: PriceTier | null;
  product_images?: ProductImage[];

  // Computed starting price
  startingPricePaise?: number | null;
}
