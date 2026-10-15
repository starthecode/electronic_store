import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { createAuditLog, createAuditLogTx } from "./auditLog.service.js";

interface CustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  sortBy?: "firstName" | "lastName" | "email" | "createdAt";
  sortOrder?: "asc" | "desc";
}

const CUSTOMER_ROLE = "CUSTOMER";

export const getCustomers = async ({
  page = 1,
  limit = 20,
  search,
  status,
  sortBy = "createdAt",
  sortOrder = "desc",
}: CustomerListParams) => {
  const skip = (page - 1) * limit;

  const where = {
    role: {
      name: CUSTOMER_ROLE,
    },

    ...(status ? { status } : {}),

    ...(search
      ? {
        OR: [
          {
            firstName: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            lastName: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            email: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            phone: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        ],
      }
      : {}),
  };

  const [customers, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,

        role: {
          select: {
            id: true,
            name: true,
          },
        },

        _count: {
          select: {
            orders: true,
            addresses: true,
          },
        },
      },
    }),

    prisma.user.count({
      where,
    }),
  ]);

  return {
    customers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getCustomerById = async (id: string) => {
  const customer = await prisma.user.findFirst({
    where: {
      id,
      role: {
        name: CUSTOMER_ROLE,
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      status: true,
      createdAt: true,
      updatedAt: true,

      role: {
        select: {
          id: true,
          name: true,
        },
      },

      _count: {
        select: {
          orders: true,
          addresses: true,
          discountUses: true,
        },
      },
    },
  });

  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  return customer;
};

export const updateCustomerStatus = async (
  id: string,
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED",
  userId: string
) => {
  const customer = await prisma.user.findFirst({
    where: {
      id,
      role: {
        name: CUSTOMER_ROLE,
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  const oldStatus = customer.status;
  const newStatus = status;

  if (oldStatus === newStatus) {
    return customer;
  }

  const updatedCustomer = await prisma.$transaction(
    async (tx) => {
      const updated = await tx.user.update({
        where: {
          id,
        },
        data: {
          status: newStatus,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await createAuditLogTx(tx, {
        userId,
        action: "STATUS_CHANGE",
        entity: "User",
        entityId: customer.id,
        description: `Changed customer status from "${oldStatus}" to "${newStatus}"`,
        metadata: {
          oldStatus,
          newStatus,
        },
      });

      return updated;
    }
  );
};


export const getCustomerOrders = async (
  customerId: string,
  page = 1,
  limit = 20
) => {
  const customer = await prisma.user.findFirst({
    where: {
      id: customerId,
      role: {
        name: CUSTOMER_ROLE,
      },
    },
    select: {
      id: true,
    },
  });

  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  const skip = (page - 1) * limit;

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where: {
        userId: customerId,
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        items: true,
        payment: true,
        statusHistory: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    }),

    prisma.order.count({
      where: {
        userId: customerId,
      },
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

export const getCustomerAddresses = async (customerId: string) => {
  const customer = await prisma.user.findFirst({
    where: {
      id: customerId,
      role: {
        name: CUSTOMER_ROLE,
      },
    },
    select: {
      id: true,
    },
  });

  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  return prisma.address.findMany({
    where: {
      userId: customerId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};