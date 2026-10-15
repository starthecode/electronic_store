import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { createAuditLogTx } from "./auditLog.service.js";

type PaymentStatus =
  | "PENDING"
  | "AUTHORIZED"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

type PaymentMethod =
  | "COD"
  | "CARD"
  | "UPI"
  | "NET_BANKING"
  | "WALLET"
  | "OTHER";

interface PaymentListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: PaymentStatus;
  method?: PaymentMethod;
  sortBy?: "createdAt" | "amount" | "status";
  sortOrder?: "asc" | "desc";
}

export const getPayments = async ({
  page = 1,
  limit = 20,
  search,
  status,
  method,
  sortBy = "createdAt",
  sortOrder = "desc",
}: PaymentListParams) => {
  const skip = (page - 1) * limit;

  const where = {
    ...(status ? { status } : {}),

    ...(method ? { method } : {}),

    ...(search
      ? {
        OR: [
          {
            transactionId: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            order: {
              orderNumber: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          },
          {
            order: {
              user: {
                email: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
          },
        ],
      }
      : {}),
  };

  const [payments, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,

      orderBy: {
        [sortBy]: sortOrder,
      },

      select: {
        id: true,
        orderId: true,

        method: true,
        status: true,

        transactionId: true,

        amount: true,
        currency: true,

        gateway: true,
        paidAt: true,

        createdAt: true,
        updatedAt: true,

        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,

            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    }),

    prisma.payment.count({
      where,
    }),
  ]);

  return {
    payments,

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getPaymentSummary = async () => {
  const statusGroups = await prisma.payment.groupBy({
    by: ["status"],
    _count: {
      _all: true,
    },
  });

  const counts = statusGroups.reduce(
    (acc, item) => {
      acc[item.status] = item._count._all;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    totalPayments:
      Object.values(counts).reduce(
        (total, count) => total + count,
        0
      ),

    pendingPayments:
      counts.PENDING ?? 0,

    authorizedPayments:
      counts.AUTHORIZED ?? 0,

    paidPayments:
      counts.PAID ?? 0,

    failedPayments:
      counts.FAILED ?? 0,

    refundedPayments:
      counts.REFUNDED ?? 0,

    partiallyRefundedPayments:
      counts.PARTIALLY_REFUNDED ?? 0,
  };
};

export const getPaymentById = async (
  id: string
) => {
  const payment = await prisma.payment.findUnique({
    where: {
      id,
    },

    select: {
      id: true,
      orderId: true,

      method: true,
      status: true,

      transactionId: true,

      amount: true,
      currency: true,

      gateway: true,
      gatewayResponse: true,

      paidAt: true,

      createdAt: true,
      updatedAt: true,

      order: {
        select: {
          id: true,
          orderNumber: true,

          status: true,
          paymentStatus: true,
          fulfillmentStatus: true,

          totalAmount: true,

          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      },
    },
  });

  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  return payment;
};

const PAYMENT_STATUS_TRANSITIONS: Record<
  PaymentStatus,
  PaymentStatus[]
> = {
  PENDING: [
    "AUTHORIZED",
    "PAID",
    "FAILED",
  ],

  AUTHORIZED: [
    "PAID",
    "FAILED",
  ],

  PAID: [
    "PARTIALLY_REFUNDED",
    "REFUNDED",
  ],

  FAILED: [],

  PARTIALLY_REFUNDED: [
    "REFUNDED",
  ],

  REFUNDED: [],
};

export const updatePaymentStatus = async (
  id: string,
  status: PaymentStatus,
  userId: string
) => {
  const payment = await prisma.payment.findUnique({
    where: {
      id,
    },

    select: {
      id: true,
      orderId: true,
      status: true,
      paidAt: true,

      order: {
        select: {
          orderNumber: true,
        },
      },
    },
  });

  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  if (payment.status === status) {
    throw new AppError(
      `Payment is already ${status}`,
      400
    );
  }

  const allowedTransitions =
    PAYMENT_STATUS_TRANSITIONS[
    payment.status
    ];

  if (!allowedTransitions.includes(status)) {
    throw new AppError(
      `Payment status cannot be changed from "${payment.status}" to "${status}"`,
      400
    );
  }

  const oldStatus = payment.status;
  const newStatus = status;

  const updatedPayment =
    await prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: {
          id,
        },

        data: {
          status,

          paidAt:
            status === "PAID"
              ? payment.paidAt ?? new Date()
              : status === "REFUNDED" ||
                status === "PARTIALLY_REFUNDED"
                ? null
                : payment.paidAt,
        },

        select: {
          id: true,
          orderId: true,

          method: true,
          status: true,

          transactionId: true,

          amount: true,
          currency: true,

          gateway: true,
          paidAt: true,

          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.order.update({
        where: {
          id: payment.orderId,
        },

        data: {
          paymentStatus: status,
        },
      });

      await createAuditLogTx(tx, {
        userId,
        action: "STATUS_CHANGE",
        entity: "Payment",
        entityId: payment.id,
        description: `Changed payment status from "${oldStatus}" to "${newStatus}"`,
        metadata: {
          orderId: payment.orderId,
          orderNumber: payment.order.orderNumber,
          oldStatus,
          newStatus,
          transactionId: updated.transactionId,
          amount: updated.amount,
          currency: updated.currency,
        },
      });

      return updated;
    });

  return updatedPayment;
};