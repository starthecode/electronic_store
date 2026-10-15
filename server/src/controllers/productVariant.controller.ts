import type { Request, Response } from "express";
import {
  createProductVariant,
  deleteProductVariant,
  getProductVariantById,
  getProductVariants,
  updateProductVariant,
} from "../services/productVariant.service.js";
import { successResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";


export const create = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const variant = await createProductVariant(
      req.params.productId as string,
      req.body,
      req.user!.userId
    );

    return successResponse(
      res,
      "Product variant created successfully",
      variant,
      201
    );
  }
);

export const list = asyncHandler(
  async (req: Request, res: Response) => {
    const page =
      Number(req.query.page) || 1;

    const limit =
      Number(req.query.limit) || 20;

    const search =
      typeof req.query.search === "string"
        ? req.query.search
        : undefined;

    const status =
      [
        "DRAFT",
        "ACTIVE",
        "INACTIVE",
        "ARCHIVED",
      ].includes(String(req.query.status))
        ? (req.query.status as
            | "DRAFT"
            | "ACTIVE"
            | "INACTIVE"
            | "ARCHIVED")
        : undefined;

    const result =
      await getProductVariants(
        req.params.productId as string,
        {
          page,
          limit,
          search,
          status,
        }
      );

    return successResponse(
      res,
      "Product variants fetched successfully",
      result
    );
  }
);

export const getById = asyncHandler(
  async (req: Request, res: Response) => {
    const variant =
      await getProductVariantById(
        req.params.productId as string,
        req.params.variantId as string
      );

    return successResponse(
      res,
      "Product variant fetched successfully",
      variant
    );
  }
);

export const update = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const variant =
      await updateProductVariant(
        req.params.productId as string,
        req.params.variantId as string,
        req.body,
        req.user!.userId
      );

    return successResponse(
      res,
      "Product variant updated successfully",
      variant
    );
  }
);

export const remove = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await deleteProductVariant(
      req.params.productId as string,
      req.params.variantId as string,
      req.user!.userId
    );
    return successResponse(
      res,
      "Product variant deleted successfully"
    );
  }
);