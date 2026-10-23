import type { CakeFinish, EggType } from "@/lib/menu/types";

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
}

export interface CartState {
  items: CartItem[];
}

export type CartAction =
  | { type: "ADD_ITEM"; payload: Omit<CartItem, "quantity"> & { quantity?: number } }
  | { type: "REMOVE_ITEM"; payload: { itemKey: string } }
  | { type: "UPDATE_QUANTITY"; payload: { itemKey: string; quantity: number } }
  | { type: "INCREMENT_QUANTITY"; payload: { itemKey: string } }
  | { type: "DECREMENT_QUANTITY"; payload: { itemKey: string } }
  | { type: "CLEAR_CART" }
  | { type: "INIT_CART"; payload: CartItem[] };

export interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotalPaise: number;
  isEmpty: boolean;
  isHydrated: boolean;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (itemKey: string) => void;
  updateQuantity: (itemKey: string, quantity: number) => void;
  incrementQuantity: (itemKey: string) => void;
  decrementQuantity: (itemKey: string) => void;
  clearCart: () => void;
}
