import { z } from "zod";
import {
  indianPhoneSchema,
  optionalEmailSchema,
  calendarDateSchema,
} from "@/lib/validation/common";

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB limit per database constraint

export const customCakeFormSchema = z
  .object({
    customerName: z
      .string()
      .trim()
      .min(2, "Please enter your name (at least 2 characters)")
      .max(80, "Name cannot exceed 80 characters"),
    customerPhone: indianPhoneSchema,
    customerEmail: optionalEmailSchema,
    cakeType: z
      .string()
      .trim()
      .min(2, "Please select or specify the cake occasion/type")
      .max(80, "Cake type cannot exceed 80 characters"),
    flavour: z
      .string()
      .trim()
      .min(2, "Please select or specify a flavour")
      .max(80, "Flavour cannot exceed 80 characters"),
    eggType: z.enum(["EGGLESS", "REGULAR"], {
      message: "Please choose eggless or regular (with egg)",
    }),
    weightGrams: z
      .number({ message: "Please specify a cake weight" })
      .int("Cake weight must be a whole integer in grams")
      .min(250, "Minimum custom cake weight is 250 grams (1/4 kg)")
      .max(20000, "Maximum custom cake weight is 20,000 grams (20 kg)"),
    shape: z
      .string()
      .trim()
      .max(50, "Shape cannot exceed 50 characters")
      .optional()
      .transform((val) => (val?.trim() ? val.trim() : "Round")),
    preferredPickupDate: calendarDateSchema,
    preferredPickupTime: z
      .string()
      .min(1, "Preferred pickup time is required")
      .max(40, "Invalid time format"),
    description: z
      .string()
      .trim()
      .min(10, "Please provide at least a brief description of your design or theme (10+ characters)")
      .max(1500, "Description cannot exceed 1,500 characters"),
    messageOnCake: z
      .string()
      .max(60, "Cake inscription cannot exceed 60 characters")
      .optional()
      .transform((val) => (val?.trim() ? val.trim() : undefined)),
    additionalNotes: z
      .string()
      .max(1000, "Additional notes cannot exceed 1,000 characters")
      .optional()
      .transform((val) => (val?.trim() ? val.trim() : undefined)),
  })
  .strict();

export type CustomCakeFormData = z.infer<typeof customCakeFormSchema>;

/**
 * Validates reference image file upload.
 */
export function validateReferenceImageFile(file: File | null): {
  valid: boolean;
  error?: string;
} {
  if (!file || file.size === 0) {
    return { valid: true };
  }

  if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Image size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the maximum allowed limit of 5MB.`,
    };
  }

  if (
    !ALLOWED_IMAGE_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number]
    )
  ) {
    return {
      valid: false,
      error: "Only PNG, JPEG, and WebP images are allowed.",
    };
  }

  return { valid: true };
}
