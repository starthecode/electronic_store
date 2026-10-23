import { Router } from "express";
import {
  listPublicHomepageSlides,
  listPublicTestimonials,
} from "../../controllers/public/homepage.controller.js";
import { publicCatalogRateLimit } from "../../middleware/public/publicRateLimit.js";
import { publicCatalogCache } from "../../middleware/public/publicCache.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.get(
  "/slides",
  publicCatalogRateLimit,
  publicCatalogCache,
  asyncHandler(listPublicHomepageSlides)
);

router.get(
  "/testimonials",
  publicCatalogRateLimit,
  publicCatalogCache,
  asyncHandler(listPublicTestimonials)
);

export default router;
