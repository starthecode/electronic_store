import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import {
  createAffiliateMarketplace,
  deleteAffiliateMarketplace,
  getAffiliateMarketplaceById,
  getAffiliateMarketplaces,
  updateAffiliateMarketplace,
} from "../services/affiliateMarketplace.service.js";
import { successResponse } from "../utils/apiResponse.js";

export const listAffiliateMarketplaces = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const marketplaces =
    await getAffiliateMarketplaces({
      status:
        req.query.status === "ACTIVE" ||
        req.query.status === "INACTIVE"
          ? req.query.status
          : undefined,
      search:
        typeof req.query.search === "string"
          ? req.query.search.trim()
          : undefined,
    });

  return successResponse(
    res,
    "Affiliate marketplaces fetched successfully",
    marketplaces
  );
};

export const getAffiliateMarketplace = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const marketplace =
    await getAffiliateMarketplaceById(String(req.params.id));

  return successResponse(
    res,
    "Affiliate marketplace fetched successfully",
    marketplace
  );
};

export const createAffiliateMarketplaceController =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const marketplace =
      await createAffiliateMarketplace(
        req.body,
        req.user!.userId
      );

    return successResponse(
      res,
      "Affiliate marketplace created successfully",
      marketplace,
      201
    );
  };

export const updateAffiliateMarketplaceController =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const marketplace =
      await updateAffiliateMarketplace(
        String(req.params.id),
        req.body,
        req.user!.userId
      );

    return successResponse(
      res,
      "Affiliate marketplace updated successfully",
      marketplace
    );
  };

export const deleteAffiliateMarketplaceController =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    await deleteAffiliateMarketplace(
      String(req.params.id),
      req.user!.userId
    );

    return successResponse(
      res,
      "Affiliate marketplace deleted successfully"
    );
  };