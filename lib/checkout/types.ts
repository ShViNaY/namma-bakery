import type { CartItem } from "@/lib/cart/types";
import type { PickupSlot } from "@/lib/pickup/types";

export interface CustomerDetails {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerNotes?: string;
}

export interface CheckoutReviewSummary {
  customer: CustomerDetails;
  pickupDate: string;
  pickupSlot: PickupSlot;
  items: CartItem[];
  itemCount: number;
  subtotalPaise: number;
}
