import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import { checkout } from "../../controllers/public/checkout.controller.js";
import { checkoutSchema } from "../../validators/public/checkout.validator.js";

const router = Router();

router.use(requireAuth);

router.post(
    "/",
    validate(checkoutSchema),
    asyncHandler(checkout)
);

export default router;