/**
 * Canonical weight formatter for staff views.
 * Converts weight in grams to clean human-friendly strings:
 *   500 -> "500g"
 *   250 -> "250g"
 *   1000 -> "1kg"
 *   1500 -> "1.5kg"
 *   2000 -> "2kg"
 */
export function formatCanonicalWeight(weightGrams: number): string {
  if (weightGrams < 1000) {
    return `${weightGrams}g`;
  }
  const kg = weightGrams / 1000;
  // Strip unnecessary trailing decimals (e.g. 1.0 -> 1, 1.50 -> 1.5)
  const formatted = parseFloat(kg.toFixed(3));
  return `${formatted}kg`;
}

/**
 * Cleanly formats an order item variant/weight label for staff views.
 * Eliminates excessive SQL floating-point precision strings (e.g. "0.50000000000000000000 kg" -> "500g")
 * and uses the canonical data model (weight_grams) when present.
 */
export function formatOrderItemVariant(item: {
  variant_label?: string | null;
  weight_grams?: number | null;
  egg_type?: string | null;
}): string | null {
  // 1. If canonical weight_grams is present (cake products)
  if (typeof item.weight_grams === "number" && item.weight_grams > 0) {
    const weightStr = formatCanonicalWeight(item.weight_grams);
    if (item.egg_type) {
      return `${weightStr} · ${item.egg_type.toLowerCase()}`;
    }
    return weightStr;
  }

  // 2. If variant_label is present (simple products or fallback)
  if (item.variant_label) {
    let label = item.variant_label.trim();

    // Replace SQL decimal precision strings (e.g. "0.50000000000000000000 kg")
    label = label.replace(/(\d+(?:\.\d+)?)\s*kg/gi, (_match, numStr) => {
      const val = parseFloat(numStr);
      if (!isNaN(val)) {
        if (val < 1) {
          return `${Math.round(val * 1000)}g`;
        }
        return `${parseFloat(val.toFixed(3))}kg`;
      }
      return _match;
    });

    // Replace comma separators with clean middot separator (e.g. "500g, egg" -> "500g · egg")
    label = label.replace(/,\s*/g, " · ");

    return label;
  }

  return null;
}
