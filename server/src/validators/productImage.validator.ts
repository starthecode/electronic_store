import { z } from "zod";

const imageParamsSchema = z.object({
  productId: z.string().uuid(),
  imageId: z.string().uuid().optional(),
});

export const createProductImageSchema = z.object({
  body: z.object({
    url: z.string().trim().url("Invalid image URL"),

    altText: z
      .string()
      .trim()
      .max(255, "Alt text cannot exceed 255 characters")
      .optional(),

    sortOrder: z
      .number()
      .int()
      .min(0, "Sort order cannot be negative")
      .optional(),

    isPrimary: z.boolean().optional(),
  }),

  params: z.object({
    productId: z.string().uuid(),
  }),

  query: z.object({}),
});

export const updateProductImageSchema = z.object({
  body: z.object({
    url: z.string().trim().url("Invalid image URL").optional(),

    altText: z
      .string()
      .trim()
      .max(255, "Alt text cannot exceed 255 characters")
      .nullable()
      .optional(),

    sortOrder: z
      .number()
      .int()
      .min(0, "Sort order cannot be negative")
      .optional(),

    isPrimary: z.boolean().optional(),
  }),

  params: imageParamsSchema,

  query: z.object({}),
});

export const deleteProductImageSchema = z.object({
  body: z.object({}),
  params: imageParamsSchema,
  query: z.object({}),
});

export const listProductImagesSchema = z.object({
  body: z.object({}),
  params: z.object({
    productId: z.string().uuid(),
  }),
  query: z.object({}),
});

export const getProductImageByIdSchema = z.object({
  body: z.object({}),
  params: imageParamsSchema,
  query: z.object({}),
});