import type { Request, Response } from "express";
import {
  createDiscount,
  deleteDiscount,
  getDiscountById,
  getDiscounts,
  getDiscountUsage,
  updateDiscount,
} from "../services/discount.service.js";
import {
  addDiscountCategory,
  addDiscountProduct,
  getDiscountCategories,
  getDiscountProducts,
  removeDiscountCategory,
  removeDiscountProduct,
} from "../services/discountAssignment.service.js";
import { successResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";


export const create = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const discount =
      await createDiscount(req.body, req.user!.userId);

    return successResponse(
      res,
      "Discount created successfully",
      discount,
      201
    );
  }
);

export const list = asyncHandler(
  async (req: Request, res: Response) => {
    const result =
      await getDiscounts({
        page:
          Number(req.query.page) || 1,
        limit:
          Number(req.query.limit) || 20,
        search:
          typeof req.query.search ===
          "string"
            ? req.query.search
            : undefined,
        type:
          typeof req.query.type ===
          "string"
            ? (req.query.type as
                | "PERCENTAGE"
                | "FIXED_AMOUNT")
            : undefined,
        scope:
          typeof req.query.scope ===
          "string"
            ? (req.query.scope as
                | "ORDER"
                | "PRODUCT"
                | "CATEGORY")
            : undefined,
        status:
          typeof req.query.status ===
          "string"
            ? (req.query.status as
                | "ACTIVE"
                | "INACTIVE"
                | "EXPIRED")
            : undefined,
      });

    return successResponse(
      res,
      "Discounts fetched successfully",
      result
    );
  }
);

export const getById = asyncHandler(
  async (req: Request, res: Response) => {
    const discount =
      await getDiscountById(
        req.params.id as string
      );

    return successResponse(
      res,
      "Discount fetched successfully",
      discount
    );
  }
);

export const update = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const discount =
      await updateDiscount(
        req.params.id as string,
        req.body,
        req.user!.userId
      );

    return successResponse(
      res,
      "Discount updated successfully",
      discount
    );
  }
);

export const remove = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await deleteDiscount(
      req.params.id as string,
      req.user!.userId
    );

    return successResponse(
      res,
      "Discount deleted successfully"
    );
  }
);

export const products = asyncHandler(
  async (req: Request, res: Response) => {
    const result =
      await getDiscountProducts(
        req.params.discountId as string
      );

    return successResponse(
      res,
      "Discount products fetched successfully",
      result
    );
  }
);

export const addProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const result =
      await addDiscountProduct(
        req.params.discountId as string,
        req.body.productId
      );

    return successResponse(
      res,
      "Product assigned to discount successfully",
      result,
      201
    );
  }
);

export const removeProduct = asyncHandler(
  async (req: Request, res: Response) => {
    await removeDiscountProduct(
      req.params.discountId as string,
      req.params.productId as string
    );

    return successResponse(
      res,
      "Product removed from discount successfully"
    );
  }
);

export const categories = asyncHandler(
  async (req: Request, res: Response) => {
    const result =
      await getDiscountCategories(
        req.params.discountId as string
      );

    return successResponse(
      res,
      "Discount categories fetched successfully",
      result
    );
  }
);

export const addCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const result =
      await addDiscountCategory(
        req.params.discountId as string,
        req.body.categoryId
      );

    return successResponse(
      res,
      "Category assigned to discount successfully",
      result,
      201
    );
  }
);

export const removeCategory =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      await removeDiscountCategory(
        req.params.discountId as string,
        req.params.categoryId as string
      );

      return successResponse(
        res,
        "Category removed from discount successfully"
      );
    }
  );

export const usage = asyncHandler(
  async (req: Request, res: Response) => {
    const result =
      await getDiscountUsage(
        req.params.discountId as string,
        Number(req.query.page) || 1,
        Number(req.query.limit) || 20
      );

    return successResponse(
      res,
      "Discount usage fetched successfully",
      result
    );
  }
);