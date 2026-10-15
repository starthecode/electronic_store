import { z } from "zod";

const noteBody = z.object({
    note: z
        .string()
        .trim()
        .max(500)
        .optional(),
});

export const customerOrderIdSchema =
    z.object({
        body: z.record(
            z.string(),
            z.unknown()
        ),
        params: z.object({
            id: z.uuid(),
        }),
        query: z.record(
            z.string(),
            z.unknown()
        ),
    });

export const customerOrderActionSchema =
    z.object({
        body: noteBody,
        params: z.object({
            id: z.uuid(),
        }),
        query: z.record(
            z.string(),
            z.unknown()
        ),
    });