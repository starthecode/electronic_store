import { Router } from "express";

import {
  create,
  remove,
  getById,
  list,
  update,
} from "../controllers/category.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

import {
  categoryIdSchema,
  createCategorySchema,
  listCategoriesSchema,
  updateCategorySchema,
} from "../validators/category.validator.js";

import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  requirePermission("categories.read"),
  validate(listCategoriesSchema),
  asyncHandler(list)
);

router.get(
  "/:id",
  requireAuth,
  requirePermission("categories.read"),
  validate(categoryIdSchema),
  asyncHandler(getById)
);

router.post(
  "/",
  requireAuth,
  requirePermission("categories.create"),
  validate(createCategorySchema),
  asyncHandler(create)
);

router.patch(
  "/:id",
  requireAuth,
  requirePermission("categories.update"),
  validate(updateCategorySchema),
  asyncHandler(update)
);

router.delete(
  "/:id",
  requireAuth,
  requirePermission("categories.delete"),
  validate(categoryIdSchema),
  asyncHandler(remove)
);

export default router;