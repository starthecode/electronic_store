import { z } from "zod";

export const trackAffiliateClickSchema = z.object({
  body: z.object({}),
  params: z.object({
    productId: z.string().uuid(),
  }),
  query: z.object({}),
});