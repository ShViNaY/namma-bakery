import type { CakeConfiguration } from "./types";

/**
 * Generates a deterministic unique key for a cart item based on product and configuration.
 * Prevents duplicate lines for identical configurations.
 */
export function generateCartItemKey(params: {
  productId: string;
  kind: "SIMPLE" | "TIERED_CAKE";
  variantId?: string;
  configuration?: CakeConfiguration;
}): string {
  if (params.kind === "TIERED_CAKE" && params.configuration) {
    const { weightGrams, eggType, finish } = params.configuration;
    return `cake:${params.productId}:${weightGrams}:${eggType}:${finish}`;
  }
  return `simple:${params.productId}:${params.variantId ?? "default"}`;
}
