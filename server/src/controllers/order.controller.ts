import type { Request, Response } from "express";

import {
  getOrderById,
  getOrderStatusHistory,
  getOrderSummary,
  getOrders,
  updateFulfillmentStatus,
  updateOrderStatus,
  updatePaymentStatus,
} from "../services/order.service.js";

import { successResponse } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";


export const listOrders = async (
  req: Request,
  res: Response
) => {
  const page = Math.max(
    Number.parseInt(
      String(req.query.page ?? "1"),
      10
    ) || 1,
    1
  );

  const limit = Math.min(
    Math.max(
      Number.parseInt(
        String(req.query.limit ?? "20"),
        10
      ) || 20,
      1
    ),
    100
  );

  const search =
    typeof req.query.search === "string"
      ? req.query.search.trim()
      : undefined;

  const status =
    typeof req.query.status === "string"
      ? req.query.status as any
      : undefined;

  const paymentStatus =
    typeof req.query.paymentStatus === "string"
      ? req.query.paymentStatus as any
      : undefined;

  const fulfillmentStatus =
    typeof req.query.fulfillmentStatus === "string"
      ? req.query.fulfillmentStatus as any
      : undefined;

  const sortBy =
    typeof req.query.sortBy === "string"
      ? req.query.sortBy as
          | "createdAt"
          | "totalAmount"
          | "orderNumber"
      : "createdAt";

  const sortOrder =
    req.query.sortOrder === "asc"
      ? "asc"
      : "desc";

  const result = await getOrders({
    page,
    limit,
    search,
    status,
    paymentStatus,
    fulfillmentStatus,
    sortBy,
    sortOrder,
  });

  return successResponse(
    res,
    "Orders fetched successfully",
    result
  );
};

export const getOrderSummaryController = async (
  req: Request,
  res: Response
) => {
  const summary = await getOrderSummary();

  return successResponse(
    res,
    "Order summary fetched successfully",
    summary
  );
};

export const getOrder = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  if (!id) {
    throw new AppError(
      "Order ID is required",
      400
    );
  }

  const order = await getOrderById(String(id));

  return successResponse(
    res,
    "Order fetched successfully",
    order
  );
};

export const changeOrderStatus = async (
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

  const order = await updateOrderStatus(
    String(id),
    req.body.status,
    req.body.note,
    req.body?.userId
  );

  return successResponse(
    res,
    "Order status updated successfully",
    order
  );
};

export const changePaymentStatus = async (
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

  const payment = await updatePaymentStatus(
    String(id),
    req.body.status,
    req.user?.userId,
  );

  return successResponse(
    res,
    "Payment status updated successfully",
    payment
  );
};

export const changeFulfillmentStatus = async (
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

  const order =
    await updateFulfillmentStatus(
      String(id),
      req.body.status,
      req.user?.userId
    );

  return successResponse(
    res,
    "Fulfillment status updated successfully",
    order
  );
};

export const listOrderStatusHistory = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  if (!id) {
    throw new AppError(
      "Order ID is required",
      400
    );
  }

  const history =
    await getOrderStatusHistory(String(id));

  return successResponse(
    res,
    "Order status history fetched successfully",
    history
  );
};