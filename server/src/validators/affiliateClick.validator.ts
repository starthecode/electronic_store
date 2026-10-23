import { z } from "zod";

export const trackAffiliateClickSchema = z.object({
  body: z.object({
    analyticsConsent: z.literal("accepted").optional(),
    referrerHost: z.string().max(253).optional(),
    utmSource: z.string().max(200).optional(),
    utmMedium: z.string().max(200).optional(),
    utmCampaign: z.string().max(200).optional(),
    utmContent: z.string().max(200).optional(),
    landingPath: z.string().max(500).optional(),
  }),
  params: z.object({
    productId: z.string().uuid(),
  }),
  query: z.object({}),
});