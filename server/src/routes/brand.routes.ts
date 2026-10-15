import { Router } from "express";
import {
  create,
  getById,
  list,
  remove,
  update,
} from "../controllers/brand.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  brandIdSchema,
  createBrandSchema,
  listBrandsSchema,
  updateBrandSchema,
} from "../validators/brand.validator.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  requirePermission("brands.read"),
  validate(listBrandsSchema),
  list
);

router.get(
  "/:id",
  requireAuth,
  requirePermission("brands.read"),
  validate(brandIdSchema),
  getById
);

router.post(
  "/",
  requireAuth,
  requirePermission("brands.create"),
  validate(createBrandSchema),
  create
);

router.patch(
  "/:id",
  requireAuth,
  requirePermission("brands.update"),
  validate(updateBrandSchema),
  update
);

router.delete(
  "/:id",
  requireAuth,
  requirePermission("brands.delete"),
  validate(brandIdSchema),
  remove
);

export default router;