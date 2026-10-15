import type { Request, Response } from "express";
import {
    getDashboardInventory,
  getDashboardOverview,
  getDashboardSales,
  getDashboardTopProducts,
} from "../services/dashboard.service.js";
import { successResponse } from "../utils/apiResponse.js";

export const getDashboardOverviewController = async (
  _req: Request,
  res: Response
) => {
  const data = await getDashboardOverview();

  return successResponse(
    res,
    "Dashboard overview fetched successfully",
    data
  );
};

export const getDashboardSalesController = async (
  req: Request,
  res: Response
) => {
  const data = await getDashboardSales({
    from: req.query.from as string | undefined,
    to: req.query.to as string | undefined,
  });

  return successResponse(
    res,
    "Dashboard sales fetched successfully",
    data
  );
};

export const getDashboardInventoryController = async (
  _req: Request,
  res: Response
) => {
  const data = await getDashboardInventory();

  return successResponse(
    res,
    "Dashboard inventory fetched successfully",
    data
  );
};

export const getDashboardTopProductsController = async (
  req: Request,
  res: Response
) => {
  const data = await getDashboardTopProducts({
    from: req.query.from as string | undefined,
    to: req.query.to as string | undefined,
    limit: req.query.limit
      ? Number(req.query.limit)
      : 10,
  });

  return successResponse(
    res,
    "Dashboard top products fetched successfully",
    data
  );
};