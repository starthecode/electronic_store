import { z } from "zod";

export const auditLogListSchema = z.object({
  body: z.record(z.string(), z.unknown()).optional(),

  params: z.record(z.string(), z.unknown()).optional(),

  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),

    action: z
      .enum([
        "CREATE",
        "UPDATE",
        "DELETE",
        "LOGIN",
        "LOGOUT",
        "STATUS_CHANGE",
        "STOCK_ADJUSTMENT",
        "PASSWORD_CHANGE",
      ])
      .optional(),

    entity: z.string().trim().max(100).optional(),

    entityId: z.uuid().optional(),

    userId: z.uuid().optional(),

    search: z.string().trim().max(200).optional(),

    from: z.string().optional(),

    to: z.string().optional(),

    sortOrder: z
      .enum(["asc", "desc"])
      .optional(),
  }),
});

export const auditLogIdSchema = z.object({
  body: z.record(z.string(), z.unknown()).optional(),

  params: z.object({
    id: z.uuid(),
  }),

  query: z.record(z.string(), z.unknown()).optional(),
});