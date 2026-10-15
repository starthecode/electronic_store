import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "./auth.middleware.js";

import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";

export const requirePermission = (
  permissionName: string
) => {
  return async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        throw new AppError(
          "Authentication required",
          401
        );
      }

      const rolePermission =
        await prisma.rolePermission.findFirst({
          where: {
            roleId: req.user.roleId,
            permission: {
              name: permissionName,
            },
          },
          include: {
            permission: true,
          },
        });

      if (!rolePermission) {
        throw new AppError(
          "You do not have permission to perform this action",
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};