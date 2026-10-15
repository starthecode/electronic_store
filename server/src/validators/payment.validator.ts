import { z } from "zod";

const paymentStatusEnum = z.enum([
  "PENDING",
  "AUTHORIZED",
  "PAID",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
]);

const paymentMethodEnum = z.enum([
  "COD",
  "CARD",
  "UPI",
  "NET_BANKING",
  "WALLET",
  "OTHER",
]);

export const paymentListSchema = z.object({
  body: z.record(z.string(), z.unknown()).optional(),

  params: z.record(z.string(), z.unknown()).optional(),

  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),

    search: z.string().optional(),

    status: paymentStatusEnum.optional(),

    method: paymentMethodEnum.optional(),

    sortBy: z
      .enum(["createdAt", "amount", "status"])
      .optional(),

    sortOrder: z
      .enum(["asc", "desc"])
      .optional(),
  }),
});

export const paymentIdSchema = z.object({
  body: z.record(z.string(), z.unknown()).optional(),

  params: z.object({
    id: z.uuid(),
  }),

  query: z.record(z.string(), z.unknown()).optional(),
});

export const updatePaymentStatusSchema = z.object({
  body: z.object({
    status: paymentStatusEnum,
  }),

  params: z.object({
    id: z.uuid(),
  }),

  query: z.record(z.string(), z.unknown()).optional(),
});