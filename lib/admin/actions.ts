"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertAdminSession } from "./auth";
import {
  adminCategorySchema,
  adminProductSchema,
  adminVariantSchema,
  adminPriceTierRuleSchema,
  adminStoreSettingsSchema,
  adminPauseStoreSchema,
  adminSpecialClosureSchema,
  adminStaffRoleSchema,
  type AdminCategoryInput,
  type AdminProductInput,
  type AdminVariantInput,
  type AdminPriceTierRuleInput,
  type AdminStoreSettingsInput,
  type AdminPauseStoreInput,
  type AdminSpecialClosureInput,
  type AdminStaffRoleInput,
} from "./validation";

export interface AdminActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

// ---------------------------------------------------------------- CATEGORIES

export async function upsertCategoryAction(
  rawInput: AdminCategoryInput
): Promise<AdminActionResult<{ id: string }>> {
  try {
    await assertAdminSession();

    const parsed = adminCategorySchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid category data.",
      };
    }

    const { id, ...data } = parsed.data;
    const supabase = await createClient();

    if (id) {
      const { error } = await supabase
        .from("categories")
        .update({
          name: data.name,
          name_kn: data.name_kn || null,
          slug: data.slug,
          description: data.description || null,
          image_path: data.image_path || null,
          sort_order: data.sort_order,
          is_visible: data.is_visible,
        })
        .eq("id", id);

      if (error) {
        return { success: false, error: error.message };
      }
      revalidatePath("/admin");
      revalidatePath("/menu");
      return { success: true, data: { id } };
    } else {
      const { data: inserted, error } = await supabase
        .from("categories")
        .insert({
          name: data.name,
          name_kn: data.name_kn || null,
          slug: data.slug,
          description: data.description || null,
          image_path: data.image_path || null,
          sort_order: data.sort_order,
          is_visible: data.is_visible,
        })
        .select("id")
        .single();

      if (error || !inserted) {
        return { success: false, error: error?.message || "Failed to create category." };
      }
      revalidatePath("/admin");
      revalidatePath("/menu");
      return { success: true, data: { id: inserted.id } };
    }
  } catch (err) {
    console.error("[upsertCategoryAction] Error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save category.",
    };
  }
}

export async function toggleCategoryVisibilityAction(
  categoryId: string,
  isVisible: boolean
): Promise<AdminActionResult> {
  try {
    await assertAdminSession();
    const supabase = await createClient();

    const { error } = await supabase
      .from("categories")
      .update({ is_visible: isVisible })
      .eq("id", categoryId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin");
    revalidatePath("/menu");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to toggle category visibility.",
    };
  }
}

export async function archiveCategoryAction(
  categoryId: string,
  isArchived: boolean
): Promise<AdminActionResult> {
  try {
    await assertAdminSession();
    const supabase = await createClient();

    const { error } = await supabase
      .from("categories")
      .update({ archived_at: isArchived ? new Date().toISOString() : null })
      .eq("id", categoryId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin");
    revalidatePath("/menu");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update category archive status.",
    };
  }
}

// ---------------------------------------------------------------- PRODUCTS

export async function upsertProductAction(
  rawInput: AdminProductInput
): Promise<AdminActionResult<{ id: string }>> {
  try {
    await assertAdminSession();

    const parsed = adminProductSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid product data.",
      };
    }

    const { id, ...data } = parsed.data;
    const supabase = await createClient();

    const payload = {
      category_id: data.category_id,
      name: data.name,
      name_kn: data.name_kn || null,
      slug: data.slug,
      description: data.description || null,
      kind: data.kind,
      price_tier_id: data.kind === "TIERED_CAKE" ? data.price_tier_id : null,
      is_available: data.is_available,
      orderable_online: data.orderable_online,
      requires_confirmation: data.requires_confirmation,
      is_featured: data.is_featured,
      is_best_seller: data.is_best_seller,
      is_new_arrival: data.is_new_arrival,
      is_seasonal: data.is_seasonal,
      lead_time_minutes: data.lead_time_minutes,
      sort_order: data.sort_order,
    };

    if (id) {
      const { error } = await supabase.from("products").update(payload).eq("id", id);
      if (error) {
        return { success: false, error: error.message };
      }
      revalidatePath("/admin");
      revalidatePath("/menu");
      return { success: true, data: { id } };
    } else {
      const { data: inserted, error } = await supabase
        .from("products")
        .insert(payload)
        .select("id")
        .single();

      if (error || !inserted) {
        return { success: false, error: error?.message || "Failed to create product." };
      }
      revalidatePath("/admin");
      revalidatePath("/menu");
      return { success: true, data: { id: inserted.id } };
    }
  } catch (err) {
    console.error("[upsertProductAction] Error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save product.",
    };
  }
}

export async function toggleProductAvailabilityAction(
  productId: string,
  isAvailable: boolean
): Promise<AdminActionResult> {
  try {
    await assertAdminSession();
    const supabase = await createClient();

    // Call stored RPC or update directly
    const { error: rpcError } = await supabase.rpc("set_product_availability", {
      p_product_id: productId,
      p_available: isAvailable,
    });

    if (rpcError) {
      const { error } = await supabase
        .from("products")
        .update({ is_available: isAvailable })
        .eq("id", productId);
      if (error) return { success: false, error: error.message };
    }

    revalidatePath("/admin");
    revalidatePath("/menu");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to toggle product availability.",
    };
  }
}

export async function archiveProductAction(
  productId: string,
  isArchived: boolean
): Promise<AdminActionResult> {
  try {
    await assertAdminSession();
    const supabase = await createClient();

    const { error } = await supabase
      .from("products")
      .update({ archived_at: isArchived ? new Date().toISOString() : null })
      .eq("id", productId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin");
    revalidatePath("/menu");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update product archive status.",
    };
  }
}

// ---------------------------------------------------------------- VARIANTS

export async function upsertVariantAction(
  rawInput: AdminVariantInput
): Promise<AdminActionResult<{ id: string }>> {
  try {
    await assertAdminSession();

    const parsed = adminVariantSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid variant data.",
      };
    }

    const { id, ...data } = parsed.data;
    const supabase = await createClient();

    if (id) {
      const { error } = await supabase
        .from("product_variants")
        .update({
          label: data.label,
          price_paise: data.price_paise,
          is_available: data.is_available,
          sort_order: data.sort_order,
        })
        .eq("id", id);

      if (error) return { success: false, error: error.message };
      revalidatePath("/admin");
      revalidatePath("/menu");
      return { success: true, data: { id } };
    } else {
      const { data: inserted, error } = await supabase
        .from("product_variants")
        .insert({
          product_id: data.product_id,
          label: data.label,
          price_paise: data.price_paise,
          is_available: data.is_available,
          sort_order: data.sort_order,
        })
        .select("id")
        .single();

      if (error || !inserted) {
        return { success: false, error: error?.message || "Failed to add variant." };
      }
      revalidatePath("/admin");
      revalidatePath("/menu");
      return { success: true, data: { id: inserted.id } };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save variant.",
    };
  }
}

export async function toggleVariantAvailabilityAction(
  variantId: string,
  isAvailable: boolean
): Promise<AdminActionResult> {
  try {
    await assertAdminSession();
    const supabase = await createClient();

    const { error: rpcError } = await supabase.rpc("set_variant_availability", {
      p_variant_id: variantId,
      p_available: isAvailable,
    });

    if (rpcError) {
      const { error } = await supabase
        .from("product_variants")
        .update({ is_available: isAvailable })
        .eq("id", variantId);
      if (error) return { success: false, error: error.message };
    }

    revalidatePath("/admin");
    revalidatePath("/menu");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to toggle variant availability.",
    };
  }
}

export async function archiveVariantAction(
  variantId: string,
  isArchived: boolean
): Promise<AdminActionResult> {
  try {
    await assertAdminSession();
    const supabase = await createClient();

    const { error } = await supabase
      .from("product_variants")
      .update({ archived_at: isArchived ? new Date().toISOString() : null })
      .eq("id", variantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin");
    revalidatePath("/menu");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update variant archive status.",
    };
  }
}

// ---------------------------------------------------------------- CAKE TIER RULES

export async function upsertPriceTierRuleAction(
  rawInput: AdminPriceTierRuleInput
): Promise<AdminActionResult<{ id: string }>> {
  try {
    await assertAdminSession();

    const parsed = adminPriceTierRuleSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid price tier rule data.",
      };
    }

    const { id, ...data } = parsed.data;
    const supabase = await createClient();

    if (id) {
      const { error } = await supabase
        .from("price_tier_rules")
        .update({
          price_paise: data.price_paise,
          is_active: data.is_active,
          note: data.note || null,
        })
        .eq("id", id);

      if (error) return { success: false, error: error.message };
      revalidatePath("/admin");
      revalidatePath("/menu");
      return { success: true, data: { id } };
    } else {
      const { data: inserted, error } = await supabase
        .from("price_tier_rules")
        .insert({
          tier_id: data.tier_id,
          weight_grams: data.weight_grams,
          egg_type: data.egg_type,
          finish: data.finish,
          price_paise: data.price_paise,
          is_active: data.is_active,
          note: data.note || null,
        })
        .select("id")
        .single();

      if (error || !inserted) {
        return { success: false, error: error?.message || "Failed to add price rule." };
      }
      revalidatePath("/admin");
      revalidatePath("/menu");
      return { success: true, data: { id: inserted.id } };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save cake price rule.",
    };
  }
}

export async function togglePriceTierRuleAction(
  ruleId: string,
  isActive: boolean
): Promise<AdminActionResult> {
  try {
    await assertAdminSession();
    const supabase = await createClient();

    const { error } = await supabase
      .from("price_tier_rules")
      .update({ is_active: isActive })
      .eq("id", ruleId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin");
    revalidatePath("/menu");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to toggle rule active state.",
    };
  }
}

// ---------------------------------------------------------------- STORE OPERATIONS

export async function updateStoreSettingsAction(
  rawInput: AdminStoreSettingsInput
): Promise<AdminActionResult> {
  try {
    await assertAdminSession();

    const parsed = adminStoreSettingsSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid store settings data.",
      };
    }

    const { location_id, ...settings } = parsed.data;
    const supabase = await createClient();

    const { error } = await supabase
      .from("store_settings")
      .update(settings)
      .eq("location_id", location_id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin");
    revalidatePath("/checkout");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update store settings.",
    };
  }
}

export async function toggleStorePauseAction(
  rawInput: AdminPauseStoreInput
): Promise<AdminActionResult> {
  try {
    await assertAdminSession();

    const parsed = adminPauseStoreSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid store pause data.",
      };
    }

    const { location_id, is_paused, paused_until, pause_message } = parsed.data;
    const supabase = await createClient();

    const p_until = is_paused ? (paused_until || new Date(Date.now() + 24 * 3600 * 1000).toISOString()) : null;
    const p_message = is_paused ? (pause_message || "Online ordering is temporarily paused.") : null;

    const { error: rpcError } = await supabase.rpc("set_orders_pause", {
      p_location_id: location_id,
      p_until,
      p_message,
    });

    if (rpcError) {
      const { error } = await supabase
        .from("store_settings")
        .update({
          orders_paused_until: p_until,
          pause_message: p_message,
        })
        .eq("location_id", location_id);

      if (error) return { success: false, error: error.message };
    }

    revalidatePath("/admin");
    revalidatePath("/menu");
    revalidatePath("/checkout");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to toggle store pause state.",
    };
  }
}

export async function addSpecialClosureAction(
  rawInput: AdminSpecialClosureInput
): Promise<AdminActionResult<{ id: string }>> {
  try {
    await assertAdminSession();

    const parsed = adminSpecialClosureSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid closure date.",
      };
    }

    const supabase = await createClient();
    const { data: inserted, error } = await supabase
      .from("special_closures")
      .insert({
        location_id: parsed.data.location_id,
        closure_date: parsed.data.closure_date,
        reason: parsed.data.reason || "Scheduled bakery closure",
      })
      .select("id")
      .single();

    if (error || !inserted) {
      return {
        success: false,
        error: error?.message || "Failed to add special closure date.",
      };
    }

    revalidatePath("/admin");
    revalidatePath("/checkout");
    return { success: true, data: { id: inserted.id } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to add special closure date.",
    };
  }
}

export async function removeSpecialClosureAction(
  closureId: string
): Promise<AdminActionResult> {
  try {
    await assertAdminSession();
    const supabase = await createClient();

    const { error } = await supabase
      .from("special_closures")
      .delete()
      .eq("id", closureId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin");
    revalidatePath("/checkout");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to remove closure date.",
    };
  }
}

// ---------------------------------------------------------------- STAFF MANAGEMENT

export async function updateStaffRoleAction(
  rawInput: AdminStaffRoleInput
): Promise<AdminActionResult> {
  try {
    const session = await assertAdminSession();

    const parsed = adminStaffRoleSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid staff role data.",
      };
    }

    const { user_id, role, is_active } = parsed.data;
    const supabase = await createClient();

    // Check self-management and last active admin safeguard
    if (session.user && user_id === session.user.id && (role !== "ADMIN" || !is_active)) {
      const { count } = await supabase
        .from("staff_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "ADMIN")
        .eq("is_active", true);

      if ((count ?? 0) <= 1) {
        return {
          success: false,
          error:
            "Safety lock: Cannot remove or demote the only active admin. Assign another active admin first.",
        };
      }
    }

    const { error } = await supabase
      .from("staff_roles")
      .update({
        role,
        is_active,
      })
      .eq("user_id", user_id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin");
    revalidatePath("/staff");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update staff role.",
    };
  }
}
