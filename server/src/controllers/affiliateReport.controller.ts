import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

import {
  getAffiliateMarketplaceReport,
  getAffiliateOverview,
  getAffiliateProductReport,
  getAffiliateBreakdownReport,
  getAffiliateTrendReport,
} from "../services/affiliateReport.service.js";

import { successResponse } from "../utils/apiResponse.js";

export const affiliateOverview = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const data = await getAffiliateOverview({
    from: req.query.from as string | undefined,
    to: req.query.to as string | undefined,
  });

  return successResponse(
    res,
    "Affiliate overview fetched successfully",
    data
  );
};

export const affiliateProducts = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const data = await getAffiliateProductReport({
    from: req.query.from as string | undefined,
    to: req.query.to as string | undefined,
    page: Number(req.query.page ?? 1),
    limit: Number(req.query.limit ?? 20),
    search: req.query.search as string | undefined,
    marketplaceId:
      req.query.marketplaceId as string | undefined,
    categoryId:
      req.query.categoryId as string | undefined,
    brandId:
      req.query.brandId as string | undefined,
  });

  return successResponse(
    res,
    "Affiliate product report fetched successfully",
    data
  );
};

export const affiliateMarketplaces = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const data = await getAffiliateMarketplaceReport({
    from: req.query.from as string | undefined,
    to: req.query.to as string | undefined,
  });

  return successResponse(
    res,
    "Affiliate marketplace report fetched successfully",
    data
  );
};

export const affiliateTrends = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const data = await getAffiliateTrendReport({
    from: req.query.from as string | undefined,
    to: req.query.to as string | undefined,
  });

  return successResponse(
    res,
    "Affiliate trend report fetched successfully",
    data
  );
};

export const affiliateBreakdowns = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const data = await getAffiliateBreakdownReport({
    from: req.query.from as string | undefined,
    to: req.query.to as string | undefined,
  });

  return successResponse(
    res,
    "Affiliate attribution breakdowns fetched successfully",
    data
  );
};