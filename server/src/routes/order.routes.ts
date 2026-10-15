import { Router } from "express";

import {
  changeFulfillmentStatus,
  changeOrderStatus,
  changePaymentStatus,
  getOrder,
  getOrderSummaryController,
  listOrderStatusHistory,
  listOrders,
} from "../controllers/order.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

import {
  orderIdSchema,
  orderListSchema,
  updateFulfillmentStatusSchema,
  updateOrderStatusSchema,
  updatePaymentStatusSchema,
} from "../validators/order.validator.js";

import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  requirePermission("orders.read"),
  validate(orderListSchema),
  asyncHandler(listOrders)
);

router.patch(
  "/:id/status",
  requirePermission("orders.update"),
  validate(updateOrderStatusSchema),
  asyncHandler(changeOrderStatus)
);

router.patch(
  "/:id/payment-status",
  requirePermission("orders.update"),
  validate(updatePaymentStatusSchema),
  asyncHandler(changePaymentStatus)
);

router.patch(
  "/:id/fulfillment-status",
  requirePermission("orders.update"),
  validate(updateFulfillmentStatusSchema),
  asyncHandler(changeFulfillmentStatus)
);

router.get(
  "/:id/status-history",
  requirePermission("orders.read"),
  validate(orderIdSchema),
  asyncHandler(listOrderStatusHistory)
);

router.get(
  "/summary",
  requirePermission("orders.read"),
  asyncHandler(getOrderSummaryController)
);

router.get(
  "/:id",
  requirePermission("orders.read"),
  validate(orderIdSchema),
  asyncHandler(getOrder)
);

export default router;