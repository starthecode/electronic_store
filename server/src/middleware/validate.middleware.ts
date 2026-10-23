import type {
  NextFunction,
  Request,
  Response,
} from "express";

import type { ZodType } from "zod";
import { ZodError } from "zod";

import { AppError } from "../utils/AppError.js";

export const validate = (schema: ZodType) => {
  return (
    req: Request,
    _res: Response,
    next: NextFunction
  ) => {
    try {
      schema.parse({
        body: req.body ?? {},
        params: req.params,
        query: req.query,
      });

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        console.error(
          "Request validation failed",
          JSON.stringify(
            error.issues.map(({ path, code, message }) => ({
              path,
              code,
              message,
            }))
          )
        );

        next(
          new AppError(
            "Validation failed",
            400,
            error.issues
          )
        );
        return;
      }

      next(error);
    }
  };
};