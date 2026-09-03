import { Router } from "express";

import {
  login,
  me,
  logout,
} from "../controllers/auth.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post(
  "/login",
  asyncHandler(login)
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(me)
);

router.post(
  "/logout",
  requireAuth,
  asyncHandler(logout)
);

export default router;