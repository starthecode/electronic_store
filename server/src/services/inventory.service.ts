import { prisma } from "../config/database.js";
import { Prisma } from "../generated/prisma/client.js";
import { AppError } from "../utils/AppError.js";
import type { InventoryTransactionType } from "../generated/prisma/enums.js";

import {
  createAuditLog,
  createAuditLogTx,
} from "./auditLog.service.js";

const ensureVariant = async (
  productId: string,
  variantId: string
) => {
  const variant = await prisma.productVariant.findFirst({
    where: {
      id: variantId,
      productId,
    },
    select: {
      id: true,
      productId: true,
      sku: true,
      name: true,
      price: true,
      status: true,
    },
  });

  if (!variant) {
    throw new AppError("Product variant not found", 404);
  }

  return variant;
};

const calculateAvailableQuantity = (
  quantity: number,
  reservedQuantity: number
) => quantity - reservedQuantity;

const runInventoryTransaction = async <T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> => {
  try {
    return await prisma.$transaction(callback, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      throw new AppError(
        "Inventory was updated by another request. Please retry.",
        409
      );
    }

    throw error;
  }
};

export const getInventory = async (
  productId: string,
  variantId: string
) => {
  const variant = await ensureVariant(productId, variantId);

  const inventory = await prisma.inventory.findUnique({
    where: {
      variantId,
    },
  });

  if (!inventory) {
    throw new AppError("Inventory not found for this variant", 404);
  }

  return {
    ...inventory,
    availableQuantity: calculateAvailableQuantity(
      inventory.quantity,
      inventory.reservedQuantity
    ),
    variant,
  };
};

export const createInventory = async (
  productId: string,
  variantId: string,
  data: {
    quantity?: number;
    reservedQuantity?: number;
    reorderLevel?: number;
  },
  userId: string
) => {
  await ensureVariant(productId, variantId);

  const quantity = data.quantity ?? 0;
  const reservedQuantity = data.reservedQuantity ?? 0;
  const reorderLevel = data.reorderLevel ?? 0;

  if (reservedQuantity > quantity) {
    throw new AppError(
      "Reserved quantity cannot be greater than total quantity",
      400
    );
  }

  try {
    return await runInventoryTransaction(async (tx) => {
      const existingInventory = await tx.inventory.findUnique({
        where: {
          variantId,
        },
      });

      if (existingInventory) {
        throw new AppError(
          "Inventory already exists for this variant",
          409
        );
      }

      const inventory = await tx.inventory.create({
        data: {
          variantId,
          quantity,
          reservedQuantity,
          reorderLevel,
        },
      });

      await createAuditLogTx(tx, {
        userId,
        action: "CREATE",
        entity: "Inventory",
        entityId: inventory.id,
        description: "Created inventory for variant",
        metadata: {
          productId,
          variantId,
          quantity,
          reservedQuantity,
          reorderLevel,
        },
      });

      return {
        ...inventory,
        availableQuantity: calculateAvailableQuantity(
          inventory.quantity,
          inventory.reservedQuantity
        ),
      };
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(
        "Inventory already exists for this variant",
        409
      );
    }

    throw error;
  }
};

export const updateInventory = async (
  productId: string,
  variantId: string,
  data: {
    reorderLevel?: number;
  },
  userId: string
) => {
  await ensureVariant(productId, variantId);

  const inventory = await prisma.inventory.findUnique({
    where: {
      variantId,
    },
  });

  if (!inventory) {
    throw new AppError("Inventory not found for this variant", 404);
  }

  const updatedInventory = await prisma.inventory.update({
    where: {
      variantId,
    },
    data: {
      ...(data.reorderLevel !== undefined && {
        reorderLevel: data.reorderLevel,
      }),
    },
  });

  await createAuditLog({
    userId,
    action: "UPDATE",
    entity: "Inventory",
    entityId: updatedInventory.id,
    description: `Updated inventory settings`,
    metadata: {
      variantId,
      fields: Object.keys(data),
      reorderLevel: data.reorderLevel,
    },
  });

  return {
    ...updatedInventory,
    availableQuantity: calculateAvailableQuantity(
      updatedInventory.quantity,
      updatedInventory.reservedQuantity
    ),
  };
};

export const adjustInventory = async (
  productId: string,
  variantId: string,
  data: {
    quantity: number;
    type: InventoryTransactionType;
    reference?: string;
    note?: string;
  },
  userId: string
) => {
  await ensureVariant(productId, variantId);

  if (
    data.type === "RESERVATION" ||
    data.type === "RELEASE"
  ) {
    throw new AppError(
      "Use the reserve or release inventory endpoint for this transaction type",
      400
    );
  }

  return runInventoryTransaction(async (tx) => {
    const inventory = await tx.inventory.findUnique({
      where: {
        variantId,
      },
    });

    if (!inventory) {
      throw new AppError(
        "Inventory not found for this variant",
        404
      );
    }

    const newQuantity = inventory.quantity + data.quantity;

    if (newQuantity < 0) {
      throw new AppError(
        "Inventory quantity cannot become negative",
        400
      );
    }

    if (newQuantity < inventory.reservedQuantity) {
      throw new AppError(
        "Inventory quantity cannot be less than reserved quantity",
        400
      );
    }

    const updatedInventory = await tx.inventory.update({
      where: {
        id: inventory.id,
      },
      data: {
        quantity: newQuantity,
      },
    });

    const transaction = await tx.inventoryTransaction.create({
      data: {
        variantId,
        inventoryId: inventory.id,
        type: data.type,
        quantity: data.quantity,
        reference: data.reference,
        note: data.note,
      },
    });

    await createAuditLogTx(tx, {
      userId,
      action: "STOCK_ADJUSTMENT",
      entity: "Inventory",
      entityId: inventory.id,
      description: `Adjusted inventory stock`,
      metadata: {
        productId,
        variantId,
        type: data.type,
        quantity: data.quantity,
        previousQuantity: inventory.quantity,
        newQuantity,
        reference: data.reference ?? null,
        note: data.note ?? null,
        transactionId: transaction.id,
      },
    });

    return {
      inventory: {
        ...updatedInventory,
        availableQuantity: calculateAvailableQuantity(
          updatedInventory.quantity,
          updatedInventory.reservedQuantity
        ),
      },
      transaction,
    };
  });
};

export const reserveInventory = async (
  productId: string,
  variantId: string,
  data: {
    quantity: number;
    reference?: string;
    note?: string;
  },
  userId: string
) => {
  await ensureVariant(productId, variantId);

  return runInventoryTransaction(async (tx) => {
    const inventory = await tx.inventory.findUnique({
      where: {
        variantId,
      },
    });

    if (!inventory) {
      throw new AppError(
        "Inventory not found for this variant",
        404
      );
    }

    const availableQuantity =
      inventory.quantity - inventory.reservedQuantity;

    if (data.quantity > availableQuantity) {
      throw new AppError(
        `Insufficient available stock. Available quantity: ${availableQuantity}`,
        400
      );
    }

    const updatedInventory = await tx.inventory.update({
      where: {
        id: inventory.id,
      },
      data: {
        reservedQuantity: {
          increment: data.quantity,
        },
      },
    });

    const transaction = await tx.inventoryTransaction.create({
      data: {
        variantId,
        inventoryId: inventory.id,
        type: "RESERVATION",
        quantity: data.quantity,
        reference: data.reference,
        note: data.note,
      },
    });

    await createAuditLogTx(tx, {
      userId,
      action: "STOCK_ADJUSTMENT",
      entity: "Inventory",
      entityId: inventory.id,
      description: `Reserved inventory stock`,
      metadata: {
        productId,
        variantId,
        type: "RESERVATION",
        quantity: data.quantity,
        previousReservedQuantity:
          inventory.reservedQuantity,
        newReservedQuantity:
          updatedInventory.reservedQuantity,
        reference: data.reference ?? null,
        note: data.note ?? null,
        transactionId: transaction.id,
      },
    });

    return {
      inventory: {
        ...updatedInventory,
        availableQuantity: calculateAvailableQuantity(
          updatedInventory.quantity,
          updatedInventory.reservedQuantity
        ),
      },
      transaction,
    };
  });
};

export const releaseInventory = async (
  productId: string,
  variantId: string,
  data: {
    quantity: number;
    reference?: string;
    note?: string;
  },
  userId: string
) => {
  await ensureVariant(productId, variantId);

  return runInventoryTransaction(async (tx) => {
    const inventory = await tx.inventory.findUnique({
      where: {
        variantId,
      },
    });

    if (!inventory) {
      throw new AppError(
        "Inventory not found for this variant",
        404
      );
    }

    if (data.quantity > inventory.reservedQuantity) {
      throw new AppError(
        `Cannot release more stock than reserved. Reserved quantity: ${inventory.reservedQuantity}`,
        400
      );
    }

    const updatedInventory = await tx.inventory.update({
      where: {
        id: inventory.id,
      },
      data: {
        reservedQuantity: {
          decrement: data.quantity,
        },
      },
    });

    const transaction = await tx.inventoryTransaction.create({
      data: {
        variantId,
        inventoryId: inventory.id,
        type: "RELEASE",
        quantity: data.quantity,
        reference: data.reference,
        note: data.note,
      },
    });

    await createAuditLogTx(tx, {
      userId,
      action: "STOCK_ADJUSTMENT",
      entity: "Inventory",
      entityId: inventory.id,
      description: `Released reserved inventory stock`,
      metadata: {
        productId,
        variantId,
        type: "RELEASE",
        quantity: data.quantity,
        previousReservedQuantity:
          inventory.reservedQuantity,
        newReservedQuantity:
          updatedInventory.reservedQuantity,
        reference: data.reference ?? null,
        note: data.note ?? null,
        transactionId: transaction.id,
      },
    });

    return {
      inventory: {
        ...updatedInventory,
        availableQuantity: calculateAvailableQuantity(
          updatedInventory.quantity,
          updatedInventory.reservedQuantity
        ),
      },
      transaction,
    };
  });
};

export const getInventorySummary = async () => {
  const [totals, lowStockResult] = await Promise.all([
    prisma.inventory.aggregate({
      _sum: {
        quantity: true,
        reservedQuantity: true,
      },
    }),

    prisma.$queryRaw<{ count: bigint }[]>(
      Prisma.sql`
        SELECT COUNT(*)::bigint AS count
        FROM "Inventory" i
        WHERE (
          i."quantity" - i."reservedQuantity"
        ) <= i."reorderLevel"
      `
    ),
  ]);

  const totalStock = totals._sum.quantity ?? 0;
  const totalReserved =
    totals._sum.reservedQuantity ?? 0;

  const totalAvailable =
    Number(totalStock) - Number(totalReserved);

  const lowStockProducts = Number(
    lowStockResult[0]?.count ?? 0
  );

  return {
    totalStock: Number(totalStock),
    totalReserved: Number(totalReserved),
    totalAvailable,
    lowStockProducts,
  };
};

export const getInventoryTransactions = async (
  productId: string,
  variantId: string,
  options: {
    page?: number;
    limit?: number;
    type?: InventoryTransactionType;
  }
) => {
  await ensureVariant(productId, variantId);

  const page = Math.max(options.page ?? 1, 1);
  const limit = Math.min(
    Math.max(options.limit ?? 20, 1),
    100
  );

  const skip = (page - 1) * limit;

  const where = {
    variantId,
    ...(options.type && {
      type: options.type,
    }),
  };

  const [transactions, total] = await prisma.$transaction([
    prisma.inventoryTransaction.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),

    prisma.inventoryTransaction.count({
      where,
    }),
  ]);

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getInventoryList = async (options: {
  page?: number;
  limit?: number;
  search?: string;
  lowStock?: boolean;
}) => {
  const page = Math.max(options.page ?? 1, 1);

  const limit = Math.min(
    Math.max(options.limit ?? 20, 1),
    100
  );

  const skip = (page - 1) * limit;

  const search = options.search?.trim();

  /*
   * Build search conditions using Prisma SQL.
   *
   * Low-stock condition:
   *
   * quantity - reservedQuantity <= reorderLevel
   */
  const conditions: Prisma.Sql[] = [];

  if (search) {
    const searchPattern = `%${search}%`;

    conditions.push(
      Prisma.sql`(
        pv."sku" ILIKE ${searchPattern}
        OR pv."name" ILIKE ${searchPattern}
        OR p."name" ILIKE ${searchPattern}
      )`
    );
  }

  if (options.lowStock) {
    conditions.push(
      Prisma.sql`(
        i."quantity" - i."reservedQuantity" <= i."reorderLevel"
      )`
    );
  }

  const whereClause =
    conditions.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
      : Prisma.empty;

  /*
   * Get total count from PostgreSQL.
   *
   * This is important because low-stock filtering happens
   * BEFORE pagination.
   */
  const countResult = await prisma.$queryRaw<
    { count: bigint }[]
  >(
    Prisma.sql`
      SELECT COUNT(*)::bigint AS count
      FROM "Inventory" i
      INNER JOIN "ProductVariant" pv
        ON pv."id" = i."variantId"
      INNER JOIN "Product" p
        ON p."id" = pv."productId"
      ${whereClause}
    `
  );

  const total = Number(countResult[0]?.count ?? 0);

  /*
   * Fetch only the required inventory records for this page.
   */
  const inventories = await prisma.$queryRaw<
    { id: string }[]
  >(
    Prisma.sql`
      SELECT i."id"
      FROM "Inventory" i
      INNER JOIN "ProductVariant" pv
        ON pv."id" = i."variantId"
      INNER JOIN "Product" p
        ON p."id" = pv."productId"
      ${whereClause}
      ORDER BY i."updatedAt" DESC
      LIMIT ${limit}
      OFFSET ${skip}
    `
  );

  const inventoryIds = inventories.map(
    (inventory) => inventory.id
  );

  if (inventoryIds.length === 0) {
    return {
      inventories: [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /*
   * Fetch the full Prisma relations for the IDs returned
   * by the database-level pagination query.
   */
  const inventoryRecords =
    await prisma.inventory.findMany({
      where: {
        id: {
          in: inventoryIds,
        },
      },
      include: {
        variant: {
          select: {
            id: true,
            sku: true,
            name: true,
            price: true,
            status: true,
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                brand: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

  /*
   * Restore the exact database ordering because
   * findMany({ in: [...] }) does not guarantee the
   * same order as the raw query.
   */
  const inventoryMap = new Map(
    inventoryRecords.map((inventory) => [
      inventory.id,
      inventory,
    ])
  );

  const orderedInventories = inventoryIds
    .map((id) => inventoryMap.get(id))
    .filter(
      (
        inventory
      ): inventory is (typeof inventoryRecords)[number] =>
        inventory !== undefined
    );

  const data = orderedInventories.map((inventory) => {
    const availableQuantity =
      inventory.quantity - inventory.reservedQuantity;

    return {
      ...inventory,
      availableQuantity,
      isLowStock:
        availableQuantity <= inventory.reorderLevel,
    };
  });

  return {
    inventories: data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};