import { Router } from "express";

import {
  affiliateMarketplaces,
  affiliateOverview,
  affiliateProducts,
  affiliateTrends,
} from "../controllers/affiliateReport.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import {
  affiliateMarketplaceReportSchema,
  affiliateProductReportSchema,
  affiliateReportDateRangeSchema,
} from "../validators/affiliateReport.validator.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/overview",
  requirePermission("affiliate_reports.read"),
  validate(affiliateReportDateRangeSchema),
  asyncHandler(affiliateOverview)
);

router.get(
  "/products",
  requirePermission("affiliate_reports.read"),
  validate(affiliateProductReportSchema),
  asyncHandler(affiliateProducts)
);

router.get(
  "/marketplaces",
  requirePermission("affiliate_reports.read"),
  validate(affiliateMarketplaceReportSchema),
  asyncHandler(affiliateMarketplaces)
);

router.get(
  "/trends",
  requirePermission("affiliate_reports.read"),
  validate(affiliateReportDateRangeSchema),
  asyncHandler(affiliateTrends)
);

export default router;