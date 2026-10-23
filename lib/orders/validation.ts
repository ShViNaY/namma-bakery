import { z } from "zod";
import { customerDetailsSchema } from "@/lib/checkout/validation";

export const placeOrderItemSchema = z
  .object({
    productId: z.string().uuid("Invalid product ID format"),
    kind: z.enum(["SIMPLE", "TIERED_CAKE"]),
    variantId: z.string().uuid("Invalid variant ID format").optional(),
    quantity: z
      .number()
      .int("Quantity must be an integer")
      .min(1, "Quantity must be at least 1")
      .max(20, "Quantity cannot exceed 20 per line item"),
    cakeConfig: z
      .object({
        weightGrams: z
          .number()
          .int("Cake weight must be a whole integer in grams")
          .min(250, "Minimum cake weight is 250 grams")
          .max(10000, "Maximum cake weight is 10,000 grams (10 kg)"),
        eggType: z.enum(["EGG", "EGGLESS"]),
        finish: z
          .enum(["STANDARD", "RICE_PAPER", "SHAPE_CAKE", "GUM_PASTE"])
          .default("STANDARD"),
      })
      .strict()
      .optional(),
    cakeMessage: z
      .string()
      .max(60, "Cake message cannot exceed 60 characters")
      .transform((val) => (val?.trim() ? val.trim() : undefined))
      .optional(),
  })
  .strict()
  .refine(
    (item) => {
      if (item.kind === "TIERED_CAKE") {
        return Boolean(item.cakeConfig);
      }
      return Boolean(item.variantId);
    },
    {
      message: "Valid item configuration or variant is required",
    }
  );

export const placeOrderInputSchema = z
  .object({
    customerDetails: customerDetailsSchema,
    pickupSlotStart: z
      .string()
      .min(1, "Pickup slot time is required")
      .refine((val) => {
        const parsed = Date.parse(val);
        if (isNaN(parsed)) return false;
        const now = Date.now();
        // Disallow slots far in the past (> 2 hours ago) or too far in the future (> 60 days)
        const diffMs = parsed - now;
        return diffMs > -2 * 60 * 60 * 1000 && diffMs < 60 * 24 * 60 * 60 * 1000;
      }, "Invalid pickup time format or scheduled date is outside allowed range"),
    items: z
      .array(placeOrderItemSchema)
      .min(1, "At least 1 item is required to place an order")
      .max(20, "An order cannot contain more than 20 items"),
  })
  .strict();

export type PlaceOrderSchemaInput = z.infer<typeof placeOrderInputSchema>;

export const lookupOrderTokenSchema = z
  .object({
    orderNumber: z
      .string()
      .trim()
      .regex(/^NB\d{4,12}$/i, "Order number must be in the format NB followed by digits (e.g. NB1001)"),
    phone: z
      .string()
      .trim()
      .transform((val) => val.replace(/[\s\-]/g, ""))
      .refine(
        (val) => /^(\+91|91|0)?[6-9]\d{9}$/.test(val),
        "Please enter a valid 10-digit Indian mobile number"
      )
      .transform((val) => {
        const match = val.match(/[6-9]\d{9}$/);
        return match ? match[0] : val;
      }),
  })
  .strict();

export type LookupOrderTokenInput = z.infer<typeof lookupOrderTokenSchema>;
