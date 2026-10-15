import { Router } from "express";
import {
    createProductImageController,
    deleteProductImageController,
    getProductImageByIdController,
    getProductImagesController,
    updateProductImageController,
} from "../controllers/productImage.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
    createProductImageSchema,
    deleteProductImageSchema,
    getProductImageByIdSchema,
    listProductImagesSchema,
    updateProductImageSchema,
} from "../validators/productImage.validator.js";

const router = Router();

router.use(requireAuth);

router.get(
    "/products/:productId/images",
    requirePermission("products.read"),
    validate(listProductImagesSchema),
    getProductImagesController
);

router.get(
    "/products/:productId/images/:imageId",
    requirePermission("products.read"),
    validate(getProductImageByIdSchema),
    getProductImageByIdController
);

router.post(
    "/products/:productId/images",
    requirePermission("products.update"),
    validate(createProductImageSchema),
    createProductImageController
);

router.patch(
    "/products/:productId/images/:imageId",
    requirePermission("products.update"),
    validate(updateProductImageSchema),
    updateProductImageController
);

router.delete(
    "/products/:productId/images/:imageId",
    requirePermission("products.update"),
    validate(deleteProductImageSchema),
    deleteProductImageController
);

export default router;