import type { Request, Response } from "express";
import {
  createAttribute,
  createAttributeValue,
  deleteAttribute,
  deleteAttributeValue,
  getAttributeById,
  getAttributes,
  updateAttribute,
  updateAttributeValue,
} from "../services/attribute.service.js";
import { successResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";


export const create = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const attribute =
      await createAttribute(req.body, req.user!.userId);

    return successResponse(
      res,
      "Attribute created successfully",
      attribute,
      201
    );
  }
);

export const list = asyncHandler(
  async (_req: Request, res: Response) => {
    const attributes =
      await getAttributes();

    return successResponse(
      res,
      "Attributes fetched successfully",
      attributes
    );
  }
);

export const getById = asyncHandler(
  async (req: Request, res: Response) => {
    const attribute =
      await getAttributeById(
        req.params.id as string
      );

    return successResponse(
      res,
      "Attribute fetched successfully",
      attribute
    );
  }
);

export const update = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const attribute =
      await updateAttribute(
        req.params.id as string,
        req.body,
        req.user!.userId
      );

    return successResponse(
      res,
      "Attribute updated successfully",
      attribute
    );
  }
);

export const remove = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await deleteAttribute(
      req.params.id as string,
      req.user!.userId
    );

    return successResponse(
      res,
      "Attribute deleted successfully"
    );
  }
);

export const createValue = asyncHandler(
  async (req: Request, res: Response) => {
    const value =
      await createAttributeValue(
        req.params.attributeId as string,
        req.body
      );

    return successResponse(
      res,
      "Attribute value created successfully",
      value,
      201
    );
  }
);

export const updateValue = asyncHandler(
  async (req: Request, res: Response) => {
    const value =
      await updateAttributeValue(
        req.params.attributeId as string,
        req.params.valueId as string,
        req.body
      );

    return successResponse(
      res,
      "Attribute value updated successfully",
      value
    );
  }
);

export const removeValue = asyncHandler(
  async (req: Request, res: Response) => {
    await deleteAttributeValue(
      req.params.attributeId as string,
      req.params.valueId as string,
    );

    return successResponse(
      res,
      "Attribute value deleted successfully"
    );
  }
);