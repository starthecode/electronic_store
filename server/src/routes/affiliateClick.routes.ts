import { Router } from "express";
import {
  redirectAffiliateProduct,
  revokeAffiliateAnalytics,
} from "../controllers/affiliateClick.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { trackAffiliateClickSchema } from "../validators/affiliateClick.validator.js";

const router = Router();

router.get(
  "/go/:productId",
  validate(trackAffiliateClickSchema),
  asyncHandler(redirectAffiliateProduct)
);

router.post(
  "/go/:productId",
  validate(trackAffiliateClickSchema),
  asyncHandler(redirectAffiliateProduct)
);

router.post("/consent/revoke", revokeAffiliateAnalytics);

export default router;