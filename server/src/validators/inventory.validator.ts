import { z } from "zod";

export const createInventorySchema = z.object({
  body: z.object({
    quantity: z
      .number()
      .int()
      .min(0, "Quantity cannot be negative")
      .default(0),

    reservedQuantity: z
      .number()
      .int()
      .min(0, "Reserved quantity cannot be negative")
      .default(0),

    reorderLevel: z
      .number()
      .int()
      .min(0, "Reorder level cannot be negative")
      .default(0),
  }),
  params: z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid(),
  }),
  query: z.object({}),
});

export const updateInventorySchema = z.object({
  body: z.object({
    reorderLevel: z
      .number()
      .int()
      .min(0, "Reorder level cannot be negative")
      .optional(),
  }),
  params: z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid(),
  }),
  query: z.object({}),
});

export const adjustInventorySchema = z.object({
  body: z.object({
    quantity: z
      .number()
      .int()
      .refine((value) => value !== 0, {
        message: "Quantity cannot be zero",
      }),

    type: z.enum([
      "PURCHASE",
      "SALE",
      "RETURN",
      "ADJUSTMENT",
      "DAMAGE",
      "LOSS",
      "RESTOCK",
    ]),

    reference: z.string().trim().max(255).optional(),

    note: z.string().trim().max(1000).optional(),
  }),
  params: z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid(),
  }),
  query: z.object({}),
});

export const reserveInventorySchema = z.object({
  body: z.object({
    quantity: z.number().int().positive(),

    reference: z.string().trim().max(255).optional(),

    note: z.string().trim().max(1000).optional(),
  }),
  params: z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid(),
  }),
  query: z.object({}),
});

export const releaseInventorySchema = z.object({
  body: z.object({
    quantity: z.number().int().positive(),

    reference: z.string().trim().max(255).optional(),

    note: z.string().trim().max(1000).optional(),
  }),
  params: z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid(),
  }),
  query: z.object({}),
});

export const inventoryTransactionsSchema = z.object({
  body: z.object({}),
  params: z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid(),
  }),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    type: z
      .enum([
        "PURCHASE",
        "SALE",
        "RETURN",
        "ADJUSTMENT",
        "DAMAGE",
        "LOSS",
        "RESTOCK",
        "RESERVATION",
        "RELEASE",
      ])
      .optional(),
  }),
});

export const inventoryListSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().trim().optional(),
    lowStock: z.enum(["true", "false"]).optional(),
  }),
});