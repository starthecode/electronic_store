import { Router } from "express";
import { getDashboardInventoryController, getDashboardOverviewController, getDashboardSalesController, getDashboardTopProductsController } from "../controllers/dashboard.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.middleware.js";
import { dashboardSalesSchema, dashboardTopProductsSchema } from "../validators/dashboard.validator.js";

const router = Router();

router.get(
  "/overview",
  requireAuth,
  requirePermission("dashboard.view"),
  asyncHandler(getDashboardOverviewController)
);

router.get(
  "/sales",
  requireAuth,
  requirePermission("dashboard.view"),
  validate(dashboardSalesSchema),
  asyncHandler(getDashboardSalesController)
);

router.get(
  "/inventory",
  requireAuth,
  requirePermission("dashboard.view"),
  asyncHandler(getDashboardInventoryController)
);

router.get(
  "/top-products",
  requireAuth,
  requirePermission("dashboard.view"),
  validate(dashboardTopProductsSchema),
  asyncHandler(getDashboardTopProductsController)
);

export default router;