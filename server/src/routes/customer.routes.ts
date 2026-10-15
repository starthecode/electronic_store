import { Router } from "express";

import {
  changeCustomerStatus,
  getCustomer,
  listCustomerAddresses,
  listCustomerOrders,
  listCustomers,
} from "../controllers/customer.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

import {
  customerIdSchema,
  customerListSchema,
  updateCustomerStatusSchema,
} from "../validators/customer.validator.js";

import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  requirePermission("customers.read"),
  validate(customerListSchema),
  asyncHandler(listCustomers)
);

router.get(
  "/:id",
  requirePermission("customers.read"),
  validate(customerIdSchema),
  asyncHandler(getCustomer)
);

router.patch(
  "/:id/status",
  requirePermission("customers.update"),
  validate(updateCustomerStatusSchema),
  asyncHandler(changeCustomerStatus)
);

router.get(
  "/:id/orders",
  requirePermission("customers.read"),
  validate(customerIdSchema),
  asyncHandler(listCustomerOrders)
);

router.get(
  "/:id/addresses",
  requirePermission("customers.read"),
  validate(customerIdSchema),
  asyncHandler(listCustomerAddresses)
);

export default router;