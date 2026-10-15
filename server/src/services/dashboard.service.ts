import { prisma } from "../config/database.js";

export const getDashboardOverview = async () => {
  const [
    totalProducts,
    totalCustomers,
    totalOrders,
    pendingOrders,
    affiliateClicks,
    salesResult,
    inventoryRows,
  ] = await Promise.all([
    prisma.product.count(),

    prisma.user.count({
      where: {
        role: {
          name: "CUSTOMER",
        },
      },
    }),

    prisma.order.count(),

    prisma.order.count({
      where: {
        status: "PENDING",
      },
    }),

    prisma.affiliateClick.count(),

    prisma.order.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        status: {
          not: "CANCELLED",
        },
      },
    }),

    prisma.inventory.findMany({
      select: {
        quantity: true,
        reorderLevel: true,
      },
    }),
  ]);

  const lowStockProducts = inventoryRows.filter(
    (inventory) =>
      inventory.quantity <= inventory.reorderLevel
  ).length;

  return {
    totalSales: Number(
      salesResult._sum.totalAmount ?? 0
    ),
    totalOrders,
    totalCustomers,
    totalProducts,
    pendingOrders,
    lowStockProducts,
    affiliateClicks,
  };
};

export const getDashboardSales = async ({
  from,
  to,
}: {
  from?: string;
  to?: string;
}) => {
  const start = from
    ? new Date(`${from}T00:00:00.000Z`)
    : undefined;

  const end = to
    ? new Date(`${to}T23:59:59.999Z`)
    : undefined;

  const orders = await prisma.order.findMany({
    where: {
      status: {
        not: "CANCELLED",
      },
      ...(start || end
        ? {
            createdAt: {
              ...(start ? { gte: start } : {}),
              ...(end ? { lte: end } : {}),
            },
          }
        : {}),
    },
    select: {
      createdAt: true,
      totalAmount: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const dailyMap = new Map<
    string,
    {
      sales: number;
      orders: number;
    }
  >();

  for (const order of orders) {
    const date = order.createdAt
      .toISOString()
      .slice(0, 10);

    if (!dailyMap.has(date)) {
      dailyMap.set(date, {
        sales: 0,
        orders: 0,
      });
    }

    const day = dailyMap.get(date)!;

    day.sales += Number(order.totalAmount);
    day.orders += 1;
  }

  const sales = Array.from(dailyMap.entries()).map(
    ([date, data]) => ({
      date,
      sales: data.sales,
      orders: data.orders,
    })
  );

  return {
    sales,
    period: {
      from: from ?? null,
      to: to ?? null,
    },
  };
};

export const getDashboardInventory = async () => {
  const inventory = await prisma.inventory.findMany({
    select: {
      quantity: true,
      reservedQuantity: true,
      reorderLevel: true,
    },
  });

  let totalUnits = 0;
  let totalReservedUnits = 0;
  let inStockVariants = 0;
  let outOfStockVariants = 0;
  let lowStockVariants = 0;

  for (const item of inventory) {
    totalUnits += item.quantity;
    totalReservedUnits += item.reservedQuantity;

    if (item.quantity <= 0) {
      outOfStockVariants++;
    } else {
      inStockVariants++;
    }

    if (
      item.quantity > 0 &&
      item.quantity <= item.reorderLevel
    ) {
      lowStockVariants++;
    }
  }

  return {
    totalVariants: inventory.length,
    inStockVariants,
    outOfStockVariants,
    lowStockVariants,
    totalUnits,
    totalReservedUnits,
  };
};

export const getDashboardTopProducts = async ({
  from,
  to,
  limit = 10,
}: {
  from?: string;
  to?: string;
  limit?: number;
}) => {
  const start = from
    ? new Date(`${from}T00:00:00.000Z`)
    : undefined;

  const end = to
    ? new Date(`${to}T23:59:59.999Z`)
    : undefined;

  const items = await prisma.orderItem.findMany({
    where: {
      order: {
        status: {
          not: "CANCELLED",
        },
        ...(start || end
          ? {
              createdAt: {
                ...(start ? { gte: start } : {}),
                ...(end ? { lte: end } : {}),
              },
            }
          : {}),
      },
    },
    select: {
      productName: true,
      sku: true,
      quantity: true,
      totalPrice: true,
      orderId: true,
    },
  });

  const productMap = new Map<
    string,
    {
      productName: string;
      sku: string;
      quantitySold: number;
      revenue: number;
      orderIds: Set<string>;
    }
  >();

  for (const item of items) {
    const key = `${item.productName}::${item.sku}`;

    if (!productMap.has(key)) {
      productMap.set(key, {
        productName: item.productName,
        sku: item.sku,
        quantitySold: 0,
        revenue: 0,
        orderIds: new Set(),
      });
    }

    const product = productMap.get(key)!;

    product.quantitySold += item.quantity;
    product.revenue += Number(item.totalPrice);
    product.orderIds.add(item.orderId);
  }

  const products = Array.from(productMap.values())
    .map((product) => ({
      productName: product.productName,
      sku: product.sku,
      quantitySold: product.quantitySold,
      revenue: product.revenue,
      orderCount: product.orderIds.size,
    }))
    .sort((a, b) => {
      if (b.quantitySold !== a.quantitySold) {
        return b.quantitySold - a.quantitySold;
      }

      return b.revenue - a.revenue;
    })
    .slice(0, limit);

  return {
    products,
    period: {
      from: from ?? null,
      to: to ?? null,
    },
  };
};