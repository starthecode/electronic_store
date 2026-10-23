import type { Request, Response } from "express";
import { recordAffiliateClick } from "../services/affiliateClick.service.js";
import { createVisitorCookieValue } from "../utils/affiliateTracking.js";

const visitorCookieName = "magdeal_affiliate_visitor";
const visitorCookieMaxAge = 30 * 24 * 60 * 60 * 1000;

export const redirectAffiliateProduct = async (
  req: Request,
  res: Response
) => {
  const consented =
    req.body?.analyticsConsent === "accepted";
  const visitorCookieValue = consented
    ? createVisitorCookieValue(req.cookies?.[visitorCookieName])
    : undefined;

  const result = await recordAffiliateClick(
    String(req.params.productId),
    {
      consented,
      visitorCookieValue,
      ip: req.ip,
      tracking: req.body,
    }
  );

  if (consented && visitorCookieValue) {
    res.cookie(visitorCookieName, visitorCookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/affiliate",
      maxAge: visitorCookieMaxAge,
    });
  } else {
    res.clearCookie(visitorCookieName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/affiliate",
    });
  }

  return res.redirect(302, result.affiliateUrl);
};

export const revokeAffiliateAnalytics = (
  _req: Request,
  res: Response
) => {
  res.clearCookie(visitorCookieName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/affiliate",
  });

  return res.status(204).end();
};