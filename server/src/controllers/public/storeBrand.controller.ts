import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import { getStoreBrands } from "../../services/public/storeBrand.service.js";

export const listStoreBrands = asyncHandler(
  async (_req: Request, res: Response) => {
    const brands = await getStoreBrands();

    return successResponse(
      res,
      "Store brands fetched successfully",
      brands
    );
  }
);