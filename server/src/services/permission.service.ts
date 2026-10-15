import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { createAuditLog } from "./auditLog.service.js";

const SUPER_ADMIN_ROLE = "SUPER_ADMIN";
const CUSTOMER_ROLE = "CUSTOMER";

const ensureManagedRole = async (id: string) => {
  const role = await prisma.role.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
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
      "Permissions cannot be modified for this system role",
      400
    );
  }

  return role;
};

export const getPermissions = async () => {
  return prisma.permission.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
    },
    orderBy: {
      name: "asc",
    },
  });
};

export const getRolePermissions = async (
  roleId: string
) => {
  await ensureManagedRole(roleId);

  const permissions = await prisma.rolePermission.findMany({
    where: {
      roleId,
    },
    select: {
      id: true,
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

  return permissions.map((item) => ({
    assignmentId: item.id,
    ...item.permission,
  }));
};

export const assignRolePermissions = async (
  roleId: string,
  permissionIds: string[],
  userId: string
) => {
  const role = await ensureManagedRole(roleId);

  const uniquePermissionIds = [
    ...new Set(permissionIds),
  ];

  const permissions = await prisma.permission.findMany({
    where: {
      id: {
        in: uniquePermissionIds,
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (
    permissions.length !== uniquePermissionIds.length
  ) {
    throw new AppError(
      "One or more permissions were not found",
      404
    );
  }

  const existingAssignments =
    await prisma.rolePermission.findMany({
      where: {
        roleId,
        permissionId: {
          in: uniquePermissionIds,
        },
      },
      select: {
        permissionId: true,
      },
    });

  const existingIds = new Set(
    existingAssignments.map(
      (item) => item.permissionId
    )
  );

  const newPermissionIds =
    uniquePermissionIds.filter(
      (id) => !existingIds.has(id)
    );

  if (newPermissionIds.length === 0) {
    throw new AppError(
      "All selected permissions are already assigned to this role",
      409
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.rolePermission.createMany({
      data: newPermissionIds.map((permissionId) => ({
        roleId,
        permissionId,
      })),
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: "UPDATE",
        entity: "Role",
        entityId: role.id,
        description: `Assigned permissions to role "${role.name}"`,
        metadata: {
          permissionIds: newPermissionIds,
          permissions: permissions
            .filter((permission) =>
              newPermissionIds.includes(permission.id)
            )
            .map((permission) => permission.name),
        },
      },
    });
  });

  return getRolePermissions(roleId);
};

export const removeRolePermission = async (
  roleId: string,
  permissionId: string,
  userId: string
) => {
  const role = await ensureManagedRole(roleId);

  const permission =
    await prisma.permission.findUnique({
      where: {
        id: permissionId,
      },
      select: {
        id: true,
        name: true,
      },
    });

  if (!permission) {
    throw new AppError("Permission not found", 404);
  }

  const assignment =
    await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

  if (!assignment) {
    throw new AppError(
      "Permission is not assigned to this role",
      404
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: "UPDATE",
        entity: "Role",
        entityId: role.id,
        description: `Removed permission "${permission.name}" from role "${role.name}"`,
        metadata: {
          permissionId: permission.id,
          permissionName: permission.name,
        },
      },
    });
  });

  return true;
};