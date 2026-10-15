import { Router } from "express";
import {
  create,
  getById,
  list,
  remove,
  update,
} from "../controllers/product.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createProductSchema,
  listProductsSchema,
  productIdSchema,
  updateProductSchema,
} from "../validators/product.validator.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  requirePermission("products.read"),
  validate(listProductsSchema),
  list
);

router.get(
  "/:id",
  requireAuth,
  requirePermission("products.read"),
  validate(productIdSchema),
  getById
);

router.post(
  "/",
  requireAuth,
  requirePermission("products.create"),
  validate(createProductSchema),
  create
);

router.patch(
  "/:id",
  requireAuth,
  requirePermission("products.update"),
  validate(updateProductSchema),
  update
);

router.delete(
  "/:id",
  requireAuth,
  requirePermission("products.delete"),
  validate(productIdSchema),
  remove
);

export default router;