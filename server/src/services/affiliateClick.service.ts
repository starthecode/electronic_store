import crypto from "node:crypto";
import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";

const IP_HASH_SECRET =
  process.env.IP_HASH_SECRET || "development-ip-hash-secret";

const hashIp = (ip?: string) => {
  if (!ip) {
    return null;
  }

  return crypto
    .createHash("sha256")
    .update(`${IP_HASH_SECRET}:${ip}`)
    .digest("hex");
};

export const recordAffiliateClick = async (
  affiliateProductId: string,
  ip?: string,
  userAgent?: string,
  referrer?: string
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

  await prisma.affiliateClick.create({
    data: {
      affiliateProductId: product.id,
      marketplaceId: product.marketplaceId,
      ipHash: hashIp(ip),
      userAgent: userAgent?.slice(0, 1000) || null,
      referrer: referrer?.slice(0, 2000) || null,
    },
  });

  return {
    affiliateUrl: product.affiliateUrl,
  };
};