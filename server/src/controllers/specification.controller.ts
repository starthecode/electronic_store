import type { Request, Response } from "express";
import {
  createProductSpecification,
  createSpecification,
  createSpecificationGroup,
  deleteProductSpecification,
  deleteSpecification,
  deleteSpecificationGroup,
  getProductSpecifications,
  getSpecificationById,
  getSpecificationGroupById,
  getSpecificationGroups,
  getSpecifications,
  updateProductSpecification,
  updateSpecification,
  updateSpecificationGroup,
} from "../services/specification.service.js";
import { successResponse } from "../utils/apiResponse.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";


export const getSpecificationGroupsController = async (
  _req: Request,
  res: Response
) => {
  const data = await getSpecificationGroups();

  return successResponse(
    res,
    "Specification groups fetched successfully",
    data
  );
};

export const getSpecificationGroupByIdController =
  async (req: Request, res: Response) => {
    const data = await getSpecificationGroupById(
      String(req.params.groupId)
    );

    return successResponse(
      res,
      "Specification group fetched successfully",
      data
    );
  };

export const createSpecificationGroupController =
  async (req: AuthenticatedRequest, res: Response) => {
    const data = await createSpecificationGroup(
      req.body,
      req.user!.userId
    );

    return successResponse(
      res,
      "Specification group created successfully",
      data,
      201
    );
  };

export const updateSpecificationGroupController =
  async (req: AuthenticatedRequest, res: Response) => {
    const data = await updateSpecificationGroup(
      String(req.params.groupId),
      req.body,
      req.user!.userId
    );

    return successResponse(
      res,
      "Specification group updated successfully",
      data
    );
  };

export const deleteSpecificationGroupController =
  async (req: AuthenticatedRequest, res: Response) => {
    const data = await deleteSpecificationGroup(
      String(req.params.groupId),
      req.user!.userId
    );

    return successResponse(
      res,
      "Specification group deleted successfully",
      data
    );
  };

export const getSpecificationsController = async (
  req: Request,
  res: Response
) => {
  const data = await getSpecifications(
    String(req.params.groupId)
  );

  return successResponse(
    res,
    "Specifications fetched successfully",
    data
  );
};

export const getSpecificationByIdController =
  async (req: Request, res: Response) => {
    const data = await getSpecificationById(
      String(req.params.specificationId)
    );

    return successResponse(
      res,
      "Specification fetched successfully",
      data
    );
  };

export const createSpecificationController =
  async (req: AuthenticatedRequest, res: Response) => {
    const data = await createSpecification(
      String(req.params.groupId),
      req.body,
      req.user!.userId
    );

    return successResponse(
      res,
      "Specification created successfully",
      data,
      201
    );
  };

export const updateSpecificationController =
  async (req: AuthenticatedRequest, res: Response) => {
    const data = await updateSpecification(
      String(req.params.specificationId),
      req.body,
      req.user!.userId
    );

    return successResponse(
      res,
      "Specification updated successfully",
      data
    );
  };

export const deleteSpecificationController =
  async (req: AuthenticatedRequest, res: Response) => {
    const data = await deleteSpecification(
      String(req.params.specificationId),
      req.user!.userId
    );

    return successResponse(
      res,
      "Specification deleted successfully",
      data
    );
  };

export const getProductSpecificationsController =
  async (req: Request, res: Response) => {
    const data = await getProductSpecifications(
      String(req.params.productId)
    );

    return successResponse(
      res,
      "Product specifications fetched successfully",
      data
    );
  };

export const createProductSpecificationController =
  async (req: AuthenticatedRequest, res: Response) => {
    const data = await createProductSpecification(
      String(req.params.productId),
      req.body,
      req.user!.userId
    );

    return successResponse(
      res,
      "Product specification created successfully",
      data,
      201
    );
  };

export const updateProductSpecificationController =
  async (req: AuthenticatedRequest, res: Response) => {
    const data = await updateProductSpecification(
      String(req.params.productId),
      String(req.params.productSpecificationId),
      req.body,
      req.user!.userId
    );

    return successResponse(
      res,
      "Product specification updated successfully",
      data
    );
  };

export const deleteProductSpecificationController =
  async (req: AuthenticatedRequest, res: Response) => {
    const data = await deleteProductSpecification(
      String(req.params.productId),
      String(req.params.productSpecificationId),
      req.user!.userId
    );

    return successResponse(
      res,
      "Product specification deleted successfully",
      data
    );
  };