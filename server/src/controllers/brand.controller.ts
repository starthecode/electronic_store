import type { Request, Response } from "express";
import {
  createBrand,
  deleteBrand,
  getBrandById,
  getBrands,
  updateBrand,
} from "../services/brand.service.js";
import { successResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";


export const create = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const brand = await createBrand(req.body, req.user!.userId);

    return successResponse(
      res,
      "Brand created successfully",
      brand,
      201
    );
  }
);

export const list = asyncHandler(
  async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const search =
      typeof req.query.search === "string"
        ? req.query.search
        : undefined;

    const status =
      req.query.status === "ACTIVE" ||
      req.query.status === "INACTIVE"
        ? req.query.status
        : undefined;

    const result = await getBrands({
      page,
      limit,
      search,
      status,
    });

    return successResponse(
      res,
      "Brands fetched successfully",
      result
    );
  }
);

export const getById = asyncHandler(
  async (req: Request, res: Response) => {
    const brand = await getBrandById(req.params.id as string);

    return successResponse(
      res,
      "Brand fetched successfully",
      brand
    );
  }
);

export const update = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const brand = await updateBrand(
      req.params.id as string,
      req.body,
      req.user!.userId
    );

    return successResponse(
      res,
      "Brand updated successfully",
      brand
    );
  }
);

export const remove = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await deleteBrand(req.params.id as string, req.user!.userId);
    return successResponse(
      res,
      "Brand deleted successfully"
    );
  }
);