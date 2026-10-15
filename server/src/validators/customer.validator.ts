import { z } from "zod";

export const customerListSchema = z.object({
  body: z.record(z.string(), z.unknown()).optional(),
  params: z.record(z.string(), z.unknown()).optional(),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
    sortBy: z
      .enum(["firstName", "lastName", "email", "createdAt"])
      .optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  }),
});

export const customerIdSchema = z.object({
  body: z.record(z.string(), z.unknown()).optional(),
  params: z.object({
    id: z.uuid(),
  }),
  query: z.record(z.string(), z.unknown()).optional(),
});

export const updateCustomerStatusSchema = z.object({
  body: z.object({
    status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
  }),
  params: z.object({
    id: z.uuid(),
  }),
  query: z.record(z.string(), z.unknown()).optional(),
});