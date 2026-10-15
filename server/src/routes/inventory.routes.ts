import { Router } from "express";
import {
  adjustInventoryController,
  createInventoryController,
  getInventoryController,
  getInventoryListController,
  getInventorySummaryController,
  getInventoryTransactionsController,
  releaseInventoryController,
  reserveInventoryController,
  updateInventoryController,
} from "../controllers/inventory.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  adjustInventorySchema,
  createInventorySchema,
  inventoryListSchema,
  inventoryTransactionsSchema,
  releaseInventorySchema,
  reserveInventorySchema,
  updateInventorySchema,
} from "../validators/inventory.validator.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/products/:productId/variants/:variantId/inventory",
  requirePermission("inventory.read"),
  validate(createInventorySchema),
  getInventoryController
);

router.get(
  "/inventory",
  requirePermission("inventory.read"),
  validate(inventoryListSchema),
  getInventoryListController
);

router.post(
  "/products/:productId/variants/:variantId/inventory",
  requirePermission("inventory.update"),
  validate(createInventorySchema),
  createInventoryController
);

router.patch(
  "/products/:productId/variants/:variantId/inventory",
  requirePermission("inventory.update"),
  validate(updateInventorySchema),
  updateInventoryController
);

router.post(
  "/products/:productId/variants/:variantId/inventory/adjust",
  requirePermission("inventory.update"),
  validate(adjustInventorySchema),
  adjustInventoryController
);

router.post(
  "/products/:productId/variants/:variantId/inventory/reserve",
  requirePermission("inventory.update"),
  validate(reserveInventorySchema),
  reserveInventoryController
);

router.post(
  "/products/:productId/variants/:variantId/inventory/release",
  requirePermission("inventory.update"),
  validate(releaseInventorySchema),
  releaseInventoryController
);

router.get(
  "/inventory/summary",
  requirePermission("inventory.read"),
  getInventorySummaryController
);

router.get(
  "/products/:productId/variants/:variantId/inventory/transactions",
  requirePermission("inventory.read"),
  validate(inventoryTransactionsSchema),
  getInventoryTransactionsController
);

export default router;