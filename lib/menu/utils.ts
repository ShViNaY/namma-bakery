import type { CakeFinish, EggType } from "./types";

/**
 * Formats a lead time in minutes into customer-friendly bakery text.
 *
 * Examples:
 *   formatLeadTime(60) -> "Preparation time: 1 hour"
 *   formatLeadTime(90) -> "Preparation time: 1 hour 30 mins"
 *   formatLeadTime(240) -> "Preparation time: 4 hours"
 */
export function formatLeadTime(
  minutes: number | null | undefined
): string | null {
  if (typeof minutes !== "number" || minutes <= 0) return null;

  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;

  if (hours > 0 && remainingMins > 0) {
    return `Preparation time: ${hours} ${hours === 1 ? "hour" : "hours"} ${remainingMins} mins`;
  }
  if (hours > 0) {
    return `Preparation time: ${hours} ${hours === 1 ? "hour" : "hours"}`;
  }
  return `Preparation time: ${minutes} mins`;
}

/**
 * Formats cake weight grams into intuitive bakery sizes.
 *
 * Examples:
 *   formatWeightGrams(500) -> "500g (1/2 kg)"
 *   formatWeightGrams(1000) -> "1 kg"
 *   formatWeightGrams(1500) -> "1.5 kg"
 *   formatWeightGrams(2000) -> "2 kg"
 */
export function formatWeightGrams(grams: number): string {
  if (grams === 500) return "500g (1/2 kg)";
  if (grams >= 1000) {
    const kg = grams / 1000;
    return `${kg} kg`;
  }
  return `${grams}g`;
}

/**
 * Formats egg type into clear customer labels.
 */
export function formatEggType(eggType: EggType): string {
  return eggType === "EGGLESS" ? "100% Eggless" : "With Egg";
}

/**
 * Formats cake finishes into understandable customer-facing options.
 */
export function formatCakeFinish(finish: CakeFinish): string {
  switch (finish) {
    case "STANDARD":
      return "Standard Frosting";
    case "RICE_PAPER":
      return "Photo / Rice Paper Print";
    case "SHAPE_CAKE":
      return "Custom Shape Cut";
    case "GUM_PASTE":
      return "Gum Paste & 3D Accents";
    default:
      return finish;
  }
}

export interface OrderabilityInfo {
  status:
    | "available"
    | "requires_confirmation"
    | "in_store_only"
    | "unavailable";
  badgeText: string;
  description: string;
}

/**
 * Evaluates the customer-facing orderability status of a product.
 * Respects is_available, orderable_online, and requires_confirmation.
 */
export function getOrderabilityInfo(product: {
  is_available: boolean;
  orderable_online: boolean;
  requires_confirmation: boolean;
}): OrderabilityInfo {
  if (!product.is_available) {
    return {
      status: "unavailable",
      badgeText: "Currently Unavailable",
      description:
        "This item is temporarily sold out or unavailable today. Please check back soon.",
    };
  }

  if (!product.orderable_online) {
    return {
      status: "in_store_only",
      badgeText: "Available in-store / contact bakery",
      description:
        "This item is freshly made for walk-in counter service at our RR Nagar bakery.",
    };
  }

  if (product.requires_confirmation) {
    return {
      status: "requires_confirmation",
      badgeText: "Requires confirmation",
      description:
        "Baked fresh to order. Orders will be confirmed by our bakery team before baking begins.",
    };
  }

  return {
    status: "available",
    badgeText: "Available for online ordering",
    description:
      "Ready to be prepared fresh for store pickup at your selected time slot.",
  };
}
