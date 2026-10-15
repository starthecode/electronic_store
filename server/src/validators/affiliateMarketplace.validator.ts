import { z } from "zod";

const uuidSchema = z.string().uuid();

const statusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
]);

export const affiliateMarketplaceIdSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

export const affiliateMarketplaceListSchema = z.object({
  query: z.object({
    status: statusSchema.optional(),
    search: z.string().trim().optional(),
  }),
});

export const createAffiliateMarketplaceSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    code: z
      .string()
      .trim()
      .min(2)
      .max(50)
      .regex(
        /^[A-Z0-9_]+$/,
        "Code must contain only uppercase letters, numbers and underscores"
      ),
    logoUrl: z.string().url().optional(),
    baseUrl: z.string().url().optional(),
    status: statusSchema.optional(),
  }),
});

export const updateAffiliateMarketplaceSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z
    .object({
      name: z.string().trim().min(2).max(100).optional(),
      code: z
        .string()
        .trim()
        .min(2)
        .max(50)
        .regex(
          /^[A-Z0-9_]+$/,
          "Code must contain only uppercase letters, numbers and underscores"
        )
        .optional(),
      logoUrl: z.string().url().nullable().optional(),
      baseUrl: z.string().url().nullable().optional(),
      status: statusSchema.optional(),
    })
    .refine(
      (data) => Object.keys(data).length > 0,
      "At least one field is required"
    ),
});