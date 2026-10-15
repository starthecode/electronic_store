import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import {
  createSetting,
  deleteSetting,
  getSettingByKey,
  getSettings,
  updateSetting,
} from "../services/setting.service.js";
import { successResponse } from "../utils/apiResponse.js";

export const listSettings = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const result = await getSettings({
    category: req.query.category as string | undefined,
    search: req.query.search as string | undefined,
    page: Number(req.query.page ?? 1),
    limit: Number(req.query.limit ?? 20),
  });

  return successResponse(
    res,
    "Settings fetched successfully",
    result
  );
};

export const getSetting = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const setting = await getSettingByKey(String(req.params.key));

  return successResponse(
    res,
    "Setting fetched successfully",
    setting
  );
};

export const createSettingController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const setting = await createSetting(
    req.body,
    req.user!.userId
  );

  return successResponse(
    res,
    "Setting created successfully",
    setting,
    201
  );
};

export const updateSettingController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const setting = await updateSetting(
    String(req.params.key),
    req.body,
    req.user!.userId
  );

  return successResponse(
    res,
    "Setting updated successfully",
    setting
  );
};

export const deleteSettingController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  await deleteSetting(
    String(req.params.key),
    req.user!.userId
  );

  return successResponse(
    res,
    "Setting deleted successfully"
  );
};