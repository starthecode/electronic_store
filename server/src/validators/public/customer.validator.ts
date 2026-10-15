import { z } from "zod";

const record = z.record(z.string(), z.unknown()).optional();
const body = z.object({ type: z.enum(["SHIPPING", "BILLING"]), firstName: z.string().trim().min(1).max(100), lastName: z.string().trim().max(100).optional(), phone: z.string().trim().min(5).max(30), addressLine1: z.string().trim().min(1).max(255), addressLine2: z.string().trim().max(255).optional(), city: z.string().trim().min(1).max(100), state: z.string().trim().min(1).max(100), postalCode: z.string().trim().min(3).max(20), country: z.string().trim().min(1).max(100).optional(), isDefault: z.boolean().optional() });
export const profileSchema = z.object({ body: z.object({ firstName: z.string().trim().min(1).max(100), lastName: z.string().trim().max(100).optional(), phone: z.string().trim().min(5).max(30).optional() }), params: record, query: record });
export const createAddressSchema = z.object({
    body,
    params: z.object({}),
    query: record,
});

export const updateAddressSchema = z.object({
    body,
    params: z.object({
        id: z.uuid(),
    }),
    query: record,
});

export const addressIdSchema = z.object({
    body: record,
    params: z.object({
        id: z.uuid(),
    }),
    query: record,
});
export const orderListSchema = z.object({ body: record, params: record, query: z.object({ page: z.string().optional(), limit: z.string().optional() }) });
export const orderIdSchema = z.object({ body: record, params: z.object({ id: z.uuid() }), query: record });
