import crypto from "node:crypto";
import { prisma } from "../../config/database.js";
import { AppError } from "../../utils/AppError.js";

type CashfreeCredentials = {
  appId: string;
  secretKey: string;
  apiVersion: string;
};

const credentials = (): CashfreeCredentials => {
  const { CASHFREE_APP_ID: appId, CASHFREE_SECRET_KEY: secretKey } = process.env;
  if (!appId || !secretKey) {
    throw new AppError("Online payment is not configured. Please choose Cash on Delivery.", 503);
  }
  if ((process.env.CASHFREE_ENV || "sandbox").toLowerCase() !== "sandbox") {
    throw new AppError("Cashfree online payment is restricted to sandbox mode until production is explicitly approved.", 503);
  }
  return {
    appId,
    secretKey,
    apiVersion: process.env.CASHFREE_API_VERSION || "2025-01-01",
  };
};

export const isCashfreeSandboxConfigured = () => {
  if (
    !process.env.CASHFREE_APP_ID ||
    !process.env.CASHFREE_SECRET_KEY ||
    !process.env.STOREFRONT_URL ||
    (process.env.CASHFREE_ENV || "sandbox").toLowerCase() !== "sandbox"
  ) {
    return false;
  }
  try {
    const storefrontUrl = new URL(process.env.STOREFRONT_URL);
    return process.env.NODE_ENV !== "production" || storefrontUrl.protocol === "https:";
  } catch {
    return false;
  }
};

const cashfreeRequest = async <T>(
  path: string,
  method: "GET" | "POST",
  body?: unknown,
  idempotencyKey?: string
): Promise<T> => {
  const config = credentials();
  const response = await fetch(`https://sandbox.cashfree.com/pg${path}`, {
    method,
    headers: {
      "x-client-id": config.appId,
      "x-client-secret": config.secretKey,
      "x-api-version": config.apiVersion,
      accept: "application/json",
      "content-type": "application/json",
      ...(idempotencyKey ? { "x-idempotency-key": idempotencyKey } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(12_000),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    console.error("Cashfree API request failed", {
      status: response.status,
      path,
      requestId: response.headers.get("x-request-id"),
    });
    throw new AppError("Unable to start or verify the online payment. Please retry or choose Cash on Delivery.", 502);
  }
  return payload as T;
};

const safeReturnUrl = (orderId: string) => {
  const configured = process.env.STOREFRONT_URL;
  if (!configured) {
    throw new AppError("STOREFRONT_URL must be configured before online payments can be used.", 503);
  }
  let base: URL;
  try {
    base = new URL(configured);
  } catch {
    throw new AppError("STOREFRONT_URL is not a valid URL.", 500);
  }
  if (process.env.NODE_ENV === "production" && base.protocol !== "https:") {
    throw new AppError("STOREFRONT_URL must use HTTPS in production.", 500);
  }
  return new URL(`/checkout?order_id=${encodeURIComponent(orderId)}`, base).toString();
};

const normalizeIndianPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  throw new AppError("Enter a valid Indian mobile number to use online payment.", 400);
};

export const createCashfreePaymentSession = async (
  orderId: string,
  requestId: string,
  customer: {
    name: string;
    email: string;
    phone: string;
  }
) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId },
    include: { payment: true },
  });
  if (!order?.payment || !["UPI", "CARD"].includes(order.payment.method)) {
    throw new AppError("Online payment order not found", 404);
  }
  if (order.payment.status === "PAID") {
    throw new AppError("This order has already been paid", 409);
  }

  const priorSession = order.payment.gatewayResponse as
    | { cashfreeOrderId?: string; paymentSessionId?: string }
    | null;
  if (priorSession?.paymentSessionId && priorSession.cashfreeOrderId) {
    return {
      orderId: order.id,
      paymentSessionId: priorSession.paymentSessionId,
    };
  }

  const cashfreeOrderId = `md_${order.id.replaceAll("-", "")}`;
  const response = await cashfreeRequest<{
    order_id?: string;
    payment_session_id?: string;
  }>(
    "/orders",
    "POST",
    {
      order_id: cashfreeOrderId,
      order_amount: Number(order.totalAmount),
      order_currency: "INR",
      customer_details: {
        customer_id: order.userId,
        customer_name: customer.name.slice(0, 100),
        customer_email: customer.email,
        customer_phone: normalizeIndianPhone(customer.phone),
      },
      order_meta: {
        return_url: safeReturnUrl(order.id),
      },
      order_note: `MagDeal order ${order.orderNumber}`.slice(0, 250),
    },
    requestId
  );

  if (!response.order_id || !response.payment_session_id) {
    throw new AppError("Cashfree did not return a valid payment session.", 502);
  }

  await prisma.payment.update({
    where: { orderId: order.id },
    data: {
      gateway: "CASHFREE",
      gatewayResponse: {
        cashfreeOrderId: response.order_id,
        paymentSessionId: response.payment_session_id,
      },
    },
  });

  return {
    orderId: order.id,
    paymentSessionId: response.payment_session_id,
  };
};

const applyVerifiedStatus = async (
  internalOrderId: string,
  status: "PAID" | "FAILED",
  transactionId?: string
) => prisma.$transaction(async (tx) => {
  const payment = await tx.payment.findUnique({
    where: { orderId: internalOrderId },
    include: { order: { include: { items: true } } },
  });
  if (!payment || payment.method === "COD") {
    throw new AppError("Online payment order not found", 404);
  }
  if (payment.status === "PAID" || payment.status === "FAILED") {
    return { orderId: internalOrderId, status: payment.status };
  }

  await tx.payment.update({
    where: { id: payment.id },
    data: {
      status,
      transactionId: transactionId || payment.transactionId,
      paidAt: status === "PAID" ? new Date() : null,
    },
  });
  await tx.order.update({
    where: { id: payment.orderId },
    data: {
      paymentStatus: status,
      ...(status === "FAILED" ? { status: "CANCELLED" } : {}),
    },
  });

  if (status === "FAILED") {
    await tx.orderStatusHistory.create({
      data: {
        orderId: payment.orderId,
        status: "CANCELLED",
        note: "Online payment order expired; reserved stock released",
      },
    });
    for (const item of payment.order.items) {
      if (!item.variantId) continue;
      const inventory = await tx.inventory.findUnique({
        where: { variantId: item.variantId },
      });
      if (!inventory) continue;
      const released = Math.min(item.quantity, inventory.reservedQuantity);
      if (!released) continue;
      await tx.inventory.update({
        where: { id: inventory.id },
        data: { reservedQuantity: { decrement: released } },
      });
      await tx.inventoryTransaction.create({
        data: {
          variantId: item.variantId,
          inventoryId: inventory.id,
          type: "RELEASE",
          quantity: released,
          reference: `ORDER:${payment.orderId}`,
          note: "Released after Cashfree payment failure",
        },
      });
    }
  }

  return { orderId: internalOrderId, status };
});

export const verifyCustomerPayment = async (userId: string, internalOrderId: string) => {
  const payment = await prisma.payment.findFirst({
    where: {
      orderId: internalOrderId,
      order: { userId },
    },
  });
  if (!payment || payment.method === "COD") {
    throw new AppError("Payment not found", 404);
  }
  if (payment.status === "PAID" || payment.status === "FAILED") {
    return { orderId: internalOrderId, status: payment.status };
  }
  const details = payment.gatewayResponse as { cashfreeOrderId?: string } | null;
  if (!details?.cashfreeOrderId) {
    return { orderId: internalOrderId, status: payment.status };
  }
  const cashfreeOrder = await cashfreeRequest<{ order_status?: string }>(
    `/orders/${encodeURIComponent(details.cashfreeOrderId)}`,
    "GET"
  );
  if (cashfreeOrder.order_status === "PAID") {
    return applyVerifiedStatus(internalOrderId, "PAID", details.cashfreeOrderId);
  }
  if (cashfreeOrder.order_status === "EXPIRED") {
    return applyVerifiedStatus(internalOrderId, "FAILED");
  }
  return { orderId: internalOrderId, status: payment.status };
};

export const verifyCashfreeWebhookSignature = (
  rawBody: Buffer | undefined,
  timestamp: string | undefined,
  signature: string | undefined
) => {
  if (!rawBody || !timestamp || !signature) return false;
  const { secretKey } = credentials();
  const expected = crypto
    .createHmac("sha256", secretKey)
    .update(`${timestamp}.${rawBody.toString("utf8")}`)
    .digest("base64");
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  return expectedBuffer.length === signatureBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
};

export const processCashfreeWebhook = async (payload: {
  data?: {
    order?: {
      order_id?: string;
      order_amount?: number;
      order_currency?: string;
    };
    payment?: {
      cf_payment_id?: string;
      payment_status?: string;
      payment_amount?: number;
      payment_currency?: string;
    };
  };
}) => {
  const cashfreeOrderId = payload.data?.order?.order_id;
  const status = payload.data?.payment?.payment_status;
  if (!cashfreeOrderId || !status) {
    throw new AppError("Invalid Cashfree webhook payload", 400);
  }
  const matchingPayment = await prisma.payment.findFirst({
    where: {
      gateway: "CASHFREE",
      gatewayResponse: {
        path: ["cashfreeOrderId"],
        equals: cashfreeOrderId,
      },
    },
    select: { orderId: true },
  });
  if (!matchingPayment) return { ignored: true };
  if (status !== "SUCCESS") {
    return { orderId: matchingPayment.orderId, status: "PENDING" };
  }
  const payment = await prisma.payment.findUnique({
    where: { orderId: matchingPayment.orderId },
    select: { amount: true, currency: true },
  });
  const reportedAmount = payload.data?.payment?.payment_amount ??
    payload.data?.order?.order_amount;
  const reportedCurrency = payload.data?.payment?.payment_currency ??
    payload.data?.order?.order_currency;
  if (
    !payment ||
    reportedAmount === undefined ||
    Number(reportedAmount) !== Number(payment.amount) ||
    reportedCurrency !== payment.currency
  ) {
    throw new AppError("Cashfree webhook payment details do not match the order", 400);
  }
  return applyVerifiedStatus(
    matchingPayment.orderId,
    "PAID",
    payload.data?.payment?.cf_payment_id
  );
};
