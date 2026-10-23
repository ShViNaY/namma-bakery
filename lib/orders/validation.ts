import { z } from "zod";
import { customerDetailsSchema } from "@/lib/checkout/validation";

export const placeOrderItemSchema = z
  .object({
    productId: z.string().uuid("Invalid product ID"),
    kind: z.enum(["SIMPLE", "TIERED_CAKE"]),
    variantId: z.string().uuid("Invalid variant ID").optional(),
    quantity: z
      .number()
      .int()
      .min(1, "Quantity must be at least 1")
      .max(20, "Quantity cannot exceed 20"),
    cakeConfig: z
      .object({
        weightGrams: z.number().int().positive(),
        eggType: z.enum(["EGG", "EGGLESS"]),
        finish: z
          .enum(["STANDARD", "RICE_PAPER", "SHAPE_CAKE", "GUM_PASTE"])
          .default("STANDARD"),
      })
      .optional(),
    cakeMessage: z
      .string()
      .max(60, "Cake message cannot exceed 60 characters")
      .optional(),
  })
  .refine(
    (item) => {
      if (item.kind === "TIERED_CAKE") {
        return Boolean(item.cakeConfig);
      }
      return Boolean(item.variantId);
    },
    {
      message: "Item configuration or variant is required",
    }
  );

export const placeOrderInputSchema = z.object({
  customerDetails: customerDetailsSchema,
  pickupSlotStart: z
    .string()
    .min(1, "Pickup slot time is required")
    .refine((val) => !isNaN(Date.parse(val)), "Invalid pickup time format"),
  items: z
    .array(placeOrderItemSchema)
    .min(1, "At least 1 item is required to place an order")
    .max(20, "An order cannot contain more than 20 items"),
});

export type PlaceOrderSchemaInput = z.infer<typeof placeOrderInputSchema>;

export const lookupOrderTokenSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .min(3, "Order number is required")
    .max(20, "Invalid order number format"),
  phone: z
    .string()
    .trim()
    .min(10, "Phone number must be at least 10 digits"),
});
