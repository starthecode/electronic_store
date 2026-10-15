import { z } from "zod";

const uuidSchema = z.uuid();

export const createAttributeSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
  }),

  params: z.object({}),
  query: z.object({}),
});

export const updateAttributeSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
  }),

  params: z.object({
    id: uuidSchema,
  }),

  query: z.object({}),
});

export const attributeIdSchema = z.object({
  body: z.object({}),

  params: z.object({
    id: uuidSchema,
  }),

  query: z.object({}),
});

export const createAttributeValueSchema = z.object({
  body: z.object({
    value: z.string().trim().min(1).max(100),
  }),

  params: z.object({
    attributeId: uuidSchema,
  }),

  query: z.object({}),
});

export const updateAttributeValueSchema = z.object({
  body: z.object({
    value: z.string().trim().min(1).max(100),
  }),

  params: z.object({
    attributeId: uuidSchema,
    valueId: uuidSchema,
  }),

  query: z.object({}),
});

export const attributeValueIdSchema = z.object({
  body: z.object({}),

  params: z.object({
    attributeId: uuidSchema,
    valueId: uuidSchema,
  }),

  query: z.object({}),
});