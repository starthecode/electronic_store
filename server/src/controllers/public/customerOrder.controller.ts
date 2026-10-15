import type { Response } from "express";

import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { AppError } from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";

import {
    cancelCustomerOrder,
    requestCustomerReturn,
} from "../../services/public/customerOrder.service.js";

export const cancelOrder = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const { id } = req.params;

    if (!id) {
        throw new AppError(
            "Order ID is required",
            400
        );
    }

    const note =
        typeof req.body?.note === "string"
            ? req.body.note.trim()
            : undefined;

    const order =
        await cancelCustomerOrder(
            req.user!.userId,
            String(id),
            note
        );

    return successResponse(
        res,
        "Order cancelled successfully",
        order
    );
};

export const requestReturn = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const { id } = req.params;

    if (!id) {
        throw new AppError(
            "Order ID is required",
            400
        );
    }

    const note =
        typeof req.body?.note === "string"
            ? req.body.note.trim()
            : undefined;

    const order =
        await requestCustomerReturn(
            req.user!.userId,
            String(id),
            note
        );

    return successResponse(
        res,
        "Return requested successfully",
        order
    );
};