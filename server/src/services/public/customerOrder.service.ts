import { prisma } from "../../config/database.js";
import { AppError } from "../../utils/AppError.js";
import { createAuditLogTx } from "../auditLog.service.js";

const getOwnedOrder = async (
    userId: string,
    orderId: string
) => {
    const order = await prisma.order.findFirst({
        where: {
            id: orderId,
            userId,
        },
        select: {
            id: true,
            orderNumber: true,
            userId: true,
            status: true,
            paymentStatus: true,
            fulfillmentStatus: true,
        },
    });

    if (!order) {
        throw new AppError(
            "Order not found",
            404
        );
    }

    return order;
};

export const cancelCustomerOrder = async (
    userId: string,
    orderId: string,
    note?: string
) => {
    const order = await getOwnedOrder(
        userId,
        orderId
    );

    if (
        ![
            "PENDING",
            "CONFIRMED",
            "PROCESSING",
        ].includes(order.status)
    ) {
        throw new AppError(
            `This order cannot be cancelled because it is ${order.status}`,
            400
        );
    }

    return prisma.$transaction(
        async (tx) => {
            /*
             * Re-read ownership inside the transaction.
             */
            const current =
                await tx.order.findFirst({
                    where: {
                        id: orderId,
                        userId,
                    },
                    select: {
                        id: true,
                        orderNumber: true,
                        status: true,
                    },
                });

            if (!current) {
                throw new AppError(
                    "Order not found",
                    404
                );
            }

            if (
                ![
                    "PENDING",
                    "CONFIRMED",
                    "PROCESSING",
                ].includes(current.status)
            ) {
                throw new AppError(
                    `This order can no longer be cancelled because it is ${current.status}`,
                    400
                );
            }

            /*
             * Release the reservation directly here.
             *
             * Checkout already created a RESERVATION transaction
             * using ORDER:<orderId>.
             */
            const reservations =
                await tx.inventoryTransaction.findMany({
                    where: {
                        reference: `ORDER:${orderId}`,
                        type: "RESERVATION",
                    },
                    select: {
                        inventoryId: true,
                        variantId: true,
                        quantity: true,
                    },
                });

            for (const reservation of reservations) {
                const released =
                    await tx.inventory.updateMany({
                        where: {
                            id: reservation.inventoryId,
                            reservedQuantity: {
                                gte: reservation.quantity,
                            },
                        },
                        data: {
                            reservedQuantity: {
                                decrement:
                                    reservation.quantity,
                            },
                        },
                    });

                if (released.count !== 1) {
                    throw new AppError(
                        "Unable to release reserved stock",
                        409
                    );
                }

                /*
                 * Prevent duplicate release transactions.
                 */
                const existingRelease =
                    await tx.inventoryTransaction.findFirst({
                        where: {
                            inventoryId:
                                reservation.inventoryId,
                            variantId:
                                reservation.variantId,
                            type: "RELEASE",
                            reference:
                                `ORDER:${orderId}`,
                        },
                    });

                if (!existingRelease) {
                    await tx.inventoryTransaction.create({
                        data: {
                            inventoryId:
                                reservation.inventoryId,
                            variantId:
                                reservation.variantId,
                            type: "RELEASE",
                            quantity:
                                reservation.quantity,
                            reference:
                                `ORDER:${orderId}`,
                            note:
                                `Stock released because customer cancelled order ${current.orderNumber}`,
                        },
                    });
                }
            }

            const updated =
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
                    note:
                        note ||
                        "Order cancelled by customer",
                },
            });

            await createAuditLogTx(tx, {
                userId,
                action: "STATUS_CHANGE",
                entity: "Order",
                entityId: orderId,
                description:
                    `Customer cancelled order "${current.orderNumber}"`,
                metadata: {
                    orderNumber:
                        current.orderNumber,
                    oldStatus: current.status,
                    newStatus: "CANCELLED",
                    stockAction: "RELEASE",
                    note:
                        note ||
                        "Order cancelled by customer",
                },
            });

            return updated;
        },
        {
            isolationLevel: "Serializable",
            maxWait: 5000,
            timeout: 15000,
        }
    );
};

export const requestCustomerReturn = async (
    userId: string,
    orderId: string,
    note?: string
) => {
    const order = await getOwnedOrder(
        userId,
        orderId
    );

    if (
        !["SHIPPED", "DELIVERED"].includes(
            order.status
        )
    ) {
        throw new AppError(
            `A return can only be requested after shipment or delivery. Current status: ${order.status}`,
            400
        );
    }

    return prisma.$transaction(
        async (tx) => {
            const current =
                await tx.order.findFirst({
                    where: {
                        id: orderId,
                        userId,
                    },
                    select: {
                        id: true,
                        orderNumber: true,
                        status: true,
                    },
                });

            if (!current) {
                throw new AppError(
                    "Order not found",
                    404
                );
            }

            if (
                !["SHIPPED", "DELIVERED"].includes(
                    current.status
                )
            ) {
                throw new AppError(
                    `A return cannot be requested from status ${current.status}`,
                    400
                );
            }

            const updated =
                await tx.order.update({
                    where: {
                        id: orderId,
                    },
                    data: {
                        status: "RETURN_REQUESTED",
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
                    status: "RETURN_REQUESTED",
                    note:
                        note ||
                        "Return requested by customer",
                },
            });

            await createAuditLogTx(tx, {
                userId,
                action: "STATUS_CHANGE",
                entity: "Order",
                entityId: orderId,
                description:
                    `Customer requested return for order "${current.orderNumber}"`,
                metadata: {
                    orderNumber:
                        current.orderNumber,
                    oldStatus: current.status,
                    newStatus:
                        "RETURN_REQUESTED",
                    note:
                        note ||
                        "Return requested by customer",
                },
            });

            return updated;
        },
        {
            isolationLevel: "Serializable",
            maxWait: 5000,
            timeout: 15000,
        }
    );
};