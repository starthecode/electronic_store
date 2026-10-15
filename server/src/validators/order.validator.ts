import { z } from "zod";

export const orderListSchema = z.object({
  body: z.record(z.string(), z.unknown()).optional(),
  params: z.record(z.string(), z.unknown()).optional(),

  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),

    search: z.string().optional(),

    status: z
      .enum([
        "PENDING",
        "CONFIRMED",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
        "RETURN_REQUESTED",
        "RETURNED",
        "REFUNDED",
      ])
      .optional(),

    paymentStatus: z
      .enum([
        "PENDING",
        "AUTHORIZED",
        "PAID",
        "FAILED",
        "REFUNDED",
        "PARTIALLY_REFUNDED",
      ])
      .optional(),

    fulfillmentStatus: z
      .enum([
        "UNFULFILLED",
        "PARTIALLY_FULFILLED",
        "FULFILLED",
      ])
      .optional(),

    sortBy: z
      .enum(["createdAt", "totalAmount", "orderNumber"])
      .optional(),

    sortOrder: z.enum(["asc", "desc"]).optional(),
  }),
});

export const orderIdSchema = z.object({
  body: z.record(z.string(), z.unknown()).optional(),

  params: z.object({
    id: z.uuid(),
  }),

  query: z.record(z.string(), z.unknown()).optional(),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
      "RETURN_REQUESTED",
      "RETURNED",
      "REFUNDED",
    ]),

    note: z
      .string()
      .trim()
      .max(500)
      .optional(),
  }),

  params: z.object({
    id: z.uuid(),
  }),

  query: z.record(z.string(), z.unknown()).optional(),
});

export const updatePaymentStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      "PENDING",
      "AUTHORIZED",
      "PAID",
      "FAILED",
      "REFUNDED",
      "PARTIALLY_REFUNDED",
    ]),
  }),

  params: z.object({
    id: z.uuid(),
  }),

  query: z.record(z.string(), z.unknown()).optional(),
});

export const updateFulfillmentStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      "UNFULFILLED",
      "PARTIALLY_FULFILLED",
      "FULFILLED",
    ]),
  }),

  params: z.object({
    id: z.uuid(),
  }),

  query: z.record(z.string(), z.unknown()).optional(),
});