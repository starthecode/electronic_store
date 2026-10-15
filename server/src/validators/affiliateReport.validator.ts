import { z } from "zod";

const dateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Date must be in YYYY-MM-DD format"
  );

const dateRangeSchema = z.object({
  from: dateSchema.optional(),
  to: dateSchema.optional(),
});

export const affiliateReportDateRangeSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: dateRangeSchema,
});

export const affiliateProductReportSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: dateRangeSchema.extend({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().trim().optional(),
    marketplaceId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    brandId: z.string().uuid().optional(),
  }),
});

export const affiliateMarketplaceReportSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: dateRangeSchema,
});