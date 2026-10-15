import { prisma } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";
import { AppError } from "../utils/AppError.js";

import {
  createAuditLogTx,
} from "./auditLog.service.js";

const getOrderForFulfillment = async (
  tx: Prisma.TransactionClient,
  orderId: string
) => {
  const order = await tx.order.findUnique({
    where: {
      id: orderId,
    },

    include: {
      items: {
        include: {
          variant: {
            include: {
              inventory: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  return order;
};

const validateOrderItems = (
  order: Awaited<
    ReturnType<typeof getOrderForFulfillment>
  >
) => {
  if (!order.items.length) {
    throw new AppError(
      "Order has no items",
      400
    );
  }

  for (const item of order.items) {
    if (!item.variantId || !item.variant) {
      throw new AppError(
        `Inventory variant is missing for SKU ${item.sku}`,
        400
      );
    }

    if (!item.variant.inventory) {
      throw new AppError(
        `Inventory record is missing for SKU ${item.sku}`,
        400
      );
    }

    if (item.quantity <= 0) {
      throw new AppError(
        `Invalid quantity for SKU ${item.sku}`,
        400
      );
    }
  }
};



interface FulfillmentListParams {
  page?: number;
  limit?: number;
  search?: string;
  fulfillmentStatus?:
    | "UNFULFILLED"
    | "PARTIALLY_FULFILLED"
    | "FULFILLED";
  orderStatus?:
    | "PENDING"
    | "CONFIRMED"
    | "PROCESSING"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED"
    | "RETURN_REQUESTED"
    | "RETURNED"
    | "REFUNDED";
  sortBy?: "createdAt" | "orderNumber";
  sortOrder?: "asc" | "desc";
}

export const getFulfillmentOrders = async ({
  page = 1,
  limit = 20,
  search,
  fulfillmentStatus,
  orderStatus,
  sortBy = "createdAt",
  sortOrder = "desc",
}: FulfillmentListParams) => {
  const safePage = Math.max(page, 1);
  const safeLimit = Math.min(
    Math.max(limit, 1),
    100
  );

  const skip = (safePage - 1) * safeLimit;

  const where = {
    ...(fulfillmentStatus
      ? { fulfillmentStatus }
      : {}),

    ...(orderStatus
      ? { status: orderStatus }
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

  const [orders, total] =
    await prisma.$transaction([
      prisma.order.findMany({
        where,
        skip,
        take: safeLimit,

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

          items: {
            select: {
              id: true,
              quantity: true,
              sku: true,
              productName: true,
              variantName: true,

              variant: {
                select: {
                  id: true,
                  name: true,
                  sku: true,

                  inventory: {
                    select: {
                      quantity: true,
                      reservedQuantity: true,
                    },
                  },
                },
              },
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
        },
      }),

      prisma.order.count({
        where,
      }),
    ]);

  return {
    orders,

    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(
        total / safeLimit
      ),
    },
  };
};

export const getFulfillmentSummary = async () => {
  const groups = await prisma.order.groupBy({
    by: ["fulfillmentStatus"],
    _count: {
      _all: true,
    },
  });

  const counts = groups.reduce(
    (acc, item) => {
      acc[item.fulfillmentStatus] =
        item._count._all;

      return acc;
    },
    {} as Record<string, number>
  );

  return {
    totalOrders:
      Object.values(counts).reduce(
        (sum, count) => sum + count,
        0
      ),

    unfulfilled:
      counts.UNFULFILLED ?? 0,

    partiallyFulfilled:
      counts.PARTIALLY_FULFILLED ?? 0,

    fulfilled:
      counts.FULFILLED ?? 0,
  };
};



const transactionReference = (
  orderId: string
) => `ORDER:${orderId}`;

export const reserveOrderStock = async (
  orderId: string,
  userId: string
) => {
  return prisma.$transaction(async (tx) => {
    const order = await getOrderForFulfillment(
      tx,
      orderId
    );

    validateOrderItems(order);

    if (
      order.status !== "PENDING"
    ) {
      throw new AppError(
        `Stock can only be reserved for a PENDING order. Current status: ${order.status}`,
        400
      );
    }

    const reference =
      transactionReference(orderId);

    for (const item of order.items) {
      const inventory =
        item.variant!.inventory!;

      const existingReservation =
        await tx.inventoryTransaction.findFirst({
          where: {
            inventoryId: inventory.id,
            variantId: item.variantId!,
            type: "RESERVATION",
            reference,
          },
        });

      if (existingReservation) {
        throw new AppError(
          `Stock is already reserved for SKU ${item.sku}`,
          409
        );
      }

      const updated =
        await tx.inventory.updateMany({
          where: {
            id: inventory.id,

            // Available stock must be enough.
            quantity: {
              gte:
                inventory.reservedQuantity +
                item.quantity,
            },
          },

          data: {
            reservedQuantity: {
              increment: item.quantity,
            },
          },
        });

      if (updated.count !== 1) {
        throw new AppError(
          `Insufficient available stock for SKU ${item.sku}`,
          409
        );
      }

      await tx.inventoryTransaction.create({
        data: {
          variantId: item.variantId!,
          inventoryId: inventory.id,
          type: "RESERVATION",
          quantity: item.quantity,
          reference,
          note: `Stock reserved for order ${order.orderNumber}`,
        },
      });
    }

    const updatedOrder =
      await tx.order.update({
        where: {
          id: orderId,
        },

        data: {
          status: "CONFIRMED",
        },

        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          fulfillmentStatus: true,
        },
      });

    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: "CONFIRMED",
        note: "Order confirmed and stock reserved",
      },
    });

    await createAuditLogTx(tx, {
      userId,
      action: "STATUS_CHANGE",
      entity: "Order",
      entityId: updatedOrder.id,
      description: `Order "${updatedOrder.orderNumber}" was confirmed and stock was reserved`,
      metadata: {
        orderNumber: updatedOrder.orderNumber,
        oldStatus: order.status,
        newStatus: updatedOrder.status,
        stockAction: "RESERVATION",
        reference,
      },
    });

    return updatedOrder;
  });
};

export const releaseOrderStock = async (
  orderId: string,
  userId: string,
  note = "Stock released"
) => {
  return prisma.$transaction(async (tx) => {
    const order = await getOrderForFulfillment(
      tx,
      orderId
    );

    validateOrderItems(order);

    if (
      !["PENDING", "CONFIRMED", "PROCESSING"].includes(
        order.status
      )
    ) {
      throw new AppError(
        `Stock cannot be released from order status ${order.status}`,
        400
      );
    }

    const reference =
      transactionReference(orderId);

    for (const item of order.items) {
      const inventory =
        item.variant!.inventory!;

      const reservation =
        await tx.inventoryTransaction.findFirst({
          where: {
            inventoryId: inventory.id,
            variantId: item.variantId!,
            type: "RESERVATION",
            reference,
          },
        });

      if (!reservation) {
        continue;
      }

      const existingRelease =
        await tx.inventoryTransaction.findFirst({
          where: {
            inventoryId: inventory.id,
            variantId: item.variantId!,
            type: "RELEASE",
            reference,
          },
        });

      if (existingRelease) {
        continue;
      }

      const updated =
        await tx.inventory.updateMany({
          where: {
            id: inventory.id,

            reservedQuantity: {
              gte: item.quantity,
            },
          },

          data: {
            reservedQuantity: {
              decrement: item.quantity,
            },
          },
        });

      if (updated.count !== 1) {
        throw new AppError(
          `Unable to release reserved stock for SKU ${item.sku}`,
          409
        );
      }

      await tx.inventoryTransaction.create({
        data: {
          variantId: item.variantId!,
          inventoryId: inventory.id,
          type: "RELEASE",
          quantity: item.quantity,
          reference,
          note,
        },
      });
    }

    await createAuditLogTx(tx, {
      userId,
      action: "STOCK_ADJUSTMENT",
      entity: "Order",
      entityId: order.id,
      description: `Released reserved stock for order "${order.orderNumber}"`,
      metadata: {
        orderNumber: order.orderNumber,
        stockAction: "RELEASE",
        reference,
        note,
      },
    });

    return true;
  });
};

export const fulfillOrder = async (
  orderId: string, userId: string
) => {
  return prisma.$transaction(async (tx) => {
    const order = await getOrderForFulfillment(
      tx,
      orderId
    );

    validateOrderItems(order);

    if (order.status !== "PROCESSING") {
      throw new AppError(
        `Order must be PROCESSING before fulfillment. Current status: ${order.status}`,
        400
      );
    }

    const reference =
      transactionReference(orderId);

    for (const item of order.items) {
      const inventory =
        item.variant!.inventory!;

      const reservation =
        await tx.inventoryTransaction.findFirst({
          where: {
            inventoryId: inventory.id,
            variantId: item.variantId!,
            type: "RESERVATION",
            reference,
          },
        });

      if (!reservation) {
        throw new AppError(
          `No stock reservation found for SKU ${item.sku}`,
          409
        );
      }

      const existingSale =
        await tx.inventoryTransaction.findFirst({
          where: {
            inventoryId: inventory.id,
            variantId: item.variantId!,
            type: "SALE",
            reference,
          },
        });

      if (existingSale) {
        throw new AppError(
          `Stock has already been fulfilled for SKU ${item.sku}`,
          409
        );
      }

      /*
       * Atomically:
       *
       * quantity >= ordered quantity
       * reservedQuantity >= ordered quantity
       *
       * then:
       * quantity -= ordered quantity
       * reservedQuantity -= ordered quantity
       */
      const updated =
        await tx.inventory.updateMany({
          where: {
            id: inventory.id,

            quantity: {
              gte: item.quantity,
            },

            reservedQuantity: {
              gte: item.quantity,
            },
          },

          data: {
            quantity: {
              decrement: item.quantity,
            },

            reservedQuantity: {
              decrement: item.quantity,
            },
          },
        });

      if (updated.count !== 1) {
        throw new AppError(
          `Unable to fulfill stock for SKU ${item.sku}`,
          409
        );
      }

      await tx.inventoryTransaction.create({
        data: {
          variantId: item.variantId!,
          inventoryId: inventory.id,
          type: "SALE",
          quantity: item.quantity,
          reference,
          note: `Stock sold for order ${order.orderNumber}`,
        },
      });
    }

    const updatedOrder =
      await tx.order.update({
        where: {
          id: orderId,
        },

        data: {
          status: "SHIPPED",
          fulfillmentStatus: "FULFILLED",
        },

        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          fulfillmentStatus: true,
        },
      });

    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: "SHIPPED",
        note: "Order fulfilled and stock deducted",
      },
    });

    await createAuditLogTx(tx, {
      userId,
      action: "STATUS_CHANGE",
      entity: "Order",
      entityId: updatedOrder.id,
      description: `Order "${updatedOrder.orderNumber}" was fulfilled and shipped`,
      metadata: {
        orderNumber: updatedOrder.orderNumber,
        oldStatus: order.status,
        newStatus: updatedOrder.status,
        oldFulfillmentStatus: order.fulfillmentStatus,
        newFulfillmentStatus:
          updatedOrder.fulfillmentStatus,
        stockAction: "SALE",
        reference,
      },
    });

    return updatedOrder;
  });
};

export const cancelOrder = async (
  orderId: string,
  userId: string,
  note = "Order cancelled by admin"
) => {
  return prisma.$transaction(async (tx) => {
    const order = await getOrderForFulfillment(
      tx,
      orderId
    );

    validateOrderItems(order);

    if (
      !["PENDING", "CONFIRMED", "PROCESSING"].includes(
        order.status
      )
    ) {
      throw new AppError(
        `Order cannot be cancelled from status ${order.status}`,
        400
      );
    }

    const reference =
      transactionReference(orderId);

    for (const item of order.items) {
      const inventory =
        item.variant!.inventory!;

      const reservation =
        await tx.inventoryTransaction.findFirst({
          where: {
            inventoryId: inventory.id,
            variantId: item.variantId!,
            type: "RESERVATION",
            reference,
          },
        });

      if (!reservation) {
        continue;
      }

      const release =
        await tx.inventoryTransaction.findFirst({
          where: {
            inventoryId: inventory.id,
            variantId: item.variantId!,
            type: "RELEASE",
            reference,
          },
        });

      if (release) {
        continue;
      }

      const updated =
        await tx.inventory.updateMany({
          where: {
            id: inventory.id,
            reservedQuantity: {
              gte: item.quantity,
            },
          },

          data: {
            reservedQuantity: {
              decrement: item.quantity,
            },
          },
        });

      if (updated.count !== 1) {
        throw new AppError(
          `Unable to release stock for SKU ${item.sku}`,
          409
        );
      }

      await tx.inventoryTransaction.create({
        data: {
          variantId: item.variantId!,
          inventoryId: inventory.id,
          type: "RELEASE",
          quantity: item.quantity,
          reference,
          note: `Stock released because order ${order.orderNumber} was cancelled`,
        },
      });
    }

    const updatedOrder =
      await tx.order.update({
        where: {
          id: orderId,
        },

        data: {
          status: "CANCELLED",
        },

        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          fulfillmentStatus: true,
        },
      });

    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: "CANCELLED",
        note,
      },
    });

    await createAuditLogTx(tx, {
      userId,
      action: "STATUS_CHANGE",
      entity: "Order",
      entityId: updatedOrder.id,
      description: `Cancelled order "${updatedOrder.orderNumber}"`,
      metadata: {
        orderNumber: updatedOrder.orderNumber,
        oldStatus: order.status,
        newStatus: updatedOrder.status,
        stockAction: "RELEASE",
        reference,
        note,
      },
    });

    return updatedOrder;
  });
};

export const returnOrder = async (
  orderId: string,
  userId: string,
  note = "Order returned"
) => {
  return prisma.$transaction(async (tx) => {
    const order = await getOrderForFulfillment(
      tx,
      orderId
    );

    validateOrderItems(order);

    if (order.status !== "RETURN_REQUESTED") {
      throw new AppError(
        `Order must be RETURN_REQUESTED before return. Current status: ${order.status}`,
        400
      );
    }

    const reference =
      transactionReference(orderId);

    for (const item of order.items) {
      const inventory =
        item.variant!.inventory!;

      const existingReturn =
        await tx.inventoryTransaction.findFirst({
          where: {
            inventoryId: inventory.id,
            variantId: item.variantId!,
            type: "RETURN",
            reference,
          },
        });

      if (existingReturn) {
        throw new AppError(
          `Stock has already been returned for SKU ${item.sku}`,
          409
        );
      }

      await tx.inventory.update({
        where: {
          id: inventory.id,
        },

        data: {
          quantity: {
            increment: item.quantity,
          },
        },
      });

      await tx.inventoryTransaction.create({
        data: {
          variantId: item.variantId!,
          inventoryId: inventory.id,
          type: "RETURN",
          quantity: item.quantity,
          reference,
          note: `Stock returned for order ${order.orderNumber}`,
        },
      });
    }

    const updatedOrder =
      await tx.order.update({
        where: {
          id: orderId,
        },

        data: {
          status: "RETURNED",
        },

        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          fulfillmentStatus: true,
        },
      });

    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: "RETURNED",
        note,
      },
    });

    await createAuditLogTx(tx, {
      userId,
      action: "STATUS_CHANGE",
      entity: "Order",
      entityId: updatedOrder.id,
      description: `Returned order "${updatedOrder.orderNumber}"`,
      metadata: {
        orderNumber: updatedOrder.orderNumber,
        oldStatus: order.status,
        newStatus: updatedOrder.status,
        stockAction: "RETURN",
        reference,
        note,
      },
    });

    return updatedOrder;
  });
};