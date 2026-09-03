import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { hashPassword } from "../src/utils/password.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const main = async () => {
  console.log("Seeding database...");

  const permissions = [
    "dashboard.view",

    "users.read",
    "users.create",
    "users.update",
    "users.delete",

    "products.read",
    "products.create",
    "products.update",
    "products.delete",

    "categories.read",
    "categories.create",
    "categories.update",
    "categories.delete",

    "brands.read",
    "brands.create",
    "brands.update",
    "brands.delete",

    "inventory.read",
    "inventory.update",

    "orders.read",
    "orders.update",

    "discounts.read",
    "discounts.create",
    "discounts.update",
    "discounts.delete",

    "settings.read",
    "settings.update",

    "audit_logs.read",
  ];

  for (const permissionName of permissions) {
    await prisma.permission.upsert({
      where: {
        name: permissionName,
      },
      update: {},
      create: {
        name: permissionName,
        description: permissionName,
      },
    });
  }

  const superAdminRole =
    await prisma.role.upsert({
      where: {
        name: "SUPER_ADMIN",
      },
      update: {},
      create: {
        name: "SUPER_ADMIN",
        description:
          "Full access to the administration system",
      },
    });

  const allPermissions =
    await prisma.permission.findMany();

  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: permission.id,
      },
    });
  }

  const passwordHash = await hashPassword(
    "Admin@12345"
  );

  const admin =
    await prisma.user.upsert({
      where: {
        email: "admin@electronicstore.com",
      },
      update: {
        roleId: superAdminRole.id,
        status: "ACTIVE",
      },
      create: {
        firstName: "Super",
        lastName: "Admin",
        email: "admin@electronicstore.com",
        passwordHash,
        roleId: superAdminRole.id,
        status: "ACTIVE",
      },
    });

  console.log(
    `Admin created: ${admin.email}`
  );
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });