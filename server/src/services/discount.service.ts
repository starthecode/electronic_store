import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { createAuditLog } from "./auditLog.service.js";

interface CreateDiscountInput {
  name: string;
  code: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  scope: "ORDER" | "PRODUCT" | "CATEGORY";
  status?: "ACTIVE" | "INACTIVE" | "EXPIRED";
  value: number;
  minimumAmount?: number | null;
  maximumDiscount?: number | null;
  usageLimit?: number | null;
  startsAt: Date;
  expiresAt?: Date | null;
}

interface UpdateDiscountInput {
  name?: string;
  code?: string;
  type?: "PERCENTAGE" | "FIXED_AMOUNT";
  scope?: "ORDER" | "PRODUCT" | "CATEGORY";
  status?: "ACTIVE" | "INACTIVE" | "EXPIRED";
  value?: number;
  minimumAmount?: number | null;
  maximumDiscount?: number | null;
  usageLimit?: number | null;
  startsAt?: Date;
  expiresAt?: Date | null;
}

const validateDiscount = (
  input: {
    type?: "PERCENTAGE" | "FIXED_AMOUNT";
    value?: number;
    minimumAmount?: number | null;
    maximumDiscount?: number | null;
    usageLimit?: number | null;
    startsAt?: Date;
    expiresAt?: Date | null;
  },
  existing?: {
    type: "PERCENTAGE" | "FIXED_AMOUNT";
    value: unknown;
    minimumAmount: unknown;
    maximumDiscount: unknown;
    usageLimit: number | null;
    startsAt: Date;
    expiresAt: Date | null;
    usageCount: number;
  }
) => {
  const type =
    input.type ?? existing?.type;

  const value =
    input.value ??
    (existing
      ? Number(existing.value)
      : undefined);

  if (
    type === "PERCENTAGE" &&
    value !== undefined &&
    (value <= 0 || value > 100)
  ) {
    throw new AppError(
      "Percentage discount must be greater than 0 and at most 100",
      400
    );
  }

  if (
    type === "FIXED_AMOUNT" &&
    value !== undefined &&
    value <= 0
  ) {
    throw new AppError(
      "Fixed discount amount must be greater than 0",
      400
    );
  }

  const minimumAmount =
    input.minimumAmount !== undefined
      ? input.minimumAmount
      : existing
        ? Number(existing.minimumAmount)
        : null;

  const maximumDiscount =
    input.maximumDiscount !== undefined
      ? input.maximumDiscount
      : existing
        ? Number(existing.maximumDiscount)
        : null;

  if (
    minimumAmount !== null &&
    minimumAmount < 0
  ) {
    throw new AppError(
      "Minimum amount cannot be negative",
      400
    );
  }

  if (
    maximumDiscount !== null &&
    maximumDiscount <= 0
  ) {
    throw new AppError(
      "Maximum discount must be greater than 0",
      400
    );
  }

  const startsAt =
    input.startsAt ??
    existing?.startsAt;

  const expiresAt =
    input.expiresAt !== undefined
      ? input.expiresAt
      : existing?.expiresAt;

  if (
    startsAt &&
    expiresAt &&
    expiresAt <= startsAt
  ) {
    throw new AppError(
      "Expiry date must be after start date",
      400
    );
  }

  if (
    input.usageLimit !== undefined &&
    input.usageLimit !== null &&
    existing &&
    input.usageLimit < existing.usageCount
  ) {
    throw new AppError(
      "Usage limit cannot be lower than current usage count",
      400
    );
  }
};

export const createDiscount = async (
  input: CreateDiscountInput,
  userId: string
) => {
  const code = input.code.toUpperCase();

  const existing =
    await prisma.discount.findUnique({
      where: {
        code,
      },
    });

  if (existing) {
    throw new AppError(
      "Discount code already exists",
      409
    );
  }

  validateDiscount(input);

  const discount = await prisma.discount.create({
    data: {
      name: input.name,
      code,
      type: input.type,
      scope: input.scope,
      status: input.status ?? "ACTIVE",
      value: input.value,
      minimumAmount:
        input.minimumAmount ?? null,
      maximumDiscount:
        input.maximumDiscount ?? null,
      usageLimit:
        input.usageLimit ?? null,
      startsAt: input.startsAt,
      expiresAt:
        input.expiresAt ?? null,
    },

    include: {
      _count: {
        select: {
          products: true,
          categories: true,
          usages: true,
        },
      },
    },
  });

  await createAuditLog({
    userId,
    action: "CREATE",
    entity: "Discount",
    entityId: discount.id,
    description: `Created discount "${discount.name}"`,
    metadata: {
      code: discount.code,
      type: discount.type,
      scope: discount.scope,
      value: discount.value.toString(),
    },
  });

  return discount;
};

export const getDiscounts = async ({
  page,
  limit,
  search,
  type,
  scope,
  status,
}: {
  page: number;
  limit: number;
  search?: string;
  type?: "PERCENTAGE" | "FIXED_AMOUNT";
  scope?: "ORDER" | "PRODUCT" | "CATEGORY";
  status?: "ACTIVE" | "INACTIVE" | "EXPIRED";
}) => {
  const skip = (page - 1) * limit;

  const where = {
    ...(search
      ? {
        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            code: {
              contains: search.toUpperCase(),
              mode: "insensitive" as const,
            },
          },
        ],
      }
      : {}),

    ...(type ? { type } : {}),

    ...(scope ? { scope } : {}),

    ...(status ? { status } : {}),
  };

  const [discounts, total] =
    await prisma.$transaction([
      prisma.discount.findMany({
        where,

        orderBy: {
          createdAt: "desc",
        },

        skip,
        take: limit,

        include: {
          _count: {
            select: {
              products: true,
              categories: true,
              usages: true,
            },
          },
        },
      }),

      prisma.discount.count({
        where,
      }),
    ]);

  return {
    discounts,

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

export const getDiscountById = async (
  id: string
) => {
  const discount =
    await prisma.discount.findUnique({
      where: {
        id,
      },

      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },

        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },

        _count: {
          select: {
            products: true,
            categories: true,
            usages: true,
          },
        },
      },
    });

  if (!discount) {
    throw new AppError(
      "Discount not found",
      404
    );
  }

  return discount;
};

export const updateDiscount = async (
  id: string,
  input: UpdateDiscountInput,
  userId: string
) => {
  const existing =
    await prisma.discount.findUnique({
      where: {
        id,
      },
    });

  if (!existing) {
    throw new AppError(
      "Discount not found",
      404
    );
  }

  if (input.code) {
    const duplicate =
      await prisma.discount.findFirst({
        where: {
          code: input.code.toUpperCase(),

          id: {
            not: id,
          },
        },
      });

    if (duplicate) {
      throw new AppError(
        "Discount code already exists",
        409
      );
    }
  }

  validateDiscount(
    input,
    existing
  );

  const discount = await prisma.discount.update({
    where: {
      id,
    },

    data: {
      ...(input.name !== undefined && {
        name: input.name,
      }),

      ...(input.code !== undefined && {
        code: input.code.toUpperCase(),
      }),

      ...(input.type !== undefined && {
        type: input.type,
      }),

      ...(input.scope !== undefined && {
        scope: input.scope,
      }),

      ...(input.status !== undefined && {
        status: input.status,
      }),

      ...(input.value !== undefined && {
        value: input.value,
      }),

      ...(input.minimumAmount !==
        undefined && {
        minimumAmount:
          input.minimumAmount,
      }),

      ...(input.maximumDiscount !==
        undefined && {
        maximumDiscount:
          input.maximumDiscount,
      }),

      ...(input.usageLimit !== undefined && {
        usageLimit:
          input.usageLimit,
      }),

      ...(input.startsAt !== undefined && {
        startsAt:
          input.startsAt,
      }),

      ...(input.expiresAt !== undefined && {
        expiresAt:
          input.expiresAt,
      }),
    },
  });

  await createAuditLog({
    userId,
    action: "UPDATE",
    entity: "Discount",
    entityId: discount.id,
    description: `Updated discount "${discount.name}"`,
    metadata: {
      fields: Object.keys(input),
    },
  });
  return discount;
};

export const deleteDiscount = async (
  id: string, userId: string
) => {
  const discount =
    await prisma.discount.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        usageCount: true,
        name: true,
      },
    });

  if (!discount) {
    throw new AppError(
      "Discount not found",
      404
    );
  }

  if (discount.usageCount > 0) {
    throw new AppError(
      "Discount cannot be deleted because it has usage history",
      409
    );
  }

  await prisma.discount.delete({
    where: {
      id,
    },
  });
  await createAuditLog({
    userId,
    action: "DELETE",
    entity: "Discount",
    entityId: id,
    description: `Deleted discount "${discount.name}"`,
  });
};

export const getDiscountUsage = async (
  discountId: string,
  page: number,
  limit: number
) => {
  const discount =
    await prisma.discount.findUnique({
      where: {
        id: discountId,
      },
      select: {
        id: true,
      },
    });

  if (!discount) {
    throw new AppError(
      "Discount not found",
      404
    );
  }

  const skip = (page - 1) * limit;

  const [usages, total] =
    await prisma.$transaction([
      prisma.discountUsage.findMany({
        where: {
          discountId,
        },

        orderBy: {
          usedAt: "desc",
        },

        skip,
        take: limit,

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
      }),

      prisma.discountUsage.count({
        where: {
          discountId,
        },
      }),
    ]);

  return {
    usages,

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