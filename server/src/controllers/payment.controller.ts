import type { Request, Response } from "express";

import {
  getPaymentById,
  getPayments,
  getPaymentSummary,
  updatePaymentStatus,
} from "../services/payment.service.js";

import { successResponse } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export const listPayments = async (
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

  const method =
    typeof req.query.method === "string"
      ? req.query.method as any
      : undefined;

  const sortBy =
    typeof req.query.sortBy === "string"
      ? req.query.sortBy as
          | "createdAt"
          | "amount"
          | "status"
      : "createdAt";

  const sortOrder =
    req.query.sortOrder === "asc"
      ? "asc"
      : "desc";

  const result = await getPayments({
    page,
    limit,
    search,
    status,
    method,
    sortBy,
    sortOrder,
  });

  return successResponse(
    res,
    "Payments fetched successfully",
    result
  );
};

export const getPaymentSummaryController = async (
  req: Request,
  res: Response
) => {
  const summary = await getPaymentSummary();

  return successResponse(
    res,
    "Payment summary fetched successfully",
    summary
  );
};

export const getPayment = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  if (!id) {
    throw new AppError(
      "Payment ID is required",
      400
    );
  }

  const payment = await getPaymentById(String(id));

  return successResponse(
    res,
    "Payment fetched successfully",
    payment
  );
};

export const changePaymentStatus = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { id } = req.params;

  if (!id) {
    throw new AppError(
      "Payment ID is required",
      400
    );
  }
  

  const payment = await updatePaymentStatus(
    String(id),
    req.body.status,
    req.body.userId as string
  );

  return successResponse(
    res,
    "Payment status updated successfully",
    payment
  );
};