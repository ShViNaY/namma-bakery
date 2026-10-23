import { z } from "zod";

/**
 * Reusable slug generator from string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Category validation schema
 */
export const adminCategorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80, "Name cannot exceed 80 characters"),
  name_kn: z.string().trim().max(100).nullable().optional(),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().trim().max(500).nullable().optional(),
  image_path: z.string().trim().max(255).nullable().optional(),
  sort_order: z.coerce.number().int().min(0, "Sort order must be non-negative").default(0),
  is_visible: z.boolean().default(true),
});

export type AdminCategoryInput = z.infer<typeof adminCategorySchema>;

/**
 * Product validation schema
 */
export const adminProductSchema = z
  .object({
    id: z.string().uuid().optional(),
    category_id: z.string().uuid("Please select a valid category"),
    name: z.string().trim().min(2, "Product name must be at least 2 characters").max(100, "Product name cannot exceed 100 characters"),
    name_kn: z.string().trim().max(120).nullable().optional(),
    slug: z
      .string()
      .trim()
      .min(2, "Slug must be at least 2 characters")
      .max(100)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
    description: z.string().trim().max(1500).nullable().optional(),
    kind: z.enum(["SIMPLE", "TIERED_CAKE"]),
    price_tier_id: z.string().uuid("Invalid price tier").nullable().optional(),
    is_available: z.boolean().default(true),
    orderable_online: z.boolean().default(true),
    requires_confirmation: z.boolean().default(true),
    is_featured: z.boolean().default(false),
    is_best_seller: z.boolean().default(false),
    is_new_arrival: z.boolean().default(false),
    is_seasonal: z.boolean().default(false),
    lead_time_minutes: z.coerce.number().int().min(0, "Lead time must be non-negative").default(240),
    sort_order: z.coerce.number().int().min(0, "Sort order must be non-negative").default(0),
  })
  .refine(
    (data) => {
      if (data.kind === "TIERED_CAKE") {
        return Boolean(data.price_tier_id);
      }
      return true;
    },
    {
      message: "Tiered cakes require an assigned price tier",
      path: ["price_tier_id"],
    }
  )
  .refine(
    (data) => {
      if (data.kind === "SIMPLE") {
        return !data.price_tier_id;
      }
      return true;
    },
    {
      message: "Simple products cannot have a price tier assigned",
      path: ["price_tier_id"],
    }
  );

export type AdminProductInput = z.infer<typeof adminProductSchema>;

/**
 * Variant validation schema
 */
export const adminVariantSchema = z.object({
  id: z.string().uuid().optional(),
  product_id: z.string().uuid("Invalid product ID"),
  label: z.string().trim().min(1, "Label is required").max(50, "Label cannot exceed 50 characters"),
  price_paise: z.coerce.number().int("Price must be an integer in paise").positive("Price must be strictly positive"),
  is_available: z.boolean().default(true),
  sort_order: z.coerce.number().int().min(0).default(0),
});

export type AdminVariantInput = z.infer<typeof adminVariantSchema>;

/**
 * Cake Price Tier Rule validation schema
 */
export const adminPriceTierRuleSchema = z.object({
  id: z.string().uuid().optional(),
  tier_id: z.string().uuid("Invalid tier ID"),
  weight_grams: z.coerce.number().int().positive("Weight must be strictly positive"),
  egg_type: z.enum(["EGG", "EGGLESS"]),
  finish: z.enum(["STANDARD", "RICE_PAPER", "SHAPE_CAKE", "GUM_PASTE"]),
  price_paise: z.coerce.number().int("Price must be an integer in paise").positive("Price must be strictly positive"),
  is_active: z.boolean().default(true),
  note: z.string().trim().max(255).nullable().optional(),
});

export type AdminPriceTierRuleInput = z.infer<typeof adminPriceTierRuleSchema>;

/**
 * Store settings validation schema
 */
export const adminStoreSettingsSchema = z.object({
  location_id: z.string().uuid("Invalid location ID"),
  slot_minutes: z.union([z.literal(15), z.literal(30), z.literal(60)]),
  max_orders_per_slot: z.coerce.number().int().min(0, "Capacity must be non-negative"),
  max_custom_per_day: z.coerce.number().int().min(0, "Capacity must be non-negative"),
  quote_validity_hours: z.coerce.number().int().positive("Must be at least 1 hour"),
  cancel_cutoff_hours: z.coerce.number().int().min(0, "Cutoff must be non-negative"),
  pending_alert_minutes: z.coerce.number().int().positive("Alert minutes must be positive"),
});

export type AdminStoreSettingsInput = z.infer<typeof adminStoreSettingsSchema>;

/**
 * Store Pause toggle schema
 */
export const adminPauseStoreSchema = z.object({
  location_id: z.string().uuid("Invalid location ID"),
  is_paused: z.boolean(),
  paused_until: z.string().datetime().nullable().optional(),
  pause_message: z.string().trim().max(255).nullable().optional(),
});

export type AdminPauseStoreInput = z.infer<typeof adminPauseStoreSchema>;

/**
 * Special Closure schema
 */
export const adminSpecialClosureSchema = z.object({
  id: z.string().uuid().optional(),
  location_id: z.string().uuid("Invalid location ID"),
  closure_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be formatted as YYYY-MM-DD"),
  reason: z.string().trim().max(200, "Reason cannot exceed 200 characters").nullable().optional(),
});

export type AdminSpecialClosureInput = z.infer<typeof adminSpecialClosureSchema>;

/**
 * Staff Role update schema
 */
export const adminStaffRoleSchema = z.object({
  user_id: z.string().uuid("Invalid staff user ID"),
  role: z.enum(["EMPLOYEE", "ADMIN"]),
  is_active: z.boolean(),
});

export type AdminStaffRoleInput = z.infer<typeof adminStaffRoleSchema>;
