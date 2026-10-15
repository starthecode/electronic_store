import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import {
  assignRolePermissionsSchema,
  roleIdSchema,
  rolePermissionSchema,
} from "../validators/role.validator.js";

import {
  assignPermissionsController,
  listPermissions,
  listRolePermissions,
  removePermissionController,
} from "../controllers/permission.controller.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  requirePermission("users.read"),
  asyncHandler(listPermissions)
);

router.get(
  "/roles/:id",
  validate(roleIdSchema),
  requirePermission("users.read"),
  asyncHandler(listRolePermissions)
);

router.post(
  "/roles/:id",
  validate(assignRolePermissionsSchema),
  requirePermission("users.update"),
  asyncHandler(assignPermissionsController)
);

router.delete(
  "/roles/:id/:permissionId",
  validate(rolePermissionSchema),
  requirePermission("users.update"),
  asyncHandler(removePermissionController)
);

export default router;