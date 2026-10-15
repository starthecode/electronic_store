import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUserById,
  getAdminUsers,
  updateAdminUser,
  updateAdminUserRole,
  updateAdminUserStatus,
} from "../services/adminUser.service.js";
import { successResponse } from "../utils/apiResponse.js";

export const listAdminUsers = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const result = await getAdminUsers({
    page,
    limit,
    search:
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : undefined,
    status:
      typeof req.query.status === "string"
        ? (req.query.status as
            | "ACTIVE"
            | "INACTIVE"
            | "SUSPENDED")
        : undefined,
    roleId:
      typeof req.query.roleId === "string"
        ? req.query.roleId
        : undefined,
    sortBy:
      typeof req.query.sortBy === "string"
        ? (req.query.sortBy as
            | "firstName"
            | "lastName"
            | "email"
            | "createdAt")
        : undefined,
    sortOrder:
      req.query.sortOrder === "asc" ||
      req.query.sortOrder === "desc"
        ? req.query.sortOrder
        : undefined,
  });

  return successResponse(
    res,
    "Admin users fetched successfully",
    result
  );
};

export const getAdminUser = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const user = await getAdminUserById(String(req.params.id));

  return successResponse(
    res,
    "Admin user fetched successfully",
    user
  );
};

export const createAdminUserController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const user = await createAdminUser(
    req.body,
    req.user!.userId
  );

  return successResponse(
    res,
    "Admin user created successfully",
    user,
    201
  );
};

export const updateAdminUserController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const user = await updateAdminUser(
    String(req.params.id),
    req.body,
    req.user!.userId
  );

  return successResponse(
    res,
    "Admin user updated successfully",
    user
  );
};

export const updateAdminUserStatusController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const user = await updateAdminUserStatus(
    String(req.params.id),
    req.body.status,
    req.user!.userId
  );

  return successResponse(
    res,
    "Admin user status updated successfully",
    user
  );
};

export const updateAdminUserRoleController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const user = await updateAdminUserRole(
    String(req.params.id),
    req.body.roleId,
    req.user!.userId
  );

  return successResponse(
    res,
    "Admin user role updated successfully",
    user
  );
};

export const deleteAdminUserController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  await deleteAdminUser(
    String(req.params.id),
    req.user!.userId
  );

  return successResponse(
    res,
    "Admin user deleted successfully"
  );
};