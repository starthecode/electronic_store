import type { Request, Response } from "express";

import {
  getAuditLogById,
  getAuditLogs,
} from "../services/auditLog.service.js";

import { successResponse } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";

export const listAuditLogs = async (
  req: Request,
  res: Response
) => {
  const page = Math.max(
    Number.parseInt(
      String(req.query.page ?? "1"),
      10
    ) || 1,
    1
  );

  const limit = Math.min(
    Math.max(
      Number.parseInt(
        String(req.query.limit ?? "20"),
        10
      ) || 20,
      1
    ),
    100
  );

  const action =
    typeof req.query.action === "string"
      ? req.query.action as any
      : undefined;

  const entity =
    typeof req.query.entity === "string"
      ? req.query.entity.trim()
      : undefined;

  const entityId =
    typeof req.query.entityId === "string"
      ? req.query.entityId
      : undefined;

  const userId =
    typeof req.query.userId === "string"
      ? req.query.userId
      : undefined;

  const search =
    typeof req.query.search === "string"
      ? req.query.search.trim()
      : undefined;

  const from =
    typeof req.query.from === "string"
      ? req.query.from
      : undefined;

  const to =
    typeof req.query.to === "string"
      ? req.query.to
      : undefined;

  const sortOrder =
    req.query.sortOrder === "asc"
      ? "asc"
      : "desc";

  const result = await getAuditLogs({
    page,
    limit,
    action,
    entity,
    entityId,
    userId,
    search,
    from,
    to,
    sortOrder,
  });

  return successResponse(
    res,
    "Audit logs fetched successfully",
    result
  );
};

export const getAuditLog = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  if (!id) {
    throw new AppError(
      "Audit log ID is required",
      400
    );
  }

  const log = await getAuditLogById(String(id));

  return successResponse(
    res,
    "Audit log fetched successfully",
    log
  );
};