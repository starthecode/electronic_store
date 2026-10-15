import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "./auth.middleware.js";

import { AppError } from "../utils/AppError.js";

export const requireRole = (
  ...allowedRoles: string[]
) => {
  return (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      next(
        new AppError(
          "Authentication required",
          401
        )
      );
      return;
    }

    if (!allowedRoles.includes(req.user.roleName)) {
      next(
        new AppError(
          "You do not have access to this resource",
          403
        )
      );
      return;
    }

    next();
  };
};