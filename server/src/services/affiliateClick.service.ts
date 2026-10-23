import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { lookupAffiliateLocation } from "../utils/affiliateGeolocation.js";
import {
  hashVisitorCookie,
  makeAffiliateClickData,
  normalizeAffiliateTracking,
  type AffiliateTrackingInput,
} from "../utils/affiliateTracking.js";

export const recordAffiliateClick = async (
  affiliateProductId: string,
  {
    consented,
    visitorCookieValue,
    ip,
    tracking,
  }: {
    consented: boolean;
    visitorCookieValue?: string;
    ip?: string;
    tracking?: AffiliateTrackingInput;
  }
) => {
  const product =
    await prisma.affiliateProduct.findUnique({
      where: {
        id: affiliateProductId,
      },
      select: {
        id: true,
        affiliateUrl: true,
        status: true,
        marketplaceId: true,
      },
    });

  if (!product) {
    throw new AppError(
      "Affiliate product not found",
      404
    );
  }

  if (product.status !== "ACTIVE") {
    throw new AppError(
      "Affiliate product is inactive",
      400
    );
  }

  const visitorSecret = process.env.JWT_SECRET;
  if (consented && !visitorSecret) {
    throw new Error(
      "JWT_SECRET is required to hash consented affiliate visitor IDs"
    );
  }

  const location = consented
    ? await lookupAffiliateLocation(ip)
    : {
        countryCode: null,
        region: null,
        city: null,
      };
  const normalizedTracking = consented
    ? normalizeAffiliateTracking(tracking ?? {})
    : normalizeAffiliateTracking({});

  await prisma.affiliateClick.create({
    data: makeAffiliateClickData({
      product,
      visitorHash:
        consented && visitorCookieValue && visitorSecret
          ? hashVisitorCookie(visitorCookieValue, visitorSecret)
          : null,
      location,
      tracking: normalizedTracking,
    }),
  });

  return {
    affiliateUrl: product.affiliateUrl,
  };
};