import type { Request, Response } from "express";

import {
  cancelOrder,
  fulfillOrder,
  getFulfillmentOrders,
  getFulfillmentSummary,
  releaseOrderStock,
  reserveOrderStock,
  returnOrder,
} from "../services/orderFulfillment.service.js";

import { successResponse } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export const reserveStock = async (
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

  const order = await reserveOrderStock(String(id), req.user!.userId);

  return successResponse(
    res,    
    "Order confirmed and stock reserved successfully",
    order
  );
};

export const releaseStock = async (
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

  await releaseOrderStock(String(id), req.user!.userId);

  return successResponse(
    res,
    "Order stock released successfully"
  );
};

export const fulfill = async (
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

  const order = await fulfillOrder(String(id), req.user!.userId);

  return successResponse(
    res,
    "Order fulfilled and stock deducted successfully",
    order
  );
};

export const cancel = async (
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

  const order = await cancelOrder(
    String(id),
     req.user!.userId,
    note || undefined
  );

  return successResponse(
    res,
    "Order cancelled and stock released successfully",
    order
  );
};

export const returnOrderHandler = async (
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

  const note =
    typeof req.body?.note === "string"
      ? req.body.note.trim()
      : undefined;

  const order = await returnOrder(
    String(id),
    req.body.userId as string,
    note || undefined
  );

  return successResponse(
    res,
    "Order returned and stock restored successfully",
    order
  );
};

export const listFulfillmentOrders = async (
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

  const fulfillmentStatus =
    typeof req.query.fulfillmentStatus ===
    "string"
      ? req.query.fulfillmentStatus as any
      : undefined;

  const orderStatus =
    typeof req.query.orderStatus === "string"
      ? req.query.orderStatus as any
      : undefined;

  const sortBy =
    req.query.sortBy === "orderNumber"
      ? "orderNumber"
      : "createdAt";

  const sortOrder =
    req.query.sortOrder === "asc"
      ? "asc"
      : "desc";

  const result =
    await getFulfillmentOrders({
      page,
      limit,
      search,
      fulfillmentStatus,
      orderStatus,
      sortBy,
      sortOrder,
    });

  return successResponse(
    res,
    "Fulfillment orders fetched successfully",
    result
  );
};

export const fulfillmentSummary = async (
  req: Request,
  res: Response
) => {
  const summary =
    await getFulfillmentSummary();

  return successResponse(
    res,
    "Fulfillment summary fetched successfully",
    summary
  );
};