import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";

export const instant = false;

export const metadata: Metadata = {
  title: "Shopping Cart — Namma Bakery | RR Nagar, Bengaluru",
  description:
    "Review your selected cakes and bakes before choosing a pickup slot at Namma Bakery, RR Nagar.",
};

export default function CartPage() {
  return <CartView />;
}
