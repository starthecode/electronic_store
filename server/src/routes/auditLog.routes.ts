import { Router } from "express";

import {
  getAuditLog,
  listAuditLogs,
} from "../controllers/auditLog.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

import {
  auditLogIdSchema,
  auditLogListSchema,
} from "../validators/auditLog.validator.js";

import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  requirePermission("audit_logs.read"),
  validate(auditLogListSchema),
  asyncHandler(listAuditLogs)
);

router.get(
  "/:id",
  requirePermission("audit_logs.read"),
  validate(auditLogIdSchema),
  asyncHandler(getAuditLog)
);

export default router;