import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { createAuditLog } from "./auditLog.service.js";

const SUPER_ADMIN_ROLE = "SUPER_ADMIN";
const CUSTOMER_ROLE = "CUSTOMER";

const roleSelect = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
} as const;

const ensureManagedRole = async (id: string) => {
  const role = await prisma.role.findUnique({
    where: { id },
    select: {
      ...roleSelect,
      _count: {
        select: {
          users: true,
          permissions: true,
        },
      },
    },
  });

  if (!role) {
    throw new AppError("Role not found", 404);
  }

  if (
    role.name === SUPER_ADMIN_ROLE ||
    role.name === CUSTOMER_ROLE
  ) {
    throw new AppError(
      "This system role cannot be managed through this endpoint",
      400
    );
  }

  return role;
};

export const getRoles = async () => {
  return prisma.role.findMany({
    where: {
      name: {
        notIn: [SUPER_ADMIN_ROLE, CUSTOMER_ROLE],
      },
    },
    select: {
      ...roleSelect,
      _count: {
        select: {
          users: true,
          permissions: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
};

export const getRoleById = async (id: string) => {
  const role = await ensureManagedRole(id);

  const permissions = await prisma.rolePermission.findMany({
    where: {
      roleId: id,
    },
    select: {
      permission: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
    orderBy: {
      permission: {
        name: "asc",
      },
    },
  });

  return {
    ...role,
    permissions: permissions.map(
      (item) => item.permission
    ),
  };
};

export const createRole = async (
  data: {
    name: string;
    description?: string;
  },
  userId: string
) => {
  const name = data.name.trim().toUpperCase();

  if (
    name === SUPER_ADMIN_ROLE ||
    name === CUSTOMER_ROLE
  ) {
    throw new AppError(
      `"${name}" is a protected system role`,
      400
    );
  }

  const existingRole = await prisma.role.findUnique({
    where: { name },
  });

  if (existingRole) {
    throw new AppError(
      "A role with this name already exists",
      409
    );
  }

  const role = await prisma.role.create({
    data: {
      name,
      description: data.description,
    },
    select: roleSelect,
  });

  await createAuditLog({
    userId,
    action: "CREATE",
    entity: "Role",
    entityId: role.id,
    description: `Created role "${role.name}"`,
    metadata: {
      name: role.name,
      description: role.description,
    },
  });

  return role;
};

export const updateRole = async (
  id: string,
  data: {
    name?: string;
    description?: string | null;
  },
  userId: string
) => {
  const existingRole = await ensureManagedRole(id);

  const updateData: {
    name?: string;
    description?: string | null;
  } = {};

  if (data.name !== undefined) {
    const name = data.name.trim().toUpperCase();

    if (
      name === SUPER_ADMIN_ROLE ||
      name === CUSTOMER_ROLE
    ) {
      throw new AppError(
        `"${name}" is a protected system role`,
        400
      );
    }

    if (name !== existingRole.name) {
      const duplicateRole = await prisma.role.findUnique({
        where: { name },
      });

      if (duplicateRole) {
        throw new AppError(
          "A role with this name already exists",
          409
        );
      }
    }

    updateData.name = name;
  }

  if (data.description !== undefined) {
    updateData.description = data.description;
  }

  const role = await prisma.role.update({
    where: { id },
    data: updateData,
    select: roleSelect,
  });

  await createAuditLog({
    userId,
    action: "UPDATE",
    entity: "Role",
    entityId: role.id,
    description: `Updated role "${role.name}"`,
    metadata: {
      oldName: existingRole.name,
      newName: role.name,
      oldDescription: existingRole.description,
      newDescription: role.description,
    },
  });

  return role;
};

export const deleteRole = async (
  id: string,
  userId: string
) => {
  const role = await ensureManagedRole(id);

  if (role._count.users > 0) {
    throw new AppError(
      "Cannot delete a role that is assigned to users",
      400
    );
  }

  await prisma.role.delete({
    where: { id },
  });

  await createAuditLog({
    userId,
    action: "DELETE",
    entity: "Role",
    entityId: role.id,
    description: `Deleted role "${role.name}"`,
    metadata: {
      name: role.name,
      description: role.description,
    },
  });

  return true;
};