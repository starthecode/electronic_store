import crypto from "node:crypto";

import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../config/database.js";
import { AppError } from "../../utils/AppError.js";
import { createAuditLogTx } from "../auditLog.service.js";

interface CheckoutItemInput {
    variantId: string;
    quantity: number;
}

interface CheckoutInput {
    userId: string;
    items: CheckoutItemInput[];
    shippingAddressId: string;
    billingAddressId?: string;
    paymentMethod: "COD";
    discountCode?: string;
}

const money = (value: unknown) => Number(value ?? 0);

const createOrderNumber = () =>
    `ORD-${new Date()
        .toISOString()
        .replace(/\D/g, "")
        .slice(0, 14)}-${crypto
            .randomUUID()
            .slice(0, 8)
            .toUpperCase()}`;

const snapshotAddress = (address: any) => ({
    type: address.type,
    firstName: address.firstName,
    lastName: address.lastName,
    phone: address.phone,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
});

const calculateDiscount = async (
    tx: Prisma.TransactionClient,
    discountCode: string | undefined,
    subtotal: number,
    items: any[],
    userId: string
) => {
    if (!discountCode) {
        return {
            discount: null,
            discountAmount: 0,
        };
    }

    const code = discountCode.trim().toUpperCase();

    const discount = await tx.discount.findUnique({
        where: {
            code,
        },
        include: {
            products: true,
            categories: true,
        },
    });

    if (!discount) {
        throw new AppError("Invalid discount code", 400);
    }

    const now = new Date();

    if (discount.status !== "ACTIVE") {
        throw new AppError("This discount is not active", 400);
    }

    if (discount.startsAt > now) {
        throw new AppError("This discount is not active yet", 400);
    }

    if (discount.expiresAt && discount.expiresAt < now) {
        throw new AppError("This discount has expired", 400);
    }

    if (
        discount.usageLimit !== null &&
        discount.usageCount >= discount.usageLimit
    ) {
        throw new AppError("This discount has reached its usage limit", 400);
    }

    if (
        discount.minimumAmount !== null &&
        subtotal < money(discount.minimumAmount)
    ) {
        throw new AppError(
            `Minimum order amount for this discount is ₹${money(
                discount.minimumAmount
            ).toLocaleString("en-IN")}`,
            400
        );
    }

    const previousUsage = await tx.discountUsage.findFirst({
        where: {
            discountId: discount.id,
            userId,
        },
    });

    if (previousUsage) {
        throw new AppError(
            "You have already used this discount",
            400
        );
    }

    let eligibleSubtotal = subtotal;

    if (discount.scope === "PRODUCT") {
        const productIds = new Set(
            discount.products.map((item) => item.productId)
        );

        eligibleSubtotal = items
            .filter((item) => productIds.has(item.productId))
            .reduce(
                (total, item) =>
                    total + money(item.unitPrice) * item.quantity,
                0
            );
    }

    if (discount.scope === "CATEGORY") {
        const categoryIds = new Set(
            discount.categories.map((item) => item.categoryId)
        );

        eligibleSubtotal = items
            .filter((item) =>
                categoryIds.has(item.product.categoryId)
            )
            .reduce(
                (total, item) =>
                    total + money(item.unitPrice) * item.quantity,
                0
            );
    }

    if (eligibleSubtotal <= 0) {
        throw new AppError(
            "This discount does not apply to the items in your cart",
            400
        );
    }

    let amount =
        discount.type === "PERCENTAGE"
            ? (eligibleSubtotal * money(discount.value)) / 100
            : money(discount.value);

    if (discount.maximumDiscount !== null) {
        amount = Math.min(
            amount,
            money(discount.maximumDiscount)
        );
    }

    amount = Math.min(amount, subtotal);

    return {
        discount,
        discountAmount: Number(amount.toFixed(2)),
    };
};

export const createCustomerOrder = async ({
    userId,
    items,
    shippingAddressId,
    billingAddressId,
    paymentMethod,
    discountCode,
}: CheckoutInput) => {
    if (!items.length) {
        throw new AppError("Your cart is empty", 400);
    }

    const uniqueVariantIds = [
        ...new Set(items.map((item) => item.variantId)),
    ];

    if (uniqueVariantIds.length !== items.length) {
        throw new AppError(
            "Duplicate products are not allowed in checkout",
            400
        );
    }

    return prisma.$transaction(
        async (tx) => {
            const shippingAddress =
                await tx.address.findFirst({
                    where: {
                        id: shippingAddressId,
                        userId,
                        type: "SHIPPING",
                    },
                });

            if (!shippingAddress) {
                throw new AppError(
                    "Shipping address not found",
                    404
                );
            }

            const billingAddress = billingAddressId
                ? await tx.address.findFirst({
                    where: {
                        id: billingAddressId,
                        userId,
                    },
                })
                : shippingAddress;

            if (!billingAddress) {
                throw new AppError(
                    "Billing address not found",
                    404
                );
            }

            const variants =
                await tx.productVariant.findMany({
                    where: {
                        id: {
                            in: uniqueVariantIds,
                        },
                        status: "ACTIVE",
                        product: {
                            status: "ACTIVE",
                        },
                    },
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                categoryId: true,
                            },
                        },
                        inventory: true,
                    },
                });

            if (variants.length !== uniqueVariantIds.length) {
                throw new AppError(
                    "One or more products in your cart are no longer available",
                    409
                );
            }

            const variantMap = new Map(
                variants.map((variant) => [
                    variant.id,
                    variant,
                ])
            );

            const orderItems: Array<{
                variantId: string;
                productId: string;
                productName: string;
                variantName: string | null;
                sku: string;
                quantity: number;
                unitPrice: number;
                totalPrice: number;
            }> = [];

            let subtotal = 0;

            for (const cartItem of items) {
                const variant = variantMap.get(
                    cartItem.variantId
                );

                if (!variant) {
                    throw new AppError(
                        "Product variant is no longer available",
                        409
                    );
                }

                if (!variant.inventory) {
                    throw new AppError(
                        `Inventory is unavailable for ${variant.sku}`,
                        409
                    );
                }

                const available =
                    variant.inventory.quantity -
                    variant.inventory.reservedQuantity;

                if (available < cartItem.quantity) {
                    throw new AppError(
                        `Insufficient stock for ${variant.product.name}`,
                        409
                    );
                }

                const unitPrice = money(variant.price);
                const totalPrice =
                    unitPrice * cartItem.quantity;

                subtotal += totalPrice;

                orderItems.push({
                    variantId: variant.id,
                    productId: variant.product.id,
                    productName: variant.product.name,
                    variantName: variant.name,
                    sku: variant.sku,
                    quantity: cartItem.quantity,
                    unitPrice,
                    totalPrice,
                });
            }

            subtotal = Number(subtotal.toFixed(2));

            const {
                discount,
                discountAmount,
            } = await calculateDiscount(
                tx,
                discountCode,
                subtotal,
                orderItems.map((item) => ({
                    ...item,
                    product: variantMap.get(item.variantId)!.product,
                })),
                userId
            );

            /*
             * Keep shipping/tax server-authoritative.
             *
             * Until store shipping/tax rules are configured,
             * these remain zero.
             */
            const shippingAmount = 0;
            const taxAmount = 0;

            const totalAmount = Number(
                (
                    subtotal -
                    discountAmount +
                    shippingAmount +
                    taxAmount
                ).toFixed(2)
            );

            if (totalAmount < 0) {
                throw new AppError(
                    "Invalid order total",
                    400
                );
            }

            /*
             * Reserve stock atomically.
             *
             * We do this inside the SAME transaction that creates
             * the order so a failed order cannot leave reservations
             * behind.
             */
            const referencePrefix = "CHECKOUT:";

            for (const item of orderItems) {
                const variant =
                    variantMap.get(item.variantId)!;

                const inventory =
                    variant.inventory!;

                const updated =
                    await tx.inventory.updateMany({
                        where: {
                            id: inventory.id,
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
                        `Insufficient available stock for ${item.sku}`,
                        409
                    );
                }
            }

            const order = await tx.order.create({
                data: {
                    orderNumber: createOrderNumber(),
                    userId,

                    /*
                     * Checkout already reserved inventory, so the order
                     * enters CONFIRMED directly.
                     */
                    status: "CONFIRMED",
                    paymentStatus: "PENDING",
                    fulfillmentStatus: "UNFULFILLED",

                    subtotal,
                    discountAmount,
                    shippingAmount,
                    taxAmount,
                    totalAmount,

                    discountCode:
                        discount?.code ?? null,

                    shippingAddress:
                        snapshotAddress(shippingAddress),

                    billingAddress:
                        snapshotAddress(billingAddress),

                    items: {
                        create: orderItems.map((item) => ({
                            variantId: item.variantId,
                            productName: item.productName,
                            variantName: item.variantName,
                            sku: item.sku,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            totalPrice: item.totalPrice,
                        })),
                    },

                    payment: {
                        create: {
                            method: paymentMethod,
                            status: "PENDING",
                            amount: totalAmount,
                            currency: "INR",
                        },
                    },

                    statusHistory: {
                        create: {
                            status: "CONFIRMED",
                            note:
                                "Order placed and stock reserved",
                        },
                    },
                },

                include: {
                    items: true,
                    payment: true,
                },
            });

            /*
             * Inventory transactions must reference the final
             * order ID. This gives fulfillment/release operations
             * a consistent reference.
             */
            const reference =
                `ORDER:${order.id}`;

            for (const item of orderItems) {
                const variant =
                    variantMap.get(item.variantId)!;

                const inventory =
                    variant.inventory!;

                await tx.inventoryTransaction.create({
                    data: {
                        variantId: item.variantId,
                        inventoryId: inventory.id,
                        type: "RESERVATION",
                        quantity: item.quantity,
                        reference,
                        note:
                            `Stock reserved for order ${order.orderNumber}`,
                    },
                });
            }

            if (discount) {
                await tx.discount.update({
                    where: {
                        id: discount.id,
                    },
                    data: {
                        usageCount: {
                            increment: 1,
                        },
                    },
                });

                await tx.discountUsage.create({
                    data: {
                        discountId: discount.id,
                        userId,
                        orderId: order.id,
                    },
                });
            }

            await createAuditLogTx(tx, {
                userId,
                action: "CREATE",
                entity: "Order",
                entityId: order.id,
                description:
                    `Customer placed order "${order.orderNumber}"`,
                metadata: {
                    orderNumber: order.orderNumber,
                    paymentMethod,
                    subtotal,
                    discountAmount,
                    shippingAmount,
                    taxAmount,
                    totalAmount,
                    itemCount: orderItems.length,
                },
            });

            return order;
        },
        {
            isolationLevel:
                "Serializable",
            maxWait: 5000,
            timeout: 15000,
        }
    );
};