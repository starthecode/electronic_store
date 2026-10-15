import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import {
  createAuditLogTx,
} from "./auditLog.service.js";

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURN_REQUESTED"
  | "RETURNED"
  | "REFUNDED";

type PaymentStatus =
  | "PENDING"
  | "AUTHORIZED"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

type FulfillmentStatus =
  | "UNFULFILLED"
  | "PARTIALLY_FULFILLED"
  | "FULFILLED";

interface OrderListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;
  sortBy?: "createdAt" | "totalAmount" | "orderNumber";
  sortOrder?: "asc" | "desc";
}

const allowedStatusTransitions: Record<
  OrderStatus,
  OrderStatus[]
> = {
  PENDING: ["CONFIRMED", "CANCELLED"],

  CONFIRMED: [
    "PROCESSING",
    "CANCELLED",
  ],

  PROCESSING: [
    "SHIPPED",
    "CANCELLED",
  ],

  SHIPPED: [
    "DELIVERED",
    "RETURN_REQUESTED",
  ],

  DELIVERED: [
    "RETURN_REQUESTED",
  ],

  CANCELLED: [],

  RETURN_REQUESTED: [
    "RETURNED",
  ],

  RETURNED: [
    "REFUNDED",
  ],

  REFUNDED: [],
};

export const getOrders = async ({
  page = 1,
  limit = 20,
  search,
  status,
  paymentStatus,
  fulfillmentStatus,
  sortBy = "createdAt",
  sortOrder = "desc",
}: OrderListParams) => {
  const skip = (page - 1) * limit;

  const where = {
    ...(status ? { status } : {}),

    ...(paymentStatus
      ? { paymentStatus }
      : {}),

    ...(fulfillmentStatus
      ? { fulfillmentStatus }
      : {}),

    ...(search
      ? {
        OR: [
          {
            orderNumber: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            user: {
              email: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          },
          {
            user: {
              firstName: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          },
          {
            user: {
              lastName: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          },
        ],
      }
      : {}),
  };

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      skip,
      take: limit,

      orderBy: {
        [sortBy]: sortOrder,
      },

      select: {
        id: true,
        orderNumber: true,

        status: true,
        paymentStatus: true,
        fulfillmentStatus: true,

        subtotal: true,
        discountAmount: true,
        shippingAmount: true,
        taxAmount: true,
        totalAmount: true,

        discountCode: true,

        createdAt: true,
        updatedAt: true,

        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },

        payment: {
          select: {
            id: true,
            method: true,
            status: true,
            transactionId: true,
            amount: true,
            currency: true,
            paidAt: true,
          },
        },

        _count: {
          select: {
            items: true,
            statusHistory: true,
          },
        },
      },
    }),

    prisma.order.count({
      where,
    }),
  ]);

  return {
    orders,

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getOrderById = async (
  id: string
) => {
  const order = await prisma.order.findUnique({
    where: {
      id,
    },

    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
        },
      },

      items: {
        orderBy: {
          createdAt: "asc",
        },

        include: {
          variant: {
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,

              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      },

      payment: true,

      statusHistory: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  return order;
};

export const updateOrderStatus = async (
  id: string,
  status: OrderStatus,
  note?: string,
  userId?: string
) => {
  const order = await prisma.order.findUnique({
    where: {
      id,
    },

    select: {
      id: true,
      orderNumber: true,
      status: true,
    },
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.status === status) {
    throw new AppError(
      `Order is already ${status}`,
      400
    );
  }

  const allowedStatuses =
    allowedStatusTransitions[order.status as OrderStatus];

  if (!allowedStatuses.includes(status)) {
    throw new AppError(
      `Order cannot move from ${order.status} to ${status}`,
      400
    );
  }

  const updatedOrder =
    await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: {
          id,
        },

        data: {
          status,
        },

        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status,
          note: note || null,
        },
      });

      await createAuditLogTx(tx, {
        userId,
        action: "STATUS_CHANGE",
        entity: "Order",
        entityId: order.id,
        description: `Changed order status from "${order.status}" to "${status}"`,
        metadata: {
          oldStatus: order.status,
          newStatus: status,
          orderNumber: updated.orderNumber,
          note: note || null,
        },
      });

      return updated;
    });

  return updatedOrder;
};

export const updatePaymentStatus = async (
  id: string,
  status: PaymentStatus,
  userId?: string
) => {
  const order = await prisma.order.findUnique({
    where: {
      id,
    },

    include: {
      payment: true,
    },
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (!order.payment) {
    throw new AppError(
      "Payment record does not exist for this order",
      404
    );
  }

  const updated = await prisma.$transaction(
    async (tx) => {
      const payment = await tx.payment.update({
        where: {
          orderId: id,
        },

        data: {
          status,

          paidAt:
            status === "PAID"
              ? order.payment?.paidAt ?? new Date()
              : status === "REFUNDED" ||
                status === "PARTIALLY_REFUNDED"
                ? null
                : order.payment?.paidAt,
        },
      });

      await tx.order.update({
        where: {
          id,
        },

        data: {
          paymentStatus: status,
        },
      });

      await createAuditLogTx(tx, {
        userId,
        action: "STATUS_CHANGE",
        entity: "Order",
        entityId: order.id,
        description: `Changed order payment status from "${order.paymentStatus}" to "${status}"`,
        metadata: {
          orderNumber: order.orderNumber,
          oldPaymentStatus: order.paymentStatus,
          newPaymentStatus: status,
          paymentId: payment.id,
          paymentMethod: payment.method,
          transactionId: payment.transactionId,
        },
      });

      return payment;
    }
  );

  return updated;
};

export const updateFulfillmentStatus = async (
  id: string,
  status: FulfillmentStatus,
  userId?: string
) => {
  const order = await prisma.order.findUnique({
    where: {
      id,
    },

    select: {
      id: true,
      orderNumber: true,
      fulfillmentStatus: true,
    },
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.fulfillmentStatus === status) {
    throw new AppError(
      `Order fulfillment is already ${status}`,
      400
    );
  }

  const updated = await prisma.$transaction(
    async (tx) => {
      const updatedOrder =
        await tx.order.update({
          where: {
            id,
          },

          data: {
            fulfillmentStatus: status,
          },
        });

      await createAuditLogTx(tx, {
        userId,
        action: "STATUS_CHANGE",
        entity: "Order",
        entityId: order.id,
        description: `Changed order fulfillment status from "${order.fulfillmentStatus}" to "${status}"`,
        metadata: {
          orderNumber: order.orderNumber,
          oldFulfillmentStatus:
            order.fulfillmentStatus,
          newFulfillmentStatus: status,
        },
      });

      return updatedOrder;
    }
  );

  return updated;
};

export const getOrderStatusHistory = async (
  id: string
) => {
  const order = await prisma.order.findUnique({
    where: {
      id,
    },

    select: {
      id: true,
    },
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  return prisma.orderStatusHistory.findMany({
    where: {
      orderId: id,
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getOrderSummary = async () => {
  const [totalOrders, statusGroups] = await Promise.all([
    prisma.order.count(),

    prisma.order.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    }),
  ]);

  const counts = statusGroups.reduce(
    (acc, item) => {
      acc[item.status] = item._count._all;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    totalOrders,

    pendingOrders: counts.PENDING ?? 0,

    processingOrders: counts.PROCESSING ?? 0,

    shippedOrders: counts.SHIPPED ?? 0,

    cancelledOrders: counts.CANCELLED ?? 0,

    returnedOrders:
      (counts.RETURN_REQUESTED ?? 0) +
      (counts.RETURNED ?? 0) +
      (counts.REFUNDED ?? 0),

    // Useful for future dashboard/reporting
    confirmedOrders: counts.CONFIRMED ?? 0,

    deliveredOrders: counts.DELIVERED ?? 0,
  };
};