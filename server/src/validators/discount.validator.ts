import { z } from "zod";

const uuidSchema = z.uuid();

const discountTypeSchema = z.enum([
  "PERCENTAGE",
  "FIXED_AMOUNT",
]);

const discountScopeSchema = z.enum([
  "ORDER",
  "PRODUCT",
  "CATEGORY",
]);

const discountStatusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
  "EXPIRED",
]);

const moneySchema = z.coerce
  .number()
  .min(0)
  .max(9999999999.99);

export const createDiscountSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(200),

    code: z
      .string()
      .trim()
      .min(2)
      .max(50)
      .transform((value) =>
        value.toUpperCase()
      ),

    type: discountTypeSchema,

    scope: discountScopeSchema,

    status: discountStatusSchema
      .optional()
      .default("ACTIVE"),

    value: moneySchema,

    minimumAmount: moneySchema
      .optional()
      .nullable(),

    maximumDiscount: moneySchema
      .optional()
      .nullable(),

    usageLimit: z
      .coerce
      .number()
      .int()
      .min(1)
      .optional()
      .nullable(),

    startsAt: z.coerce.date(),

    expiresAt: z.coerce
      .date()
      .optional()
      .nullable(),
  }),

  params: z.object({}),
  query: z.object({}),
});

export const updateDiscountSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(200).optional(),

    code: z
      .string()
      .trim()
      .min(2)
      .max(50)
      .transform((value) =>
        value.toUpperCase()
      )
      .optional(),

    type: discountTypeSchema.optional(),

    scope: discountScopeSchema.optional(),

    status: discountStatusSchema.optional(),

    value: moneySchema.optional(),

    minimumAmount: moneySchema
      .optional()
      .nullable(),

    maximumDiscount: moneySchema
      .optional()
      .nullable(),

    usageLimit: z
      .coerce
      .number()
      .int()
      .min(1)
      .optional()
      .nullable(),

    startsAt: z.coerce.date().optional(),

    expiresAt: z.coerce
      .date()
      .optional()
      .nullable(),
  }),

  params: z.object({
    id: uuidSchema,
  }),

  query: z.object({}),
});

export const discountIdSchema = z.object({
  body: z.object({}),

  params: z.object({
    id: uuidSchema,
  }),

  query: z.object({}),
});

export const listDiscountsSchema = z.object({
  body: z.object({}),
  params: z.object({}),

  query: z.object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),

    search: z.string().trim().optional(),

    type: discountTypeSchema.optional(),

    scope: discountScopeSchema.optional(),

    status: discountStatusSchema.optional(),
  }),
});

export const discountProductSchema = z.object({
  body: z.object({
    productId: uuidSchema,
  }),

  params: z.object({
    discountId: uuidSchema,
  }),

  query: z.object({}),
});

export const discountProductIdSchema = z.object({
  body: z.object({}),

  params: z.object({
    discountId: uuidSchema,
    productId: uuidSchema,
  }),

  query: z.object({}),
});

export const discountCategorySchema = z.object({
  body: z.object({
    categoryId: uuidSchema,
  }),

  params: z.object({
    discountId: uuidSchema,
  }),

  query: z.object({}),
});

export const discountCategoryIdSchema = z.object({
  body: z.object({}),

  params: z.object({
    discountId: uuidSchema,
    categoryId: uuidSchema,
  }),

  query: z.object({}),
});