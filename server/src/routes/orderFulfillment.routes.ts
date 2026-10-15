import { Router } from "express";

import {
  cancel,
  fulfill,
  fulfillmentSummary,
  listFulfillmentOrders,
  releaseStock,
  reserveStock,
  returnOrderHandler,
} from "../controllers/orderFulfillment.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

import {
  cancelOrderSchema,
  fulfillmentListSchema,
  fulfillmentOrderIdSchema,
  returnOrderSchema,
} from "../validators/orderFulfillment.validator.js";

import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireAuth);

router.post(
  "/:id/reserve-stock",
  requirePermission("orders.update"),
  validate(fulfillmentOrderIdSchema),
  asyncHandler(reserveStock)
);

router.post(
  "/:id/release-stock",
  requirePermission("orders.update"),
  validate(fulfillmentOrderIdSchema),
  asyncHandler(releaseStock)
);

router.post(
  "/:id/fulfill",
  requirePermission("orders.update"),
  validate(fulfillmentOrderIdSchema),
  asyncHandler(fulfill)
);

router.post(
  "/:id/cancel",
  requirePermission("orders.update"),
  validate(cancelOrderSchema),
  asyncHandler(cancel)
);

router.post(
  "/:id/return",
  requirePermission("orders.update"),
  validate(returnOrderSchema),
  asyncHandler(returnOrderHandler)
);

router.get(
  "/",
  requirePermission("orders.read"),
  validate(fulfillmentListSchema),
  asyncHandler(listFulfillmentOrders)
);

router.get(
  "/summary",
  requirePermission("orders.read"),
  asyncHandler(fulfillmentSummary)
);

export default router;