import { z } from "zod";

const fulfillmentStatuses = [
  "UNFULFILLED",
  "PARTIALLY_FULFILLED",
  "FULFILLED",
] as const;

const orderStatuses = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURNED",
  "REFUNDED",
] as const;

export const fulfillmentListSchema =
  z.object({
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
      .max(100)
      .optional(),

    fulfillmentStatus: z
      .enum(fulfillmentStatuses)
      .optional(),

    orderStatus: z
      .enum(orderStatuses)
      .optional(),

    sortBy: z
      .enum([
        "createdAt",
        "orderNumber",
      ])
      .default("createdAt"),

    sortOrder: z
      .enum(["asc", "desc"])
      .default("desc"),
  });

export const fulfillmentOrderIdSchema =
  z.object({
    body: z.record(
      z.string(),
      z.unknown()
    ).optional(),

    params: z.object({
      id: z.uuid(),
    }),

    query: z.record(
      z.string(),
      z.unknown()
    ).optional(),
  });

export const cancelOrderSchema = z.object({
  body: z.object({
    note: z
      .string()
      .trim()
      .max(500)
      .optional(),
  }),

  params: z.object({
    id: z.uuid(),
  }),

  query: z.record(
    z.string(),
    z.unknown()
  ).optional(),
});

export const returnOrderSchema =
  cancelOrderSchema;