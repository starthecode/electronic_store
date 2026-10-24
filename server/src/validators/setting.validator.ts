import { z } from "zod";

const settingCategoryEnum = z.enum([
  "GENERAL",
  "STORE",
  "CURRENCY",
  "TAX",
  "SHIPPING",
  "ORDERS",
  "INVENTORY",
  "PAYMENTS",
  "AFFILIATE",
  "NOTIFICATIONS",
  "SYSTEM",
]);

const settingValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.unknown()),
  z.record(z.string(), z.unknown()),
  z.null(),
]);

export const createSettingSchema = z.object({
  body: z.object({
    key: z
      .string()
      .trim()
      .min(1)
      .max(150)
      .regex(
        /^[a-zA-Z0-9._-]+$/,
        "Key may only contain letters, numbers, dots, underscores and hyphens"
      ),

    value: settingValueSchema,

    category: settingCategoryEnum,

    isSensitive: z.boolean().optional(),

    description: z
      .string()
      .trim()
      .max(500)
      .optional(),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const updateSettingSchema = z.object({
  body: z.object({
    value: settingValueSchema.optional(),

    category: settingCategoryEnum.optional(),

    isSensitive: z.boolean().optional(),

    description: z
      .string()
      .trim()
      .max(500)
      .nullable()
      .optional(),
  }),
  params: z.object({
    key: z.string().min(1),
  }),
  query: z.object({}),
});

export const settingKeySchema = z.object({
  body: z.object({}),
  params: z.object({
    key: z.string().min(1),
  }),
  query: z.object({}),
});

export const listSettingsSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    category: settingCategoryEnum.optional(),
    search: z.string().trim().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

const publicImageUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return (
        ["http:", "https:"].includes(url.protocol) &&
        !url.username &&
        !url.password
      );
    } catch {
      return false;
    }
  }, "Logo URL must be a valid HTTP or HTTPS URL");

export const storeBrandingSchema = z.object({
  body: z.object({
    logoUrl: publicImageUrl,
    storeName: z.string().trim().min(1).max(100),
    logoAltText: z.string().trim().max(200),
  }),
  params: z.object({}),
  query: z.object({}),
});