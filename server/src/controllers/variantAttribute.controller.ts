import type { Request, Response } from "express";
import {
  assignVariantAttribute,
  getVariantAttributes,
  removeVariantAttribute,
} from "../services/variantAttribute.service.js";
import { successResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const list = asyncHandler(
  async (req: Request, res: Response) => {
    const attributes =
      await getVariantAttributes(
        req.params.productId as string,
        req.params.variantId as string
      );

    return successResponse(
      res,
      "Variant attributes fetched successfully",
      attributes
    );
  }
);

export const assign = asyncHandler(
  async (req: Request, res: Response) => {
    const attribute =
      await assignVariantAttribute(
        req.params.productId as string,
        req.params.variantId as string,
        req.body.attributeValueId
      );

    return successResponse(
      res,
      "Variant attribute assigned successfully",
      attribute,
      201
    );
  }
);

export const remove = asyncHandler(
  async (req: Request, res: Response) => {
    await removeVariantAttribute(
      req.params.productId as string,
      req.params.variantId as string,
      req.params.variantAttributeId as string
    );

    return successResponse(
      res,
      "Variant attribute removed successfully"
    );
  }
);