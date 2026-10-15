import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import {
  createRole,
  deleteRole,
  getRoleById,
  getRoles,
  updateRole,
} from "../services/role.service.js";
import { successResponse } from "../utils/apiResponse.js";

export const listRoles = async (
  _req: AuthenticatedRequest,
  res: Response
) => {
  const roles = await getRoles();

  return successResponse(
    res,
    "Roles fetched successfully",
    roles
  );
};

export const getRole = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const role = await getRoleById(String(req.params.id));

  return successResponse(
    res,
    "Role fetched successfully",
    role
  );
};

export const createRoleController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const role = await createRole(
    req.body,
    req.user!.userId
  );

  return successResponse(
    res,
    "Role created successfully",
    role,
    201
  );
};

export const updateRoleController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const role = await updateRole(
    String(req.params.id),
    req.body,
    req.user!.userId
  );

  return successResponse(
    res,
    "Role updated successfully",
    role
  );
};

export const deleteRoleController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  await deleteRole(
    String(req.params.id),
    req.user!.userId
  );

  return successResponse(
    res,
    "Role deleted successfully"
  );
};