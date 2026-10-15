import type { Request, Response } from "express";
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
} from "../services/product.service.js";
import { successResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export const create = asyncHandler(
  async (req: AuthenticatedRequest, res) => {
    const product = await createProduct(
      req.body,
      req.user!.userId
    );

    return successResponse(
      res,
      "Product created successfully",
      product,
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
      typeof req.query.status === "string" &&
      [
        "DRAFT",
        "ACTIVE",
        "INACTIVE",
        "ARCHIVED",
      ].includes(req.query.status)
        ? (req.query.status as
            | "DRAFT"
            | "ACTIVE"
            | "INACTIVE"
            | "ARCHIVED")
        : undefined;

    const categoryId =
      typeof req.query.categoryId ===
      "string"
        ? req.query.categoryId
        : undefined;

    const brandId =
      typeof req.query.brandId ===
      "string"
        ? req.query.brandId
        : undefined;

    const minPrice =
  req.query.minPrice !== undefined
    ? Number(req.query.minPrice)
    : undefined;

const maxPrice =
  req.query.maxPrice !== undefined
    ? Number(req.query.maxPrice)
    : undefined;

const sortBy =
  req.query.sortBy === "name" ||
  req.query.sortBy === "updatedAt"
    ? req.query.sortBy
    : "createdAt";

const sortOrder =
  req.query.sortOrder === "asc"
    ? "asc"
    : "desc";

    const result = await getProducts({
      page,
      limit,
      search,
      status,
      categoryId,
      brandId,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder,
    });

    return successResponse(
      res,
      "Products fetched successfully",
      result
    );
  }
);

export const getById = asyncHandler(
  async (req: Request, res: Response) => {
    const product =
      await getProductById(
        req.params.id as string
      );

    return successResponse(
      res,
      "Product fetched successfully",
      product
    );
  }
);

export const update = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const product =
      await updateProduct(
        req.params.id as string,
        req.body,
        req.user!.userId
      );

    return successResponse(
      res,
      "Product updated successfully",
      product
    );
  }
);

export const remove = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await deleteProduct(
      req.params.id as string, req.user!.userId
    );

    return successResponse(
      res,
      "Product deleted successfully"
    );
  }
);