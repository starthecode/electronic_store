import type { Response } from "express";

import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { successResponse } from "../../utils/apiResponse.js";
import { createCustomerOrder } from "../../services/public/checkout.service.js";

export const checkout = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const userId = req.user?.userId;

    if (!userId) {
        throw new Error("Authentication required");
    }

    const order = await createCustomerOrder({
        userId,
        ...req.body,
    });

    return successResponse(
        res,
        "Order placed successfully",
        order,
        201
    );
};