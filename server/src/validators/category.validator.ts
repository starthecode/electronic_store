import { z } from "zod";

const uuidSchema = z.uuid();

const categoryStatusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
]);

export const createCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, "Category name must be at least 2 characters")
      .max(100, "Category name cannot exceed 100 characters"),

    slug: z
      .string()
      .trim()
      .min(2)
      .max(120)
      .optional(),

    description: z
      .string()
      .trim()
      .max(1000)
      .optional()
      .nullable(),

    imageUrl: z
      .url("Invalid image URL")
      .optional()
      .nullable(),

    status: categoryStatusSchema
      .optional()
      .default("ACTIVE"),

    parentId: uuidSchema
      .optional()
      .nullable(),
  }),

  params: z.object({}),
  query: z.object({}),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .optional(),

    slug: z
      .string()
      .trim()
      .min(2)
      .max(120)
      .optional(),

    description: z
      .string()
      .trim()
      .max(1000)
      .optional()
      .nullable(),

    imageUrl: z
      .url("Invalid image URL")
      .optional()
      .nullable(),

    status: categoryStatusSchema
      .optional(),

    parentId: uuidSchema
      .optional()
      .nullable(),
  }),

  params: z.object({
    id: uuidSchema,
  }),

  query: z.object({}),
});

export const categoryIdSchema = z.object({
  body: z.object({}),

  params: z.object({
    id: uuidSchema,
  }),

  query: z.object({}),
});

export const listCategoriesSchema = z.object({
  body: z.object({}),

  params: z.object({}),

  query: z.object({
    page: z.coerce
      .number()
      .int()
      .min(1)
      .default(1),

    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20),

    search: z
      .string()
      .trim()
      .optional(),

    status: categoryStatusSchema
      .optional(),

    parentId: uuidSchema
      .optional()
      .nullable(),
  }),
});