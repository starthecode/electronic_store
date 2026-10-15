import type { Request, Response } from "express";

import {
  getCustomerAddresses,
  getCustomerById,
  getCustomerOrders,
  getCustomers,
  updateCustomerStatus,
} from "../services/customer.service.js";

import { successResponse } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";


export const listCustomers = async (
  req: Request,
  res: Response
) => {
  const page = Math.max(
    Number.parseInt(String(req.query.page ?? "1"), 10) || 1,
    1
  );

  const limit = Math.min(
    Math.max(
      Number.parseInt(String(req.query.limit ?? "20"), 10) || 20,
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
      ? req.query.status as "ACTIVE" | "INACTIVE" | "SUSPENDED"
      : undefined;

  const sortBy =
    typeof req.query.sortBy === "string"
      ? req.query.sortBy as
      | "firstName"
      | "lastName"
      | "email"
      | "createdAt"
      : "createdAt";

  const sortOrder =
    req.query.sortOrder === "asc" ? "asc" : "desc";

  const result = await getCustomers({
    page,
    limit,
    search,
    status,
    sortBy,
    sortOrder,
  });

  return successResponse(
    res,
    "Customers fetched successfully",
    result
  );
};

export const getCustomer = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  if (!id) {
    throw new AppError("Customer ID is required", 400);
  }

  const customer = await getCustomerById(String(id));

  return successResponse(
    res,
    "Customer fetched successfully",
    customer
  );
};

export const changeCustomerStatus = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { id } = req.params;

  if (!id) {
    throw new AppError("Customer ID is required", 400);
  }

  const customer = await updateCustomerStatus(
    String(id),
    req.body.status,
    req.user!.userId

  );

  return successResponse(
    res,
    "Customer status updated successfully",
    customer
  );
};

export const listCustomerOrders = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  if (!id) {
    throw new AppError("Customer ID is required", 400);
  }

  const page = Math.max(
    Number.parseInt(String(req.query.page ?? "1"), 10) || 1,
    1
  );

  const limit = Math.min(
    Math.max(
      Number.parseInt(String(req.query.limit ?? "20"), 10) || 20,
      1
    ),
    100
  );

  const result = await getCustomerOrders(
    String(id),
    page,
    limit
  );

  return successResponse(
    res,
    "Customer orders fetched successfully",
    result
  );
};

export const listCustomerAddresses = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  if (!id) {
    throw new AppError("Customer ID is required", 400);
  }

  const addresses = await getCustomerAddresses(String(id));

  return successResponse(
    res,
    "Customer addresses fetched successfully",
    addresses
  );
};