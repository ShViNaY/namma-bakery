"use client";

import * as React from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart/context";

export function HeaderCartButton() {
  const { itemCount, isHydrated } = useCart();

  const countDisplay = isHydrated ? itemCount : 0;
  const label =
    countDisplay > 0
      ? `Shopping cart, ${countDisplay} ${countDisplay === 1 ? "item" : "items"}`
      : "Shopping cart";

  return (
    <Link
      href="/cart"
      aria-label={label}
      className="relative flex h-11 min-w-11 items-center justify-center rounded-md px-3 text-foreground transition-colors hover:bg-secondary hover:text-caramel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
    >
      <ShoppingBag className="h-5 w-5" aria-hidden="true" />
      <span className="ml-2 hidden text-sm font-medium sm:inline">Cart</span>
      {countDisplay > 0 && (
        <span
          className="ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-caramel px-1.5 text-xs font-semibold text-white transition-transform animate-in zoom-in-50"
          aria-hidden="true"
        >
          {countDisplay}
        </span>
      )}
    </Link>
  );
}
