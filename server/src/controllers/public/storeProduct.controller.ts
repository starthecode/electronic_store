import type { Request, Response } from "express";

import {
  getStoreProductBySlug,
  getStoreProducts,
} from "../../services/public/storeProduct.service.js";

import { successResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  storeProductListQuerySchema,
} from "../../validators/public/storeProduct.validator.js";

export const listStoreProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const query = storeProductListQuerySchema.parse(
      req.query,
    );

    const result = await getStoreProducts(query);

    return successResponse(
      res,
      "Store products fetched successfully",
      result,
    );
  },
);

export const getStoreProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const slug = String(req.params.slug || "")
      .trim()
      .toLowerCase();

    if (!slug || slug.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Invalid product slug",
      });
    }

    const product =
      await getStoreProductBySlug(slug);

    return successResponse(
      res,
      "Store product fetched successfully",
      product,
    );
  },
);