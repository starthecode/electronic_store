import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js"; 

import {
  adminUserIdSchema,
  adminUserListSchema,
  createAdminUserSchema,
  updateAdminUserRoleSchema,
  updateAdminUserSchema,
  updateAdminUserStatusSchema,
} from "../validators/adminUser.validator.js";

import {
  createAdminUserController,
  deleteAdminUserController,
  getAdminUser,
  listAdminUsers,
  updateAdminUserController,
  updateAdminUserRoleController,
  updateAdminUserStatusController,
} from "../controllers/adminUser.controller.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  validate(adminUserListSchema),
  requirePermission("users.read"),
  asyncHandler(listAdminUsers)
);

router.get(
  "/:id",
  validate(adminUserIdSchema),
  requirePermission("users.read"),
  asyncHandler(getAdminUser)
);

router.post(
  "/",
  validate(createAdminUserSchema),
  requirePermission("users.create"),
  asyncHandler(createAdminUserController)
);

router.patch(
  "/:id",
  validate(updateAdminUserSchema),
  requirePermission("users.update"),
  asyncHandler(updateAdminUserController)
);

router.patch(
  "/:id/status",
  validate(updateAdminUserStatusSchema),
  requirePermission("users.update"),
  asyncHandler(updateAdminUserStatusController)
);

router.patch(
  "/:id/role",
  validate(updateAdminUserRoleSchema),
  requirePermission("users.update"),
  asyncHandler(updateAdminUserRoleController)
);

router.delete(
  "/:id",
  validate(adminUserIdSchema),
  requirePermission("users.delete"),
  asyncHandler(deleteAdminUserController)
);

export default router;