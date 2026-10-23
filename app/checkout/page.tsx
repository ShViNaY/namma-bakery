import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const instant = false;

export const metadata: Metadata = {
  title: "Checkout & Order Review",
  description:
    "Review your fresh bakes and provide contact details for pickup at Namma Bakery, BEML Layout 3rd Stage, RR Nagar.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutPage() {
  return <CheckoutForm />;
}
