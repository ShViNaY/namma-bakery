import type { CakeFinish, EggType } from "@/lib/menu/types";
import type { OrderStatus, PaymentStatus, PaymentMethod } from "@/lib/orders/types";

export type StaffRole = "EMPLOYEE" | "ADMIN";

export interface StaffOrderItem {
  id: string;
  order_id: string;
  product_id?: string | null;
  variant_id?: string | null;
  product_name: string;
  variant_label?: string | null;
  egg_type?: EggType | null;
  finish?: CakeFinish | null;
  weight_grams?: number | null;
  unit_price_paise: number;
  quantity: number;
  line_total_paise: number;
  cake_message?: string | null;
}

export interface StaffOrderStatusHistory {
  id: string;
  order_id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  changed_by?: string | null;
  actor_role: string;
  note?: string | null;
  created_at: string;
}

export interface StaffOrderInternalNote {
  id: string;
  order_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export interface StaffOrder {
  id: string;
  order_number: string;
  customer_id?: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  requested_pickup_at: string;
  confirmed_pickup_at?: string | null;
  estimated_ready_at?: string | null;
  total_paise: number;
  customer_notes?: string | null;
  bakery_note?: string | null;
  rejection_reason?: string | null;
  cancellation_reason?: string | null;
  cancelled_by?: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  order_items: StaffOrderItem[];
  order_status_history: StaffOrderStatusHistory[];
  order_internal_notes?: StaffOrderInternalNote[];
}

export interface OperationalSummary {
  totalToday: number;
  pending: number;
  accepted: number;
  preparing: number;
  readyForPickup: number;
  completed: number;
  cancelledOrRejected: number;
}

export type OrderFilter =
  | "ALL"
  | "TODAY"
  | "PENDING"
  | "ACCEPTED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "COMPLETED"
  | "CANCELLED_OR_REJECTED";

export type {
  CustomCakeRequest,
  CustomCakeStatus,
  CustomCakeOperationalSummary,
} from "@/lib/custom-cake/types";
