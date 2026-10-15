import { z } from "zod";

const uuidSchema = z.uuid();

export const assignVariantAttributeSchema = z.object({
  body: z.object({
    attributeValueId: uuidSchema,
  }),

  params: z.object({
    productId: uuidSchema,
    variantId: uuidSchema,
  }),

  query: z.object({}),
});

export const variantAttributeIdSchema = z.object({
  body: z.object({}),

  params: z.object({
    productId: uuidSchema,
    variantId: uuidSchema,
    variantAttributeId: uuidSchema,
  }),

  query: z.object({}),
});