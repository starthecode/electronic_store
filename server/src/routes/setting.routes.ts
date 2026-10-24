import { Router } from "express";
import {
  createSettingController,
  deleteSettingController,
  getStoreBrandingSettings,
  getSetting,
  listSettings,
  updateStoreBrandingSettings,
  updateSettingController,
} from "../controllers/setting.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js"; 
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createSettingSchema,
  listSettingsSchema,
  settingKeySchema,
  storeBrandingSchema,
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
  "/branding",
  requirePermission("settings.read"),
  asyncHandler(getStoreBrandingSettings)
);

router.patch(
  "/branding",
  requirePermission("settings.update"),
  validate(storeBrandingSchema),
  asyncHandler(updateStoreBrandingSettings)
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