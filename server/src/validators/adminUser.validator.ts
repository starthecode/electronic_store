import { z } from "zod";

const uuidSchema = z.string().uuid();

const userStatusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
]);

export const adminUserListSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().trim().optional(),
    status: userStatusSchema.optional(),
    roleId: uuidSchema.optional(),
    sortBy: z
      .enum(["firstName", "lastName", "email", "createdAt"])
      .optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  }),
});

export const adminUserIdSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

export const createAdminUserSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().max(100).optional(),
    email: z.string().trim().email().max(255),
    phone: z.string().trim().max(30).optional(),
    password: z.string().min(8).max(100),
    roleId: uuidSchema,
    status: userStatusSchema.optional(),
  }),
});

export const updateAdminUserSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z
    .object({
      firstName: z.string().trim().min(1).max(100).optional(),
      lastName: z.string().trim().max(100).nullable().optional(),
      email: z.string().trim().email().max(255).optional(),
      phone: z.string().trim().max(30).nullable().optional(),
      password: z.string().min(8).max(100).optional(),
    })
    .refine(
      (data) => Object.keys(data).length > 0,
      "At least one field is required"
    ),
});

export const updateAdminUserStatusSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    status: userStatusSchema,
  }),
});

export const updateAdminUserRoleSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    roleId: uuidSchema,
  }),
});