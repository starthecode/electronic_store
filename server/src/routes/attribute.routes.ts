import { Router } from "express";
import {
  create,
  createValue,
  getById,
  list,
  remove,
  removeValue,
  update,
  updateValue,
} from "../controllers/attribute.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  attributeIdSchema,
  attributeValueIdSchema,
  createAttributeSchema,
  createAttributeValueSchema,
  updateAttributeSchema,
  updateAttributeValueSchema,
} from "../validators/attribute.validator.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  requirePermission("products.read"),
  list
);

router.get(
  "/:id",
  requireAuth,
  requirePermission("products.read"),
  validate(attributeIdSchema),
  getById
);

router.post(
  "/",
  requireAuth,
  requirePermission("products.update"),
  validate(createAttributeSchema),
  create
);

router.patch(
  "/:id",
  requireAuth,
  requirePermission("products.update"),
  validate(updateAttributeSchema),
  update
);

router.delete(
  "/:id",
  requireAuth,
  requirePermission("products.update"),
  validate(attributeIdSchema),
  remove
);

router.post(
  "/:attributeId/values",
  requireAuth,
  requirePermission("products.update"),
  validate(createAttributeValueSchema),
  createValue
);

router.patch(
  "/:attributeId/values/:valueId",
  requireAuth,
  requirePermission("products.update"),
  validate(updateAttributeValueSchema),
  updateValue
);

router.delete(
  "/:attributeId/values/:valueId",
  requireAuth,
  requirePermission("products.update"),
  validate(attributeValueIdSchema),
  removeValue
);

export default router;