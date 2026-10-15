import { Router } from "express";
import {
  assign,
  list,
  remove,
} from "../controllers/variantAttribute.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  assignVariantAttributeSchema,
  variantAttributeIdSchema,
} from "../validators/variantAttribute.validator.js";

const router = Router();

router.get(
  "/:productId/variants/:variantId/attributes",
  requireAuth,
  requirePermission("products.read"),
  list
);

router.post(
  "/:productId/variants/:variantId/attributes",
  requireAuth,
  requirePermission("products.update"),
  validate(assignVariantAttributeSchema),
  assign
);

router.delete(
  "/:productId/variants/:variantId/attributes/:variantAttributeId",
  requireAuth,
  requirePermission("products.update"),
  validate(variantAttributeIdSchema),
  remove
);

export default router;