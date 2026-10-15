import { Router } from "express";
import {
  createSettingController,
  deleteSettingController,
  getSetting,
  listSettings,
  updateSettingController,
} from "../controllers/setting.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js"; 
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createSettingSchema,
  listSettingsSchema,
  settingKeySchema,
  updateSettingSchema,
} from "../validators/setting.validator.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  requirePermission("settings.read"),
  validate(listSettingsSchema),
  asyncHandler(listSettings)
);

router.get(
  "/:key",
  requirePermission("settings.read"),
  validate(settingKeySchema),
  asyncHandler(getSetting)
);

router.post(
  "/",
  requirePermission("settings.update"),
  validate(createSettingSchema),
  asyncHandler(createSettingController)
);

router.patch(
  "/:key",
  requirePermission("settings.update"),
  validate(updateSettingSchema),
  asyncHandler(updateSettingController)
);

router.delete(
  "/:key",
  requirePermission("settings.update"),
  validate(settingKeySchema),
  asyncHandler(deleteSettingController)
);

export default router;