import { z } from "zod";

const httpUrl = z
  .string()
  .trim()
  .max(2048)
  .url()
  .refine((value) => {
    const url = new URL(value);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password
    );
  }, "URL must use HTTP or HTTPS");

const destinationUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    if (/[\u0000-\u001f\u007f]/.test(value)) return false;
    if (value.startsWith("/") && !value.startsWith("//")) {
      try {
        return new URL(value, "https://magdeal.invalid").origin ===
          "https://magdeal.invalid";
      } catch {
        return false;
      }
    }

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
  }, "Destination must be a storefront path or HTTP/HTTPS URL");

const slideFields = {
  brandName: z.string().trim().max(100).nullable().optional(),
  title: z.string().trim().min(1).max(150),
  titleHighlight: z.string().trim().max(150).nullable().optional(),
  description: z.string().trim().min(1).max(1500),
  featureBullets: z.array(z.string().trim().min(1).max(180)).max(8).optional(),
  specText: z.string().trim().max(180).nullable().optional(),
  priceLabel: z.string().trim().max(60).nullable().optional(),
  price: z.string().trim().max(60).nullable().optional(),
  variantLabels: z.array(z.string().trim().min(1).max(60)).max(8).optional(),
  buttonLabel: z.string().trim().min(1).max(60),
  buttonUrl: destinationUrl,
  imageUrl: httpUrl,
  mobileImageUrl: httpUrl.nullable().optional(),
  backgroundImageUrl: httpUrl.nullable().optional(),
  backgroundColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable()
    .optional(),
  sortOrder: z.number().int().min(0).max(10000).optional(),
  isActive: z.boolean().optional(),
};

const testimonialFields = {
  customerName: z.string().trim().min(1).max(120),
  customerRole: z.string().trim().min(1).max(150),
  text: z.string().trim().min(1).max(2000),
  rating: z.number().int().min(1).max(5),
  avatarUrl: httpUrl.nullable().optional(),
  sortOrder: z.number().int().min(0).max(10000).optional(),
  isActive: z.boolean().optional(),
};

const idParams = z.object({ id: z.string().uuid() });
const reorderBody = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
});

export const listHomepageTemplatesSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({}),
});

export const createHomepageSlideSchema = z.object({
  body: z.object(slideFields),
  params: z.object({}),
  query: z.object({}),
});

export const updateHomepageSlideSchema = z.object({
  body: z.object(slideFields).partial().refine(
    (data) => Object.keys(data).length > 0,
    "At least one field is required"
  ),
  params: idParams,
  query: z.object({}),
});

export const deleteHomepageSlideSchema = z.object({
  body: z.object({}),
  params: idParams,
  query: z.object({}),
});

export const reorderHomepageSlidesSchema = z.object({
  body: reorderBody,
  params: z.object({}),
  query: z.object({}),
});

export const createTestimonialSchema = z.object({
  body: z.object(testimonialFields),
  params: z.object({}),
  query: z.object({}),
});

export const updateTestimonialSchema = z.object({
  body: z.object(testimonialFields).partial().refine(
    (data) => Object.keys(data).length > 0,
    "At least one field is required"
  ),
  params: idParams,
  query: z.object({}),
});

export const deleteTestimonialSchema = z.object({
  body: z.object({}),
  params: idParams,
  query: z.object({}),
});

export const reorderTestimonialsSchema = z.object({
  body: reorderBody,
  params: z.object({}),
  query: z.object({}),
});
