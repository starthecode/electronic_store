import { Router } from "express";

import {
    cancelOrder,
    requestReturn,
} from "../../controllers/public/customerOrder.controller.js";

import { requireAuth } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import {
    customerOrderActionSchema,
} from "../../validators/public/customerOrder.validator.js";

const router = Router();

router.use(requireAuth);

router.post(
    "/:id/cancel",
    validate(customerOrderActionSchema),
    asyncHandler(cancelOrder)
);

router.post(
    "/:id/return",
    validate(customerOrderActionSchema),
    asyncHandler(requestReturn)
);

export default router;