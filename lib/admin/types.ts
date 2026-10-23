/**
 * Types representing the Namma Bakery Admin domain.
 * Strictly aligned with the Supabase PostgreSQL database schema.
 */

import type { StaffRole } from "@/lib/staff/types";
import type {
  ProductKind,
  EggType,
  CakeFinish,
  Category,
  Product,
  ProductVariant,
  PriceTier,
  PriceTierRule,
} from "@/lib/menu/types";

export type { StaffRole, ProductKind, EggType, CakeFinish };

export interface AdminCategory extends Category {
  product_count?: number;
}

export interface AdminProduct extends Product {
  category?: Category | null;
  product_variants?: ProductVariant[];
  price_tiers?: PriceTier | null;
}

export interface AdminPriceTierWithRules extends PriceTier {
  price_tier_rules: PriceTierRule[];
}

export interface SpecialClosure {
  id: string;
  location_id: string;
  closure_date: string; // YYYY-MM-DD
  reason: string | null;
}

export interface BusinessHour {
  id: string;
  location_id: string;
  weekday: number; // 0 = Sunday, 6 = Saturday
  opens: string; // HH:MM:SS
  closes: string; // HH:MM:SS
}

export interface LocationInfo {
  id: string;
  slug: string;
  name: string;
  address_line: string | null;
  locality: string | null;
  city: string;
  state: string;
  pincode: string | null;
  phone: string | null;
  whatsapp: string | null;
  timezone: string;
  is_active: boolean;
}

export interface StoreSettings {
  location_id: string;
  orders_paused_until: string | null;
  pause_message: string | null;
  slot_minutes: 15 | 30 | 60;
  max_orders_per_slot: number;
  max_custom_per_day: number;
  quote_validity_hours: number;
  cancel_cutoff_hours: number;
  pending_alert_minutes: number;
  max_open_orders_per_phone: number;
  updated_at: string;
}

export interface AdminStaffMember {
  user_id: string;
  role: StaffRole;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
  full_name: string | null;
  phone: string | null;
}

export interface AuditLogEntry {
  id: number;
  actor_id: string | null;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminOverviewSummary {
  totalProducts: number;
  availableProducts: number;
  archivedProducts: number;
  totalCategories: number;
  visibleCategories: number;
  pendingOrders: number;
  pendingCustomCakes: number;
  totalStaff: number;
  activeStaff: number;
  adminCount: number;
  isStorePaused: boolean;
  pauseMessage: string | null;
  ordersPausedUntil: string | null;
  slotMinutes: number;
  maxOrdersPerSlot: number;
}
