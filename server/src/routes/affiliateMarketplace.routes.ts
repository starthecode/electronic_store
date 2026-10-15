import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js"; 
import { asyncHandler } from "../utils/asyncHandler.js";

import {
  affiliateMarketplaceIdSchema,
  affiliateMarketplaceListSchema,
  createAffiliateMarketplaceSchema,
  updateAffiliateMarketplaceSchema,
} from "../validators/affiliateMarketplace.validator.js";

import {
  createAffiliateMarketplaceController,
  deleteAffiliateMarketplaceController,
  getAffiliateMarketplace,
  listAffiliateMarketplaces,
  updateAffiliateMarketplaceController,
} from "../controllers/affiliateMarketplace.controller.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  validate(affiliateMarketplaceListSchema),
  requirePermission("products.read"),
  asyncHandler(listAffiliateMarketplaces)
);

router.get(
  "/:id",
  validate(affiliateMarketplaceIdSchema),
  requirePermission("products.read"),
  asyncHandler(getAffiliateMarketplace)
);

router.post(
  "/",
  validate(createAffiliateMarketplaceSchema),
  requirePermission("products.create"),
  asyncHandler(createAffiliateMarketplaceController)
);

router.patch(
  "/:id",
  validate(updateAffiliateMarketplaceSchema),
  requirePermission("products.update"),
  asyncHandler(updateAffiliateMarketplaceController)
);

router.delete(
  "/:id",
  validate(affiliateMarketplaceIdSchema),
  requirePermission("products.delete"),
  asyncHandler(deleteAffiliateMarketplaceController)
);

export default router;