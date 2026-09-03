import { Router } from "express";
import { prisma } from "../config/database.js";
import { successResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;

    return successResponse(
      res,
      "API and database are healthy",
      {
        api: "ok",
        database: "ok",
      }
    );
  })
);

export default router;