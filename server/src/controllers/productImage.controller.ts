import type { Request, Response } from "express";
import {
  createProductImage,
  deleteProductImage,
  getProductImageById,
  getProductImages,
  updateProductImage,
} from "../services/productImage.service.js";
import { successResponse } from "../utils/apiResponse.js";

export const getProductImagesController = async (
  req: Request,
  res: Response
) => {
  const data = await getProductImages(
    String(req.params.productId)
  );

  return successResponse(
    res,
    "Product images fetched successfully",
    data
  );
};

export const getProductImageByIdController = async (
  req: Request,
  res: Response
) => {
  const data = await getProductImageById(
    String(req.params.productId),
    String(req.params.imageId)
  );

  return successResponse(
    res,
    "Product image fetched successfully",
    data
  );
};

export const createProductImageController = async (
  req: Request,
  res: Response
) => {
  const data = await createProductImage(
    String(req.params.productId),
    req.body
  );

  return successResponse(
    res,
    "Product image created successfully",
    data,
    201
  );
};

export const updateProductImageController = async (
  req: Request,
  res: Response
) => {
  const data = await updateProductImage(
    String(req.params.productId),
    String(req.params.imageId),
    req.body
  );

  return successResponse(
    res,
    "Product image updated successfully",
    data
  );
};

export const deleteProductImageController = async (
  req: Request,
  res: Response
) => {
  const data = await deleteProductImage(
    String(req.params.productId),
    String(req.params.imageId)
  );

  return successResponse(
    res,
    "Product image deleted successfully",
    data
  );
};