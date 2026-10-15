import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

import {
  createAffiliateProduct,
  deleteAffiliateProduct,
  getAffiliateProductById,
  getAffiliateProducts,
  updateAffiliateProduct,
  updateAffiliateProductStatus,
} from "../services/affiliateProduct.service.js";

import { successResponse } from "../utils/apiResponse.js";

export const listAffiliateProducts = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const result = await getAffiliateProducts({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,

    search:
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : undefined,

    marketplaceId:
      typeof req.query.marketplaceId === "string"
        ? req.query.marketplaceId
        : undefined,

    categoryId:
      typeof req.query.categoryId === "string"
        ? req.query.categoryId
        : undefined,

    brandId:
      typeof req.query.brandId === "string"
        ? req.query.brandId
        : undefined,

    status:
      req.query.status === "ACTIVE" ||
      req.query.status === "INACTIVE"
        ? req.query.status
        : undefined,

    sortBy:
      typeof req.query.sortBy === "string"
        ? (req.query.sortBy as
            | "name"
            | "displayPrice"
            | "createdAt"
            | "updatedAt")
        : undefined,

    sortOrder:
      req.query.sortOrder === "asc" ||
      req.query.sortOrder === "desc"
        ? req.query.sortOrder
        : undefined,
  });

  return successResponse(
    res,
    "Affiliate products fetched successfully",
    result
  );
};

export const getAffiliateProduct = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const product =
    await getAffiliateProductById(String(req.params.id));

  return successResponse(
    res,
    "Affiliate product fetched successfully",
    product
  );
};

export const createAffiliateProductController =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const product =
      await createAffiliateProduct(
        req.body,
        req.user!.userId
      );

    return successResponse(
      res,
      "Affiliate product created successfully",
      product,
      201
    );
  };

export const updateAffiliateProductController =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const product =
      await updateAffiliateProduct(
        String(req.params.id),
        req.body,
        req.user!.userId
      );

    return successResponse(
      res,
      "Affiliate product updated successfully",
      product
    );
  };

export const updateAffiliateProductStatusController =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const product =
      await updateAffiliateProductStatus(
        String(req.params.id),
        req.body.status,
        req.user!.userId
      );

    return successResponse(
      res,
      "Affiliate product status updated successfully",
      product
    );
  };

export const deleteAffiliateProductController =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    await deleteAffiliateProduct(
      String(req.params.id),
      req.user!.userId
    );

    return successResponse(
      res,
      "Affiliate product deleted successfully"
    );
  };