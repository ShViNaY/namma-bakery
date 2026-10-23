import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const instant = false;

export const metadata: Metadata = {
  title: "Checkout & Order Review — Namma Bakery | RR Nagar, Bengaluru",
  description:
    "Review your fresh bakes and provide contact details for pickup at Namma Bakery, BEML Layout 3rd Stage, RR Nagar.",
};

export default function CheckoutPage() {
  return <CheckoutForm />;
}
