import { Router } from "express";
import { listStoreBrands } from "../../controllers/public/storeBrand.controller.js";
import { publicCatalogRateLimit } from "../../middleware/public/publicRateLimit.js";
import { publicCatalogCache } from "../../middleware/public/publicCache.js";

const router = Router();

router.get(
  "/",
  publicCatalogRateLimit,
  publicCatalogCache,
  listStoreBrands
);

export default router;