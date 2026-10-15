import { z } from "zod";

export const storeProductListQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .max(100000)
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(20),

  search: z
    .string()
    .trim()
    .max(100)
    .optional(),

  categoryId: z
    .string()
    .uuid()
    .optional(),

  brandId: z
    .string()
    .uuid()
    .optional(),

  minPrice: z.coerce
    .number()
    .finite()
    .min(0)
    .optional(),

  maxPrice: z.coerce
    .number()
    .finite()
    .min(0)
    .optional(),

  sortBy: z
    .enum(["createdAt", "name", "price"])
    .default("createdAt"),

  sortOrder: z
    .enum(["asc", "desc"])
    .default("desc"),
}).superRefine((data, ctx) => {
  if (
    data.minPrice !== undefined &&
    data.maxPrice !== undefined &&
    data.minPrice > data.maxPrice
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["minPrice"],
      message: "minPrice cannot be greater than maxPrice",
    });
  }
});

export type StoreProductListQuery = z.infer<
  typeof storeProductListQuerySchema
>;