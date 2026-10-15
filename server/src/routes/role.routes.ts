import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import {
  createRoleSchema,
  roleIdSchema,
  updateRoleSchema,
} from "../validators/role.validator.js";

import {
  createRoleController,
  deleteRoleController,
  getRole,
  listRoles,
  updateRoleController,
} from "../controllers/role.controller.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  requirePermission("users.read"),
  asyncHandler(listRoles)
);

router.get(
  "/:id",
  validate(roleIdSchema),
  requirePermission("users.read"),
  asyncHandler(getRole)
);

router.post(
  "/",
  validate(createRoleSchema),
  requirePermission("users.create"),
  asyncHandler(createRoleController)
);

router.patch(
  "/:id",
  validate(updateRoleSchema),
  requirePermission("users.update"),
  asyncHandler(updateRoleController)
);

router.delete(
  "/:id",
  validate(roleIdSchema),
  requirePermission("users.delete"),
  asyncHandler(deleteRoleController)
);

export default router;