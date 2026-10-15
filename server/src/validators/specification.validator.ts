import { z } from "zod";

const groupParamsSchema = z.object({
  groupId: z.string().uuid(),
});

const specificationParamsSchema = z.object({
  specificationId: z.string().uuid(),
});

const productParamsSchema = z.object({
  productId: z.string().uuid(),
});

export const createSpecificationGroupSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(100),
    sortOrder: z.number().int().min(0).optional(),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const updateSpecificationGroupSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    sortOrder: z.number().int().min(0).optional(),
  }),
  params: groupParamsSchema,
  query: z.object({}),
});

export const getSpecificationGroupSchema = z.object({
  body: z.object({}),
  params: groupParamsSchema,
  query: z.object({}),
});

export const deleteSpecificationGroupSchema = z.object({
  body: z.object({}),
  params: groupParamsSchema,
  query: z.object({}),
});

export const createSpecificationSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(150),
  }),
  params: groupParamsSchema,
  query: z.object({}),
});

export const updateSpecificationSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(150),
  }),
  params: specificationParamsSchema,
  query: z.object({}),
});

export const getSpecificationSchema = z.object({
  body: z.object({}),
  params: specificationParamsSchema,
  query: z.object({}),
});

export const deleteSpecificationSchema = z.object({
  body: z.object({}),
  params: specificationParamsSchema,
  query: z.object({}),
});

export const createProductSpecificationSchema = z.object({
  body: z.object({
    specificationId: z.string().uuid(),
    value: z.string().trim().min(1).max(1000),
  }),
  params: productParamsSchema,
  query: z.object({}),
});

export const updateProductSpecificationSchema = z.object({
  body: z.object({
    value: z.string().trim().min(1).max(1000),
  }),
  params: z.object({
    productId: z.string().uuid(),
    productSpecificationId: z.string().uuid(),
  }),
  query: z.object({}),
});

export const deleteProductSpecificationSchema = z.object({
  body: z.object({}),
  params: z.object({
    productId: z.string().uuid(),
    productSpecificationId: z.string().uuid(),
  }),
  query: z.object({}),
});

export const listProductSpecificationsSchema = z.object({
  body: z.object({}),
  params: productParamsSchema,
  query: z.object({}),
});