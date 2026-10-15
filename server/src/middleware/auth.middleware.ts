import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { verifyToken } from "../utils/jwt.js";
import { AppError } from "../utils/AppError.js";

export interface AuthenticatedRequest
  extends Request {
  user?: {
    userId: string;
    roleId: string;
    roleName: string;
  };
}

export const requireAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.auth_token;

    if (!token) {
      throw new AppError(
        "Authentication required",
        401
      );
    }

    const payload = verifyToken(token);

    req.user = payload;

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    next(
      new AppError(
        "Invalid or expired authentication token",
        401
      )
    );
  }
};