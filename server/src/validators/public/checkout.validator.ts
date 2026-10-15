import { z } from "zod";

const cartItemSchema = z.object({
    variantId: z.uuid(),
    quantity: z.number().int().min(1).max(99),
});

export const checkoutSchema = z.object({
    body: z.object({
        items: z.array(cartItemSchema).min(1).max(50),

        shippingAddressId: z.uuid(),

        billingAddressId: z.uuid().optional(),

        paymentMethod: z
            .enum(["COD"])
            .default("COD"),

        discountCode: z
            .string()
            .trim()
            .max(50)
            .optional(),
    }),

    params: z.object({}),

    query: z.record(z.string(), z.unknown()).optional(),
});