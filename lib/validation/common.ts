import { z } from "zod";

/**
 * Common, reusable validation schemas for Namma Bakery.
 * Feature-specific schemas (e.g. orders, quotes) should be defined in their
 * respective feature directories or alongside their server actions.
 */

/**
 * Validates and normalizes an Indian 10-digit mobile phone number.
 * Accepts numbers with optional +91, 91, or 0 prefixes and optional spaces or hyphens.
 * Transforms the valid input into a clean 10-digit string (e.g. "9876543210").
 */
export const indianPhoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .transform((val) => val.trim().replace(/[\s\-]/g, ""))
  .refine(
    (val) => /^(\+91|91|0)?[6-9]\d{9}$/.test(val),
    "Please enter a valid 10-digit Indian mobile number"
  )
  .transform((val) => {
    // Strip prefix to extract the 10-digit national number
    const match = val.match(/[6-9]\d{9}$/);
    return match ? match[0] : val;
  });

/**
 * Validates a standard email address, normalized to lowercase and trimmed.
 */
export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Invalid email address")
  .toLowerCase();

/**
 * Optional email schema: allows empty string, whitespace, null or undefined,
 * normalizing empty values to undefined.
 */
export const optionalEmailSchema = z
  .string()
  .optional()
  .nullable()
  .transform((val) => {
    if (!val || typeof val !== "string") return undefined;
    const trimmed = val.trim().toLowerCase();
    return trimmed.length > 0 ? trimmed : undefined;
  })
  .pipe(z.string().email("Invalid email address").optional());

/**
 * Non-negative integer paise validation for monetary amounts.
 * Stored values in database must always be integer paise (>= 0).
 */
export const paiseSchema = z
  .number()
  .int("Amount in paise must be a whole integer")
  .nonnegative("Amount in paise cannot be negative");

/**
 * Strictly positive integer paise validation (e.g. for item prices or custom quotes).
 */
export const positivePaiseSchema = z
  .number()
  .int("Amount in paise must be a whole integer")
  .positive("Amount in paise must be greater than zero");

/**
 * Standard UUID string validation (used across Supabase entity IDs).
 */
export const uuidSchema = z.string().uuid("Invalid ID format");

/**
 * Validates calendar date strings in "YYYY-MM-DD" format.
 */
export const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

/**
 * Standard pagination query parameters schema.
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1, "Page must be at least 1").default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .default(20),
});

export type PaginationParams = z.infer<typeof paginationSchema>;
