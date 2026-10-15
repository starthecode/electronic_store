import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import { getStoreCategories } from "../../services/public/storeCategory.service.js";

export const listStoreCategories = asyncHandler(
  async (_req: Request, res: Response) => {
    const categories = await getStoreCategories();

    return successResponse(
      res,
      "Store categories fetched successfully",
      categories
    );
  }
);