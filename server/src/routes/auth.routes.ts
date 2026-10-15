import { Router } from "express";

import {
  login,
  me,
  logout,
} from "../controllers/auth.controller.js";
import { register } from "../controllers/public/auth.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.middleware.js";
import { registerSchema } from "../validators/public/auth.validator.js";

const router = Router();

router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(register)
);

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
