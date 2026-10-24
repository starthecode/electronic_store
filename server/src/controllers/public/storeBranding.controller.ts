import type { Request, Response } from "express";
import { getStoreBranding } from "../../services/setting.service.js";
import { successResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getPublicStoreBranding = asyncHandler(
  async (_req: Request, res: Response) =>
    successResponse(
      res,
      "Store branding fetched successfully",
      await getStoreBranding()
    )
);
