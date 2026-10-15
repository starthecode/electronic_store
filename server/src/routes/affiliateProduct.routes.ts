import { Router } from "express";

import { requireAuth } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js"; 
import { asyncHandler } from "../utils/asyncHandler.js";

import {
  affiliateProductIdSchema,
  affiliateProductListSchema,
  createAffiliateProductSchema,
  updateAffiliateProductSchema,
  updateAffiliateProductStatusSchema,
} from "../validators/affiliateProduct.validator.js";

import {
  createAffiliateProductController,
  deleteAffiliateProductController,
  getAffiliateProduct,
  listAffiliateProducts,
  updateAffiliateProductController,
  updateAffiliateProductStatusController,
} from "../controllers/affiliateProduct.controller.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  validate(affiliateProductListSchema),
  requirePermission("products.read"),
  asyncHandler(listAffiliateProducts)
);

router.get(
  "/:id",
  validate(affiliateProductIdSchema),
  requirePermission("products.read"),
  asyncHandler(getAffiliateProduct)
);

router.post(
  "/",
  validate(createAffiliateProductSchema),
  requirePermission("products.create"),
  asyncHandler(createAffiliateProductController)
);

router.patch(
  "/:id",
  validate(updateAffiliateProductSchema),
  requirePermission("products.update"),
  asyncHandler(updateAffiliateProductController)
);

router.patch(
  "/:id/status",
  validate(updateAffiliateProductStatusSchema),
  requirePermission("products.update"),
  asyncHandler(updateAffiliateProductStatusController)
);

router.delete(
  "/:id",
  validate(affiliateProductIdSchema),
  requirePermission("products.delete"),
  asyncHandler(deleteAffiliateProductController)
);

export default router;