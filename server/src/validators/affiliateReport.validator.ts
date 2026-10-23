import { z } from "zod";

const dateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Date must be in YYYY-MM-DD format"
  )
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }, "Date must be a valid calendar date");

const dateRangeSchema = z
  .object({
    from: dateSchema.optional(),
    to: dateSchema.optional(),
  })
  .refine(
    ({ from, to }) => !from || !to || from <= to,
    "From date must be on or before to date"
  );

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