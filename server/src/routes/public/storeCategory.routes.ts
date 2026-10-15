import { Router } from "express";
import { listStoreCategories } from "../../controllers/public/storeCategory.controller.js";
import { publicCatalogRateLimit } from "../../middleware/public/publicRateLimit.js";
import { publicCatalogCache } from "../../middleware/public/publicCache.js";

const router = Router();

router.get(
  "/",
  publicCatalogRateLimit,
  publicCatalogCache,
  listStoreCategories
);

export default router;