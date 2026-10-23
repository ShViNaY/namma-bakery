"use client";

import * as React from "react";
import type {
  CartAction,
  CartContextValue,
  CartItem,
  CartState,
} from "./types";

const STORAGE_KEY = "namma-bakery-cart-v1";

const initialState: CartState = {
  items: [],
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "INIT_CART": {
      return {
        ...state,
        items: action.payload,
      };
    }
    case "ADD_ITEM": {
      const existingIndex = state.items.findIndex(
        (item) => item.itemKey === action.payload.itemKey
      );
      const addQty = Math.max(1, action.payload.quantity ?? 1);

      if (existingIndex > -1) {
        const nextItems = [...state.items];
        const existing = nextItems[existingIndex];
        nextItems[existingIndex] = {
          ...existing,
          quantity: existing.quantity + addQty,
        };
        return { ...state, items: nextItems };
      }

      const newItem: CartItem = {
        ...action.payload,
        quantity: addQty,
      };
      return {
        ...state,
        items: [...state.items, newItem],
      };
    }
    case "REMOVE_ITEM": {
      return {
        ...state,
        items: state.items.filter((item) => item.itemKey !== action.payload.itemKey),
      };
    }
    case "UPDATE_QUANTITY": {
      const targetQty = action.payload.quantity;
      if (targetQty <= 0) {
        return {
          ...state,
          items: state.items.filter((item) => item.itemKey !== action.payload.itemKey),
        };
      }
      return {
        ...state,
        items: state.items.map((item) =>
          item.itemKey === action.payload.itemKey
            ? { ...item, quantity: targetQty }
            : item
        ),
      };
    }
    case "INCREMENT_QUANTITY": {
      return {
        ...state,
        items: state.items.map((item) =>
          item.itemKey === action.payload.itemKey
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      };
    }
    case "DECREMENT_QUANTITY": {
      return {
        ...state,
        items: state.items.map((item) =>
          item.itemKey === action.payload.itemKey
            ? { ...item, quantity: Math.max(1, item.quantity - 1) }
            : item
        ),
      };
    }
    case "CLEAR_CART": {
      return {
        ...state,
        items: [],
      };
    }
    default:
      return state;
  }
}

function parseStoredCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Basic structural validation
    return parsed.filter((item): item is CartItem => {
      return (
        typeof item === "object" &&
        item !== null &&
        typeof item.itemKey === "string" &&
        typeof item.productId === "string" &&
        typeof item.productSlug === "string" &&
        typeof item.productName === "string" &&
        typeof item.categorySlug === "string" &&
        typeof item.unitPricePaise === "number" &&
        item.unitPricePaise >= 0 &&
        typeof item.quantity === "number" &&
        item.quantity > 0
      );
    });
  } catch {
    return [];
  }
}

const CartContext = React.createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(cartReducer, initialState);
  const [isHydrated, setIsHydrated] = React.useState(false);

  // Rehydrate on client mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const items = parseStoredCart(stored);
      dispatch({ type: "INIT_CART", payload: items });
    } catch {
      // Ignore localStorage read failures
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Sync state changes to localStorage once hydrated
  React.useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // Storage quota or privacy mode error handling
    }
  }, [state.items, isHydrated]);

  const addItem = React.useCallback(
    (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
      dispatch({ type: "ADD_ITEM", payload: item });
    },
    []
  );

  const removeItem = React.useCallback((itemKey: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: { itemKey } });
  }, []);

  const updateQuantity = React.useCallback(
    (itemKey: string, quantity: number) => {
      dispatch({ type: "UPDATE_QUANTITY", payload: { itemKey, quantity } });
    },
    []
  );

  const incrementQuantity = React.useCallback((itemKey: string) => {
    dispatch({ type: "INCREMENT_QUANTITY", payload: { itemKey } });
  }, []);

  const decrementQuantity = React.useCallback((itemKey: string) => {
    dispatch({ type: "DECREMENT_QUANTITY", payload: { itemKey } });
  }, []);

  const clearCart = React.useCallback(() => {
    dispatch({ type: "CLEAR_CART" });
  }, []);

  const itemCount = React.useMemo(() => {
    return state.items.reduce((sum, item) => sum + item.quantity, 0);
  }, [state.items]);

  const subtotalPaise = React.useMemo(() => {
    return state.items.reduce(
      (sum, item) => sum + item.unitPricePaise * item.quantity,
      0
    );
  }, [state.items]);

  const isEmpty = state.items.length === 0;

  const value = React.useMemo<CartContextValue>(
    () => ({
      items: state.items,
      itemCount,
      subtotalPaise,
      isEmpty,
      isHydrated,
      addItem,
      removeItem,
      updateQuantity,
      incrementQuantity,
      decrementQuantity,
      clearCart,
    }),
    [
      state.items,
      itemCount,
      subtotalPaise,
      isEmpty,
      isHydrated,
      addItem,
      removeItem,
      updateQuantity,
      incrementQuantity,
      decrementQuantity,
      clearCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = React.useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
