import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import {
  assignRolePermissions,
  getPermissions,
  getRolePermissions,
  removeRolePermission,
} from "../services/permission.service.js";
import { successResponse } from "../utils/apiResponse.js";

export const listPermissions = async (
  _req: AuthenticatedRequest,
  res: Response
) => {
  const permissions = await getPermissions();

  return successResponse(
    res,
    "Permissions fetched successfully",
    permissions
  );
};

export const listRolePermissions = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const permissions = await getRolePermissions(
    String(req.params.id)
  );

  return successResponse(
    res,
    "Role permissions fetched successfully",
    permissions
  );
};

export const assignPermissionsController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const permissions = await assignRolePermissions(
    String(req.params.id),
    req.body.permissionIds,
    req.user!.userId
  );

  return successResponse(
    res,
    "Permissions assigned successfully",
    permissions
  );
};

export const removePermissionController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  await removeRolePermission(
    String(req.params.id),
    String(req.params.permissionId),
    req.user!.userId
  );

  return successResponse(
    res,
    "Permission removed successfully"
  );
};