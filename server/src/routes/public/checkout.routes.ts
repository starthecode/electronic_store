import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import {
    cashfreeWebhook,
    checkoutConfig,
    checkout,
    checkoutPaymentStatus,
    checkoutQuote,
} from "../../controllers/public/checkout.controller.js";
import {
    checkoutPaymentStatusSchema,
    checkoutQuoteSchema,
    checkoutSchema,
} from "../../validators/public/checkout.validator.js";

const router = Router();

router.get("/config", asyncHandler(checkoutConfig));

router.post(
    "/cashfree/webhook",
    asyncHandler(cashfreeWebhook)
);

router.use(requireAuth);

router.post(
    "/quote",
    validate(checkoutQuoteSchema),
    asyncHandler(checkoutQuote)
);

router.get(
    "/payments/:orderId/status",
    validate(checkoutPaymentStatusSchema),
    asyncHandler(checkoutPaymentStatus)
);

router.post(
    "/",
    validate(checkoutSchema),
    asyncHandler(checkout)
);

export default router;