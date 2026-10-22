/**
 * Currency and money utilities for Namma Bakery.
 *
 * In Namma Bakery, all monetary values in the database are stored as integer paise
 * (e.g. 15000 paise = ₹150.00). Floating-point math is strictly avoided for stored
 * values to prevent precision loss.
 */

export interface FormatPaiseOptions {
  /**
   * If true, omits ".00" decimals for whole rupee amounts (e.g. ₹150 instead of ₹150.00).
   * Default: false (consistently displays 2 decimal places).
   */
  compactDecimals?: boolean;

  /**
   * Whether to include the ₹ currency symbol in the output.
   * Default: true.
   */
  includeSymbol?: boolean;
}

const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const INR_FORMATTER_NO_SYMBOL = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const INR_FORMATTER_COMPACT = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const INR_FORMATTER_COMPACT_NO_SYMBOL = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Formats an integer paise amount into an Indian Rupee (INR) display string.
 *
 * Examples:
 *   formatPaise(15000) -> "₹150.00"
 *   formatPaise(49900) -> "₹499.00"
 *   formatPaise(15000, { compactDecimals: true }) -> "₹150"
 *   formatPaise(15050, { compactDecimals: true }) -> "₹150.50"
 *   formatPaise(15000, { includeSymbol: false }) -> "150.00"
 */
export function formatPaise(
  paise: number,
  options: FormatPaiseOptions = {}
): string {
  const { compactDecimals = false, includeSymbol = true } = options;

  if (!Number.isFinite(paise)) {
    return includeSymbol ? "₹0.00" : "0.00";
  }

  // Integer paise converted to rupees for Intl display
  const rupees = Math.trunc(paise) / 100;

  if (compactDecimals) {
    return includeSymbol
      ? INR_FORMATTER_COMPACT.format(rupees)
      : INR_FORMATTER_COMPACT_NO_SYMBOL.format(rupees);
  }

  return includeSymbol
    ? INR_FORMATTER.format(rupees)
    : INR_FORMATTER_NO_SYMBOL.format(rupees);
}

/**
 * Alias for formatPaise providing descriptive intent.
 */
export const formatPaiseToInr = formatPaise;

/**
 * Converts integer paise to rupees as a standard number.
 *
 * Example:
 *   paiseToRupees(15000) -> 150
 *   paiseToRupees(49900) -> 499
 */
export function paiseToRupees(paise: number): number {
  if (!Number.isFinite(paise)) {
    throw new TypeError("paise must be a finite number");
  }
  return Math.trunc(paise) / 100;
}

/**
 * Converts a rupee amount (number or string) to integer paise, avoiding
 * JavaScript IEEE-754 floating-point multiplication errors.
 *
 * Examples:
 *   rupeesToPaise(150) -> 15000
 *   rupeesToPaise(19.99) -> 1999
 *   rupeesToPaise("499.00") -> 49900
 *   rupeesToPaise("₹150.50") -> 15050
 */
export function rupeesToPaise(rupees: number | string): number {
  if (typeof rupees === "number") {
    if (!Number.isFinite(rupees)) {
      throw new TypeError("Rupee amount must be a finite number");
    }
    return Math.round(rupees * 100);
  }

  if (typeof rupees === "string") {
    const cleaned = rupees.trim().replace(/[₹,\s]/g, "");
    const parsed = Number.parseFloat(cleaned);
    if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
      throw new TypeError(`Invalid rupee string: "${rupees}"`);
    }
    return Math.round(parsed * 100);
  }

  throw new TypeError("rupees must be a number or string");
}

/**
 * Formats a rupee amount into an Indian Rupee (INR) display string.
 */
export function formatRupees(
  rupees: number,
  options: FormatPaiseOptions = {}
): string {
  if (!Number.isFinite(rupees)) {
    return options.includeSymbol !== false ? "₹0.00" : "0.00";
  }
  return formatPaise(rupeesToPaise(rupees), options);
}
