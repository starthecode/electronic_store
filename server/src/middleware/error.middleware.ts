import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError.js";

export const errorMiddleware = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(error);

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.errors ?? null,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
    errors: null,
  });
};