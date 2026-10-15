import { Router } from "express";

import {
  changePaymentStatus,
  getPayment,
  getPaymentSummaryController,
  listPayments,
} from "../controllers/payment.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

import {
  paymentIdSchema,
  paymentListSchema,
  updatePaymentStatusSchema,
} from "../validators/payment.validator.js";

import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  requirePermission("payments.read"),
  validate(paymentListSchema),
  asyncHandler(listPayments)
);

router.get(
  "/summary",
  requirePermission("payments.read"),
  asyncHandler(getPaymentSummaryController)
);

router.patch(
  "/:id/status",
  requirePermission("payments.update"),
  validate(updatePaymentStatusSchema),
  asyncHandler(changePaymentStatus)
);

router.get(
  "/:id",
  requirePermission("payments.read"),
  validate(paymentIdSchema),
  asyncHandler(getPayment)
);

export default router;