import { z } from "zod";

const dateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Date must be in YYYY-MM-DD format"
  );

export const dashboardSalesSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    from: dateSchema.optional(),
    to: dateSchema.optional(),
  }),
});

export const dashboardTopProductsSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    from: dateSchema.optional(),
    to: dateSchema.optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }),
});