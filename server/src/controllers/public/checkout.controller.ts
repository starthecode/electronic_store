import type { Request, Response } from "express";

import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { successResponse } from "../../utils/apiResponse.js";
import {
    createCustomerOrder,
    getCustomerCheckoutQuote,
} from "../../services/public/checkout.service.js";
import { prisma } from "../../config/database.js";
import {
    createCashfreePaymentSession,
    processCashfreeWebhook,
    isCashfreeSandboxConfigured,
    verifyCashfreeWebhookSignature,
    verifyCustomerPayment,
} from "../../services/public/cashfree.service.js";

export const checkout = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const userId = req.user?.userId;

    if (!userId) {
        throw new Error("Authentication required");
    }

    const order = await createCustomerOrder({
        ...req.body,
        userId,
    });

    if (req.body.paymentMethod === "COD") {
        return successResponse(
            res,
            "Order placed successfully",
            { ...order, paymentDueOnDelivery: true },
            201
        );
    }

    const customer = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true, email: true },
    });
    const shippingAddress = order.shippingAddress as {
        firstName?: string;
        lastName?: string | null;
        phone?: string;
    };
    if (!customer) {
        throw new Error("Authenticated customer profile not found");
    }
    const session = await createCashfreePaymentSession(
        order.id,
        req.body.requestId,
        {
            name: [customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
                [shippingAddress.firstName, shippingAddress.lastName].filter(Boolean).join(" "),
            email: customer.email,
            phone: shippingAddress.phone || "",
        }
    );

    return successResponse(
        res,
        "Payment session created successfully",
        { ...order, ...session, paymentDueOnDelivery: false },
        201
    );
};

export const checkoutPaymentStatus = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const userId = req.user?.userId;
    if (!userId) throw new Error("Authentication required");
    const result = await verifyCustomerPayment(userId, String(req.params.orderId));
    return successResponse(res, "Payment status verified", result);
};

export const checkoutQuote = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const userId = req.user?.userId;
    if (!userId) throw new Error("Authentication required");
    const quote = await getCustomerCheckoutQuote({
        ...req.body,
        userId,
    });
    return successResponse(res, "Checkout quote calculated", quote);
};

export const checkoutConfig = async (_req: Request, res: Response) =>
    successResponse(res, "Checkout configuration fetched", {
        cashfreeSandboxAvailable: isCashfreeSandboxConfigured(),
    });

interface RawBodyRequest extends AuthenticatedRequest {
    rawBody?: Buffer;
}

export const cashfreeWebhook = async (
    req: RawBodyRequest,
    res: Response
) => {
    const timestamp = req.header("x-webhook-timestamp");
    const signature = req.header("x-webhook-signature");
    if (!verifyCashfreeWebhookSignature(req.rawBody, timestamp, signature)) {
        return res.status(401).json({ success: false, message: "Invalid webhook signature" });
    }
    const result = await processCashfreeWebhook(req.body);
    return successResponse(res, "Webhook processed", result);
};