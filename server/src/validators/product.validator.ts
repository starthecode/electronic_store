import { z } from "zod";

const uuidSchema = z.uuid();
const productStatusSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "INACTIVE",
  "ARCHIVED",
]);

const moneySchema = z
  .coerce
  .number()
  .min(0)
  .max(9999999999.99);

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(200),

    slug: z.string().trim().min(2).max(220).optional(),

    description: z
      .string()
      .trim()
      .max(10000)
      .optional()
      .nullable(),

    shortDescription: z
      .string()
      .trim()
      .max(1000)
      .optional()
      .nullable(),

    categoryId: uuidSchema,

    brandId: uuidSchema.optional().nullable(),

    status: productStatusSchema
      .optional()
      .default("DRAFT"),
  }),

  params: z.object({}),
  query: z.object({}),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(200).optional(),

    slug: z.string().trim().min(2).max(220).optional(),

    description: z
      .string()
      .trim()
      .max(10000)
      .optional()
      .nullable(),

    shortDescription: z
      .string()
      .trim()
      .max(1000)
      .optional()
      .nullable(),

    categoryId: uuidSchema.optional(),

    brandId: uuidSchema.optional().nullable(),

    status: productStatusSchema.optional(),
  }),

  params: z.object({
    id: uuidSchema,
  }),

  query: z.object({}),
});

export const productIdSchema = z.object({
  body: z.object({}),
  params: z.object({
    id: uuidSchema,
  }),
  query: z.object({}),
});

export const listProductsSchema = z.object({
  body: z.object({}),

  params: z.object({}),

  query: z.object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),

    search: z.string().trim().optional(),

    status: productStatusSchema.optional(),

    categoryId: uuidSchema.optional(),

    brandId: uuidSchema.optional(),

    sortBy: z
      .enum(["createdAt", "name"])
      .default("createdAt"),

    sortOrder: z
      .enum(["asc", "desc"])
      .default("desc"),
  }),
});