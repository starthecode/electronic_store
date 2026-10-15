import { Router } from "express";
import {
  addCategory,
  addProduct,
  categories,
  create,
  getById,
  list,
  products,
  remove,
  removeCategory,
  removeProduct,
  update,
  usage,
} from "../controllers/discount.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createDiscountSchema,
  discountCategoryIdSchema,
  discountCategorySchema,
  discountIdSchema,
  discountProductIdSchema,
  discountProductSchema,
  listDiscountsSchema,
  updateDiscountSchema,
} from "../validators/discount.validator.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  requirePermission("discounts.read"),
  validate(listDiscountsSchema),
  list
);

router.get(
  "/:id",
  requireAuth,
  requirePermission("discounts.read"),
  validate(discountIdSchema),
  getById
);

router.post(
  "/",
  requireAuth,
  requirePermission("discounts.create"),
  validate(createDiscountSchema),
  create
);

router.patch(
  "/:id",
  requireAuth,
  requirePermission("discounts.update"),
  validate(updateDiscountSchema),
  update
);

router.delete(
  "/:id",
  requireAuth,
  requirePermission("discounts.delete"),
  validate(discountIdSchema),
  remove
);

// Products

router.get(
  "/:discountId/products",
  requireAuth,
  requirePermission("discounts.read"),
  products
);

router.post(
  "/:discountId/products",
  requireAuth,
  requirePermission("discounts.update"),
  validate(discountProductSchema),
  addProduct
);

router.delete(
  "/:discountId/products/:productId",
  requireAuth,
  requirePermission("discounts.update"),
  validate(discountProductIdSchema),
  removeProduct
);

// Categories

router.get(
  "/:discountId/categories",
  requireAuth,
  requirePermission("discounts.read"),
  categories
);

router.post(
  "/:discountId/categories",
  requireAuth,
  requirePermission("discounts.update"),
  validate(discountCategorySchema),
  addCategory
);

router.delete(
  "/:discountId/categories/:categoryId",
  requireAuth,
  requirePermission("discounts.update"),
  validate(discountCategoryIdSchema),
  removeCategory
);

// Usage

router.get(
  "/:discountId/usage",
  requireAuth,
  requirePermission("discounts.read"),
  usage
);

export default router;