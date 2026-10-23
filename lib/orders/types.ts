import type { CakeFinish, EggType } from "@/lib/menu/types";

export type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED"
  | "NO_SHOW";

export type PaymentStatus =
  | "unpaid"
  | "payment_pending"
  | "paid"
  | "payment_failed"
  | "refunded";

export type PaymentMethod = "pay_at_store" | "online";

export interface PlaceOrderItemInput {
  productId: string;
  kind: "SIMPLE" | "TIERED_CAKE";
  variantId?: string;
  quantity: number;
  cakeConfig?: {
    weightGrams: number;
    eggType: EggType;
    finish: CakeFinish;
  };
  cakeMessage?: string;
}

export interface PlaceOrderInput {
  customerDetails: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    customerNotes?: string;
  };
  pickupSlotStart: string; // ISO 8601 string
  items: PlaceOrderItemInput[];
}

export type PlaceOrderResult =
  | {
      success: true;
      orderId: string;
      orderNumber: string;
      publicToken: string;
    }
  | {
      success: false;
      error: string;
      code?: string;
    };

export interface OrderTrackItem {
  name: string;
  label?: string | null;
  egg_type?: EggType | null;
  quantity: number;
  line_total_paise: number;
  cake_message?: string | null;
}

export interface OrderStatusHistoryEntry {
  status: OrderStatus;
  at: string;
}

export interface OrderTrackDetails {
  order_number: string;
  status: OrderStatus;
  first_name: string;
  requested_pickup_at: string;
  confirmed_pickup_at: string | null;
  estimated_ready_at: string | null;
  bakery_note: string | null;
  rejection_reason: string | null;
  total_paise: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  items: OrderTrackItem[];
  history: OrderStatusHistoryEntry[];
}
