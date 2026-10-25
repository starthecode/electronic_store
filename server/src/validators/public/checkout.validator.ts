import { z } from "zod";

const cartItemSchema = z.object({
    variantId: z.uuid(),
    quantity: z.number().int().min(1).max(99),
});

export const checkoutSchema = z.object({
    body: z.object({
        requestId: z.uuid(),
        items: z.array(cartItemSchema).min(1).max(50),

        shippingAddressId: z.uuid(),

        billingAddressId: z.uuid().optional(),

        paymentMethod: z
            .enum(["COD", "UPI", "CARD"]),

        discountCode: z
            .string()
            .trim()
            .max(50)
            .optional(),
        checkoutNotes: z.string().trim().max(1000).optional(),
        gstDetails: z.object({
            businessName: z.string().trim().min(1).max(150),
            gstin: z.string().trim().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i),
        }).optional(),
    }),

    params: z.object({}),

    query: z.record(z.string(), z.unknown()).optional(),
});

export const checkoutQuoteSchema = z.object({
    body: z.object({
        items: z.array(cartItemSchema).min(1).max(50),
        shippingAddressId: z.uuid(),
        billingAddressId: z.uuid().optional(),
        discountCode: z.string().trim().max(50).optional(),
    }),
    params: z.object({}),
    query: z.record(z.string(), z.unknown()).optional(),
});

export const checkoutPaymentStatusSchema = z.object({
    body: z.object({}),
    params: z.object({ orderId: z.uuid() }),
    query: z.record(z.string(), z.unknown()).optional(),
});