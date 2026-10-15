import { Router } from "express";
import {
  createProductSpecificationController,
  createSpecificationController,
  createSpecificationGroupController,
  deleteProductSpecificationController,
  deleteSpecificationController,
  deleteSpecificationGroupController,
  getProductSpecificationsController,
  getSpecificationByIdController,
  getSpecificationGroupByIdController,
  getSpecificationGroupsController,
  getSpecificationsController,
  updateProductSpecificationController,
  updateSpecificationController,
  updateSpecificationGroupController,
} from "../controllers/specification.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createProductSpecificationSchema,
  createSpecificationGroupSchema,
  createSpecificationSchema,
  deleteProductSpecificationSchema,
  deleteSpecificationGroupSchema,
  deleteSpecificationSchema,
  getSpecificationGroupSchema,
  getSpecificationSchema,
  listProductSpecificationsSchema,
  updateProductSpecificationSchema,
  updateSpecificationGroupSchema,
  updateSpecificationSchema,
} from "../validators/specification.validator.js";

const router = Router();

router.use(requireAuth);

/* Specification Groups */

router.get(
  "/specification-groups",
  requirePermission("products.read"),
  getSpecificationGroupsController
);

router.get(
  "/specification-groups/:groupId",
  requirePermission("products.read"),
  validate(getSpecificationGroupSchema),
  getSpecificationGroupByIdController
);

router.post(
  "/specification-groups",
  requirePermission("products.update"),
  validate(createSpecificationGroupSchema),
  createSpecificationGroupController
);

router.patch(
  "/specification-groups/:groupId",
  requirePermission("products.update"),
  validate(updateSpecificationGroupSchema),
  updateSpecificationGroupController
);

router.delete(
  "/specification-groups/:groupId",
  requirePermission("products.update"),
  validate(deleteSpecificationGroupSchema),
  deleteSpecificationGroupController
);

/* Specifications */

router.get(
  "/specification-groups/:groupId/specifications",
  requirePermission("products.read"),
  validate(getSpecificationGroupSchema),
  getSpecificationsController
);

router.get(
  "/specifications/:specificationId",
  requirePermission("products.read"),
  validate(getSpecificationSchema),
  getSpecificationByIdController
);

router.post(
  "/specification-groups/:groupId/specifications",
  requirePermission("products.update"),
  validate(createSpecificationSchema),
  createSpecificationController
);

router.patch(
  "/specifications/:specificationId",
  requirePermission("products.update"),
  validate(updateSpecificationSchema),
  updateSpecificationController
);

router.delete(
  "/specifications/:specificationId",
  requirePermission("products.update"),
  validate(deleteSpecificationSchema),
  deleteSpecificationController
);

/* Product Specifications */

router.get(
  "/products/:productId/specifications",
  requirePermission("products.read"),
  validate(listProductSpecificationsSchema),
  getProductSpecificationsController
);

router.post(
  "/products/:productId/specifications",
  requirePermission("products.update"),
  validate(createProductSpecificationSchema),
  createProductSpecificationController
);

router.patch(
  "/products/:productId/specifications/:productSpecificationId",
  requirePermission("products.update"),
  validate(updateProductSpecificationSchema),
  updateProductSpecificationController
);

router.delete(
  "/products/:productId/specifications/:productSpecificationId",
  requirePermission("products.update"),
  validate(deleteProductSpecificationSchema),
  deleteProductSpecificationController
);

export default router;