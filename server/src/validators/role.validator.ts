import { z } from "zod";

const uuidSchema = z.string().uuid();

export const roleIdSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

export const createRoleSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .regex(
        /^[A-Z0-9_]+$/,
        "Role name must contain only uppercase letters, numbers and underscores"
      ),
    description: z.string().trim().max(255).optional(),
  }),
});

export const updateRoleSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2)
        .max(100)
        .regex(
          /^[A-Z0-9_]+$/,
          "Role name must contain only uppercase letters, numbers and underscores"
        )
        .optional(),
      description: z.string().trim().max(255).nullable().optional(),
    })
    .refine(
      (data) => Object.keys(data).length > 0,
      "At least one field is required"
    ),
});

export const assignRolePermissionsSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    permissionIds: z
      .array(uuidSchema)
      .min(1)
      .max(100),
  }),
});

export const rolePermissionSchema = z.object({
  params: z.object({
    id: uuidSchema,
    permissionId: uuidSchema,
  }),
});