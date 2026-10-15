import type { Request, Response } from "express";

import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
  updateCategory,
} from "../services/category.service.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";


import { successResponse } from "../utils/apiResponse.js";

export const create = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const category = await createCategory(
    req.body,
    req.user!.userId
  );

  return successResponse(
    res,
    "Category created successfully",
    category,
    201
  );
};

export const list = async (
  req: Request,
  res: Response
) => {
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

  const parentId =
    typeof req.query.parentId === "string"
      ? req.query.parentId
      : undefined;

  const result = await getCategories({
    page,
    limit,
    search,
    status,
    parentId,
  });

  return successResponse(
    res,
    "Categories fetched successfully",
    result
  );
};

export const getById = async (
  req: Request,
  res: Response
) => {
  const category =
    await getCategoryById(req.params.id as string);

  return successResponse(
    res,
    "Category fetched successfully",
    category
  );
};

export const update = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const category =
    await updateCategory(
      req.params.id as string,
      req.body,
      req.user!.userId
    );

  return successResponse(
    res,
    "Category updated successfully",
    category
  );
};

export const remove = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  await deleteCategory(
    req.params.id as string,req.user!.userId
  );
  return successResponse(
    res,
    "Category deleted successfully"
  );
};