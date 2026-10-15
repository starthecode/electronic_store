import { prisma } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";

import { AppError } from "../utils/AppError.js";

export interface CreateAuditLogData {
  userId?: string | null;
  action:
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "STATUS_CHANGE"
  | "STOCK_ADJUSTMENT"
  | "PASSWORD_CHANGE";
  entity: string;
  entityId?: string | null;
  description?: string | null;
  metadata?: Prisma.InputJsonValue | null;
}

/**
 * Create audit log using the global Prisma client.
 */
export const createAuditLog = async (
  data: CreateAuditLogData
) => {
  return prisma.auditLog.create({
    data: {
      userId: data.userId ?? null,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId ?? null,
      description: data.description ?? null,
      metadata: data.metadata ?? undefined,
    },
  });
};

/**
 * Create audit log inside an existing Prisma transaction.
 *
 * Use this when the business operation is already inside
 * prisma.$transaction().
 */
export const createAuditLogTx = async (
  tx: Prisma.TransactionClient,
  data: CreateAuditLogData
) => {
  return tx.auditLog.create({
    data: {
      userId: data.userId ?? null,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId ?? null,
      description: data.description ?? null,
      metadata: data.metadata ?? undefined,
    },
  });
};

export interface AuditLogListParams {
  page?: number;
  limit?: number;
  action?: CreateAuditLogData["action"];
  entity?: string;
  entityId?: string;
  userId?: string;
  search?: string;
  from?: string;
  to?: string;
  sortOrder?: "asc" | "desc";
}

export const getAuditLogs = async ({
  page = 1,
  limit = 20,
  action,
  entity,
  entityId,
  userId,
  search,
  from,
  to,
  sortOrder = "desc",
}: AuditLogListParams) => {
  const skip = (page - 1) * limit;

  const where = {
    ...(action ? { action } : {}),
    ...(entity ? { entity } : {}),
    ...(entityId ? { entityId } : {}),
    ...(userId ? { userId } : {}),

    ...(search
      ? {
        OR: [
          {
            entity: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            description: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        ],
      }
      : {}),

    ...(from || to
      ? {
        createdAt: {
          ...(from
            ? { gte: new Date(from) }
            : {}),
          ...(to
            ? { lte: new Date(to) }
            : {}),
        },
      }
      : {}),
  };

  const [logs, total] =
    await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,

        orderBy: {
          createdAt: sortOrder,
        },

        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          description: true,
          metadata: true,
          createdAt: true,

          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,

              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),

      prisma.auditLog.count({
        where,
      }),
    ]);

  return {
    logs,

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(
        total / limit
      ),
    },
  };
};

export const getAuditLogById = async (
  id: string
) => {
  const log =
    await prisma.auditLog.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        description: true,
        metadata: true,
        createdAt: true,

        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,

            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

  if (!log) {
    throw new AppError(
      "Audit log not found",
      404
    );
  }

  return log;
};