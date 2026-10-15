import { Router } from "express";
import {
  create,
  getById,
  list,
  remove,
  update,
} from "../controllers/productVariant.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createProductVariantSchema,
  listProductVariantsSchema,
  productVariantIdSchema,
  updateProductVariantSchema,
} from "../validators/productVariant.validator.js";

const router = Router();

router.get(
  "/:productId/variants",
  requireAuth,
  requirePermission("products.read"),
  validate(listProductVariantsSchema),
  list
);

router.get(
  "/:productId/variants/:variantId",
  requireAuth,
  requirePermission("products.read"),
  validate(productVariantIdSchema),
  getById
);

router.post(
  "/:productId/variants",
  requireAuth,
  requirePermission("products.update"),
  validate(createProductVariantSchema),
  create
);

router.patch(
  "/:productId/variants/:variantId",
  requireAuth,
  requirePermission("products.update"),
  validate(updateProductVariantSchema),
  update
);

router.delete(
  "/:productId/variants/:variantId",
  requireAuth,
  requirePermission("products.update"),
  validate(productVariantIdSchema),
  remove
);

export default router;