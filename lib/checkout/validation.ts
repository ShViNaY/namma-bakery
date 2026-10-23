import { z } from "zod";
import { indianPhoneSchema, optionalEmailSchema } from "@/lib/validation/common";

/**
 * Customer details validation schema for checkout.
 * Enforces business and database constraints:
 * - customerName: 2 to 80 characters
 * - customerPhone: 10-digit Indian mobile number
 * - customerEmail: optional, valid format when provided
 * - customerNotes: optional, max 500 characters
 */
export const customerDetailsSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "Please enter your name (at least 2 characters)")
    .max(80, "Name cannot exceed 80 characters"),
  customerPhone: indianPhoneSchema,
  customerEmail: optionalEmailSchema,
  customerNotes: z
    .string()
    .max(500, "Special instructions cannot exceed 500 characters")
    .optional()
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
});

export type CustomerDetailsFormData = z.infer<typeof customerDetailsSchema>;
export type CustomerDetailsFormInput = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerNotes: string;
};
