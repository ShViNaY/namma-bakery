"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Loader2, AlertCircle } from "lucide-react";
import { lookupOrderTokenAction } from "@/lib/orders/actions";

export function OrderLookupForm() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderNumber.trim() || !phone.trim()) {
      setErrorMessage("Please enter both your order number and phone number.");
      return;
    }

    const trimmedOrder = orderNumber.trim().toUpperCase();
    if (trimmedOrder.startsWith("CC")) {
      setErrorMessage(
        "Custom cake enquiries (e.g. CC1016) are reviewed directly by our head baker and tracked in the Custom Cake Tracker. Please use the Track Custom Cakes option below."
      );
      return;
    }

    setErrorMessage(null);
    setIsSearching(true);

    try {
      const result = await lookupOrderTokenAction({
        orderNumber: orderNumber.trim(),
        phone: phone.trim(),
      });

      if (!result.success || !result.token) {
        setErrorMessage(
          result.error ||
            "No matching order found. Please check your order reference and phone number."
        );
        setIsSearching(false);
        return;
      }

      router.push(`/orders/${result.token}`);
    } catch (err) {
      console.error("[OrderLookupForm] Search failed:", err);
      setErrorMessage(
        "A network error occurred while searching for your order. Please try again."
      );
      setIsSearching(false);
    }
  };

  return (
    <div className="rounded-sm border border-border bg-card p-6 sm:p-8 space-y-6 shadow-sm">
      <div className="space-y-1">
        <h2 className="font-heading text-xl font-bold text-foreground">
          Track Your Bakery Order
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Enter the order reference number (e.g. NB1001) and the mobile phone number used during checkout.
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-sm border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive dark:bg-destructive/20"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span>{errorMessage}</span>
            {orderNumber.trim().toUpperCase().startsWith("CC") && (
              <div>
                <Link
                  href="/custom-cake/track"
                  className="font-semibold text-caramel hover:underline block pt-0.5"
                >
                  Go to Custom Cake Tracker &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSearch} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="lookupOrderNumber"
            className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1.5"
          >
            Order Number
          </label>
          <input
            id="lookupOrderNumber"
            name="orderNumber"
            type="text"
            required
            autoCapitalize="characters"
            placeholder="e.g. NB1001"
            value={orderNumber}
            onChange={(e) => {
              setOrderNumber(e.target.value.toUpperCase());
              if (errorMessage) setErrorMessage(null);
            }}
            className="w-full min-h-[48px] rounded-sm border border-border bg-background px-3.5 font-mono text-sm text-foreground uppercase placeholder:normal-case placeholder:font-sans placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel hover:border-caramel/50 transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor="lookupPhone"
            className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1.5"
          >
            Customer Phone Number
          </label>
          <div className="relative flex items-center">
            <span
              className="absolute left-3.5 text-xs font-semibold text-muted-foreground select-none"
              aria-hidden="true"
            >
              +91
            </span>
            <input
              id="lookupPhone"
              name="phone"
              type="tel"
              inputMode="numeric"
              required
              placeholder="98450 12345"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              className="w-full min-h-[48px] rounded-sm border border-border bg-background pl-12 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel hover:border-caramel/50 transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSearching}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-caramel text-sm font-semibold text-white shadow-sm transition-colors hover:bg-caramel/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
        >
          {isSearching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Looking up Order...</span>
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              <span>Track Order</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
