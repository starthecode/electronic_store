import type { Request, Response } from "express";
import { recordAffiliateClick } from "../services/affiliateClick.service.js";

export const redirectAffiliateProduct = async (
  req: Request,
  res: Response
) => {
  const ip =
    req.ip ||
    req.headers["x-forwarded-for"]?.toString().split(",")[0];

  const userAgent = req.headers["user-agent"];
  const referrer = req.headers["referer"];

  const result = await recordAffiliateClick(
    String(req.params.productId),
    ip,
    userAgent,
    referrer
  );

  return res.redirect(302, result.affiliateUrl);
};