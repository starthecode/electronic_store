import { Router } from "express";

import {
  getStoreProduct,
  listStoreProducts,
} from "../../controllers/public/storeProduct.controller.js";

import {
  publicCatalogRateLimit,
} from "../../middleware/public/publicRateLimit.js";

import {
  publicCatalogCache,
} from "../../middleware/public/publicCache.js";

const router = Router();

router.get(
  "/",
  publicCatalogRateLimit,
  publicCatalogCache,
  listStoreProducts,
);

router.get(
  "/:slug",
  publicCatalogRateLimit,
  publicCatalogCache,
  getStoreProduct,
);

export default router;