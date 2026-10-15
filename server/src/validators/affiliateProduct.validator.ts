import { z } from "zod";

const uuidSchema = z.string().uuid();

const statusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
]);

export const affiliateProductListSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().trim().optional(),
    marketplaceId: uuidSchema.optional(),
    categoryId: uuidSchema.optional(),
    brandId: uuidSchema.optional(),
    status: statusSchema.optional(),
    sortBy: z
      .enum([
        "name",
        "displayPrice",
        "createdAt",
        "updatedAt",
      ])
      .optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  }),
});

export const affiliateProductIdSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

export const createAffiliateProductSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(255),

    slug: z
      .string()
      .trim()
      .min(2)
      .max(255)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must contain only lowercase letters, numbers and hyphens"
      ),

    shortDescription: z
      .string()
      .trim()
      .max(1000)
      .optional(),

    description: z.string().optional(),

    imageUrl: z.string().url().optional(),

    categoryId: uuidSchema.optional(),
    brandId: uuidSchema.optional(),

    marketplaceId: uuidSchema,

    externalProductId: z
      .string()
      .trim()
      .max(255)
      .optional(),

    productUrl: z.string().url().optional(),

    affiliateUrl: z.string().url(),

    displayPrice: z
      .number()
      .nonnegative()
      .optional(),

    status: statusSchema.optional(),
  }),
});

export const updateAffiliateProductSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),

  body: z
    .object({
      name: z.string().trim().min(2).max(255).optional(),

      slug: z
        .string()
        .trim()
        .min(2)
        .max(255)
        .regex(
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
          "Slug must contain only lowercase letters, numbers and hyphens"
        )
        .optional(),

      shortDescription: z
        .string()
        .trim()
        .max(1000)
        .nullable()
        .optional(),

      description: z.string().nullable().optional(),

      imageUrl: z.string().url().nullable().optional(),

      categoryId: uuidSchema.nullable().optional(),
      brandId: uuidSchema.nullable().optional(),

      marketplaceId: uuidSchema.optional(),

      externalProductId: z
        .string()
        .trim()
        .max(255)
        .nullable()
        .optional(),

      productUrl: z.string().url().nullable().optional(),

      affiliateUrl: z.string().url().optional(),

      displayPrice: z
        .number()
        .nonnegative()
        .nullable()
        .optional(),
    })
    .refine(
      (data) => Object.keys(data).length > 0,
      "At least one field is required"
    ),
});

export const updateAffiliateProductStatusSchema =
  z.object({
    params: z.object({
      id: uuidSchema,
    }),

    body: z.object({
      status: statusSchema,
    }),
  });