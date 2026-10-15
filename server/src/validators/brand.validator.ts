import { z } from "zod";

const uuidSchema = z.uuid();
const brandStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export const createBrandSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    slug: z.string().trim().min(2).max(120).optional(),
    description: z.string().trim().max(1000).optional().nullable(),
    logoUrl: z.url("Invalid logo URL").optional().nullable(),
    status: brandStatusSchema.optional().default("ACTIVE"),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const updateBrandSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    slug: z.string().trim().min(2).max(120).optional(),
    description: z.string().trim().max(1000).optional().nullable(),
    logoUrl: z.url("Invalid logo URL").optional().nullable(),
    status: brandStatusSchema.optional(),
  }),
  params: z.object({
    id: uuidSchema,
  }),
  query: z.object({}),
});

export const brandIdSchema = z.object({
  body: z.object({}),
  params: z.object({
    id: uuidSchema,
  }),
  query: z.object({}),
});

export const listBrandsSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().optional(),
    status: brandStatusSchema.optional(),
  }),
});