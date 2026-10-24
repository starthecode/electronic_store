import { Router } from "express";
import { getPublicStoreBranding } from "../../controllers/public/storeBranding.controller.js";
import { publicCatalogCache } from "../../middleware/public/publicCache.js";
import { publicCatalogRateLimit } from "../../middleware/public/publicRateLimit.js";

const router = Router();

router.get(
  "/",
  publicCatalogRateLimit,
  publicCatalogCache,
  getPublicStoreBranding
);

export default router;
