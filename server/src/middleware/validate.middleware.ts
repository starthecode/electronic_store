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

    console.log("VALIDATION REQUEST:");
    console.log("BODY:", JSON.stringify(req.body, null, 2));
    console.log("PARAMS:", JSON.stringify(req.params, null, 2));
    console.log("QUERY:", JSON.stringify(req.query, null, 2));

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
          "ZOD VALIDATION ERRORS:",
          JSON.stringify(error.issues, null, 2)
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