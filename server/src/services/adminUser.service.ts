import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { hashPassword } from "../utils/password.js";
import { createAuditLog } from "./auditLog.service.js";

const CUSTOMER_ROLE = "CUSTOMER";
const SUPER_ADMIN_ROLE = "SUPER_ADMIN";

export interface AdminUserListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  roleId?: string;
  sortBy?: "firstName" | "lastName" | "email" | "createdAt";
  sortOrder?: "asc" | "desc";
}

const adminUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  status: true,
  roleId: true,
  createdAt: true,
  updatedAt: true,
  role: {
    select: {
      id: true,
      name: true,
      description: true,
    },
  },
} as const;

const ensureAdminUser = async (id: string) => {
  const user = await prisma.user.findFirst({
    where: {
      id,
      role: {
        name: {
          not: CUSTOMER_ROLE,
        },
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      status: true,
      roleId: true,
      role: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError("Admin user not found", 404);
  }

  return user;
};

const ensureRole = async (roleId: string) => {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
  });

  if (!role) {
    throw new AppError("Role not found", 404);
  }

  if (role.name === CUSTOMER_ROLE) {
    throw new AppError(
      "CUSTOMER role cannot be assigned to an admin user",
      400
    );
  }

  return role;
};

export const getAdminUsers = async ({
  page = 1,
  limit = 20,
  search,
  status,
  roleId,
  sortBy = "createdAt",
  sortOrder = "desc",
}: AdminUserListParams) => {
  const skip = (page - 1) * limit;

  const where = {
    role: {
      name: {
        not: CUSTOMER_ROLE,
      },
    },

    ...(status ? { status } : {}),

    ...(roleId ? { roleId } : {}),

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

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: adminUserSelect,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),

    prisma.user.count({
      where,
    }),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getAdminUserById = async (id: string) => {
  return ensureAdminUser(id);
};

export const createAdminUser = async (
  data: {
    firstName: string;
    lastName?: string;
    email: string;
    phone?: string;
    password: string;
    roleId: string;
    status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  },
  userId: string
) => {
  const email = data.email.toLowerCase().trim();

  await ensureRole(data.roleId);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError("A user with this email already exists", 409);
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email,
      phone: data.phone,
      passwordHash,
      roleId: data.roleId,
      status: data.status ?? "ACTIVE",
    },
    select: adminUserSelect,
  });

  await createAuditLog({
    userId,
    action: "CREATE",
    entity: "User",
    entityId: user.id,
    description: `Created admin user "${user.email}"`,
    metadata: {
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.name,
      status: user.status,
    },
  });

  return user;
};

export const updateAdminUser = async (
  id: string,
  data: {
    firstName?: string;
    lastName?: string | null;
    email?: string;
    phone?: string | null;
    password?: string;
  },
  userId: string
) => {
  const existingUser = await ensureAdminUser(id);

  const updateData: {
    firstName?: string;
    lastName?: string | null;
    email?: string;
    phone?: string | null;
    passwordHash?: string;
  } = {};

  if (data.firstName !== undefined) {
    updateData.firstName = data.firstName;
  }

  if (data.lastName !== undefined) {
    updateData.lastName = data.lastName;
  }

  if (data.phone !== undefined) {
    updateData.phone = data.phone;
  }

  if (data.email !== undefined) {
    const email = data.email.toLowerCase().trim();

    if (email !== existingUser.email) {
      const duplicate = await prisma.user.findUnique({
        where: { email },
      });

      if (duplicate) {
        throw new AppError(
          "A user with this email already exists",
          409
        );
      }
    }

    updateData.email = email;
  }

  if (data.password !== undefined) {
    updateData.passwordHash = await hashPassword(data.password);
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData,
    select: adminUserSelect,
  });

  if (data.password !== undefined) {
    await createAuditLog({
      userId,
      action: "PASSWORD_CHANGE",
      entity: "User",
      entityId: updatedUser.id,
      description: `Changed password for admin user "${updatedUser.email}"`,
      metadata: {
        email: updatedUser.email,
      },
    });
  }

  const nonPasswordChanges =
    Object.keys(updateData).filter(
      (key) => key !== "passwordHash"
    ).length > 0;

  if (nonPasswordChanges) {
    await createAuditLog({
      userId,
      action: "UPDATE",
      entity: "User",
      entityId: updatedUser.id,
      description: `Updated admin user "${updatedUser.email}"`,
      metadata: {
        fields: Object.keys(updateData).filter(
          (key) => key !== "passwordHash"
        ),
      },
    });
  }

  return updatedUser;
};

export const updateAdminUserStatus = async (
  id: string,
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED",
  userId: string
) => {
  const existingUser = await ensureAdminUser(id);

  if (existingUser.status === status) {
    return existingUser;
  }

  if (
    existingUser.role.name === SUPER_ADMIN_ROLE &&
    existingUser.status === "ACTIVE" &&
    status !== "ACTIVE"
  ) {
    const activeSuperAdmins = await prisma.user.count({
      where: {
        status: "ACTIVE",
        role: {
          name: SUPER_ADMIN_ROLE,
        },
      },
    });

    if (activeSuperAdmins <= 1) {
      throw new AppError(
        "Cannot deactivate the last active SUPER_ADMIN",
        400
      );
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { status },
    select: adminUserSelect,
  });

  await createAuditLog({
    userId,
    action: "STATUS_CHANGE",
    entity: "User",
    entityId: updatedUser.id,
    description: `Changed admin user status from "${existingUser.status}" to "${status}"`,
    metadata: {
      oldStatus: existingUser.status,
      newStatus: status,
      email: updatedUser.email,
    },
  });

  return updatedUser;
};

export const updateAdminUserRole = async (
  id: string,
  roleId: string,
  userId: string
) => {
  const existingUser = await ensureAdminUser(id);
  const newRole = await ensureRole(roleId);

  if (existingUser.roleId === roleId) {
    return existingUser;
  }

  if (
    existingUser.role.name === SUPER_ADMIN_ROLE &&
    newRole.name !== SUPER_ADMIN_ROLE
  ) {
    const superAdminCount = await prisma.user.count({
      where: {
        role: {
          name: SUPER_ADMIN_ROLE,
        },
        status: "ACTIVE",
      },
    });

    if (
      existingUser.status === "ACTIVE" &&
      superAdminCount <= 1
    ) {
      throw new AppError(
        "Cannot change the role of the last active SUPER_ADMIN",
        400
      );
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      roleId,
    },
    select: adminUserSelect,
  });

  await createAuditLog({
    userId,
    action: "UPDATE",
    entity: "User",
    entityId: updatedUser.id,
    description: `Changed role for "${updatedUser.email}" from "${existingUser.role.name}" to "${newRole.name}"`,
    metadata: {
      oldRoleId: existingUser.roleId,
      oldRoleName: existingUser.role.name,
      newRoleId: newRole.id,
      newRoleName: newRole.name,
    },
  });

  return updatedUser;
};

export const deleteAdminUser = async (
  id: string,
  userId: string
) => {
  const existingUser = await ensureAdminUser(id);

  if (existingUser.id === userId) {
    throw new AppError("You cannot delete your own account", 400);
  }

  if (existingUser.role.name === SUPER_ADMIN_ROLE) {
    const superAdminCount = await prisma.user.count({
      where: {
        role: {
          name: SUPER_ADMIN_ROLE,
        },
      },
    });

    if (superAdminCount <= 1) {
      throw new AppError(
        "Cannot delete the last SUPER_ADMIN",
        400
      );
    }
  }

  await prisma.user.delete({
    where: { id },
  });

  await createAuditLog({
    userId,
    action: "DELETE",
    entity: "User",
    entityId: existingUser.id,
    description: `Deleted admin user "${existingUser.email}"`,
    metadata: {
      email: existingUser.email,
      roleId: existingUser.roleId,
      roleName: existingUser.role.name,
    },
  });

  return true;
};