import { z } from "zod";

const uuidSchema = z.uuid();

const moneySchema = z
  .coerce
  .number()
  .min(0)
  .max(9999999999.99);

export const createProductVariantSchema = z.object({
  body: z.object({
    name: z.string().trim().max(200).optional().nullable(),

    sku: z.string().trim().min(2).max(100),

    price: moneySchema,

    compareAtPrice: moneySchema.optional().nullable(),

    costPrice: moneySchema.optional().nullable(),

    status: z
      .enum([
        "DRAFT",
        "ACTIVE",
        "INACTIVE",
        "ARCHIVED",
      ])
      .optional()
      .default("ACTIVE"),
  }),

  params: z.object({
    productId: uuidSchema,
  }),

  query: z.object({}),
});

export const updateProductVariantSchema = z.object({
  body: z.object({
    name: z.string().trim().max(200).optional().nullable(),

    sku: z.string().trim().min(2).max(100).optional(),

    price: moneySchema.optional(),

    compareAtPrice: moneySchema.optional().nullable(),

    costPrice: moneySchema.optional().nullable(),

    status: z
      .enum([
        "DRAFT",
        "ACTIVE",
        "INACTIVE",
        "ARCHIVED",
      ])
      .optional(),
  }),

  params: z.object({
    productId: uuidSchema,
    variantId: uuidSchema,
  }),

  query: z.object({}),
});

export const productVariantIdSchema = z.object({
  body: z.object({}),

  params: z.object({
    productId: uuidSchema,
    variantId: uuidSchema,
  }),

  query: z.object({}),
});

export const listProductVariantsSchema = z.object({
  body: z.object({}),

  params: z.object({
    productId: uuidSchema,
  }),

  query: z.object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),

    search: z.string().trim().optional(),

    status: z
      .enum([
        "DRAFT",
        "ACTIVE",
        "INACTIVE",
        "ARCHIVED",
      ])
      .optional(),
  }),
});