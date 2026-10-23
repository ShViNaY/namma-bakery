import type { CakeFinish, EggType } from "@/lib/menu/types";
import type { PickupSlot } from "@/lib/pickup/types";

export interface CakeConfiguration {
  weightGrams: number;
  eggType: EggType;
  finish: CakeFinish;
}

export interface CartItem {
  /**
   * Deterministic composite key:
   * For cakes: `cake:${productId}:${weightGrams}:${eggType}:${finish}`
   * For simple products: `simple:${productId}:${variantId ?? 'default'}`
   */
  itemKey: string;
  productId: string;
  productSlug: string;
  productName: string;
  productNameKn?: string | null;
  categorySlug: string;
  kind: "SIMPLE" | "TIERED_CAKE";

  // For SIMPLE products with variants
  variantId?: string;
  variantLabel?: string;

  // For TIERED_CAKE
  configuration?: CakeConfiguration;

  unitPricePaise: number;
  quantity: number;

  /**
   * Product preparation lead time in minutes (used for calculating earliest pickup slots)
   */
  leadTimeMinutes?: number;
}

export interface CartState {
  items: CartItem[];
  pickupDate: string | null;
  pickupSlot: PickupSlot | null;
}

export type CartAction =
  | { type: "ADD_ITEM"; payload: Omit<CartItem, "quantity"> & { quantity?: number } }
  | { type: "REMOVE_ITEM"; payload: { itemKey: string } }
  | { type: "UPDATE_QUANTITY"; payload: { itemKey: string; quantity: number } }
  | { type: "INCREMENT_QUANTITY"; payload: { itemKey: string } }
  | { type: "DECREMENT_QUANTITY"; payload: { itemKey: string } }
  | { type: "CLEAR_CART" }
  | {
      type: "INIT_CART";
      payload: {
        items: CartItem[];
        pickupDate?: string | null;
        pickupSlot?: PickupSlot | null;
      };
    }
  | { type: "SET_PICKUP_DATE"; payload: string | null }
  | { type: "SET_PICKUP_SLOT"; payload: PickupSlot | null }
  | { type: "CLEAR_PICKUP" };

export interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotalPaise: number;
  isEmpty: boolean;
  isHydrated: boolean;
  pickupDate: string | null;
  pickupSlot: PickupSlot | null;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (itemKey: string) => void;
  updateQuantity: (itemKey: string, quantity: number) => void;
  incrementQuantity: (itemKey: string) => void;
  decrementQuantity: (itemKey: string) => void;
  clearCart: () => void;
  setPickupDate: (date: string | null) => void;
  setPickupSlot: (slot: PickupSlot | null) => void;
  clearPickup: () => void;
}
