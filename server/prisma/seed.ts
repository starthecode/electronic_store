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

  // --------------------------------------------------
  // Permissions
  // --------------------------------------------------

  const permissions = [
    "dashboard.view",

    "users.read",
    "users.create",
    "users.update",
    "users.delete",

    "customers.read",
    "customers.update",

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

    "payments.read",
    "payments.update",

    "settings.read",
    "settings.update",

    "audit_logs.read",
    "affiliate_reports.read",
    "homepage_templates.manage",
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

  // --------------------------------------------------
  // Roles
  // --------------------------------------------------

  const superAdminRole = await prisma.role.upsert({
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

  await prisma.role.upsert({
    where: {
      name: "CUSTOMER",
    },
    update: {},
    create: {
      name: "CUSTOMER",
      description: "Customer account",
    },
  });

  // --------------------------------------------------
  // Assign all permissions to SUPER_ADMIN
  // --------------------------------------------------

  const allPermissions = await prisma.permission.findMany();

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

  // --------------------------------------------------
  // Admin User
  // --------------------------------------------------

  const passwordHash = await hashPassword(
    "Admin@12345"
  );

  const admin = await prisma.user.upsert({
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

  console.log(`Admin created: ${admin.email}`);

  // --------------------------------------------------
  // Affiliate Marketplaces
  // --------------------------------------------------

  const affiliateMarketplaces = [
    {
      name: "Amazon",
      code: "AMAZON",
      baseUrl: "https://www.amazon.in",
    },
    {
      name: "Flipkart",
      code: "FLIPKART",
      baseUrl: "https://www.flipkart.com",
    },
  ];

  for (const marketplace of affiliateMarketplaces) {
    await prisma.affiliateMarketplace.upsert({
      where: {
        code: marketplace.code,
      },
      update: {
        name: marketplace.name,
        baseUrl: marketplace.baseUrl,
        status: "ACTIVE",
      },
      create: {
        name: marketplace.name,
        code: marketplace.code,
        baseUrl: marketplace.baseUrl,
        status: "ACTIVE",
      },
    });
  }

  // --------------------------------------------------
  // Default Settings
  // --------------------------------------------------

  const defaultSettings = [
    {
      key: "store.name",
      value: "Electronic Store",
      category: "STORE",
      description: "Public store name",
    },
    {
      key: "store.email",
      value: "admin@electronicstore.com",
      category: "STORE",
      description: "Primary store email address",
    },
    {
      key: "currency.code",
      value: "INR",
      category: "CURRENCY",
      description: "Default store currency",
    },
    {
      key: "currency.symbol",
      value: "₹",
      category: "CURRENCY",
      description: "Default currency symbol",
    },
    {
      key: "tax.enabled",
      value: true,
      category: "TAX",
      description: "Whether tax calculation is enabled",
    },
    {
      key: "shipping.enabled",
      value: true,
      category: "SHIPPING",
      description: "Whether shipping is enabled",
    },
    {
      key: "orders.autoConfirm",
      value: false,
      category: "ORDERS",
      description:
        "Automatically confirm newly created orders",
    },
    {
      key: "inventory.lowStockThreshold",
      value: 5,
      category: "INVENTORY",
      description: "Default low-stock threshold",
    },
    {
      key: "payments.cod.enabled",
      value: true,
      category: "PAYMENTS",
      description: "Enable cash on delivery",
    },
    {
      key: "payments.online.enabled",
      value: true,
      category: "PAYMENTS",
      description: "Enable online payments",
    },
    {
      key: "affiliate.enabled",
      value: true,
      category: "AFFILIATE",
      description:
        "Enable affiliate products on the storefront",
    },
    {
      key: "notifications.email.enabled",
      value: true,
      category: "NOTIFICATIONS",
      description:
        "Enable email notifications",
    },
  ];

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: {
        key: setting.key,
      },
      update: {
        category: setting.category as any,
        description: setting.description,
      },
      create: {
        key: setting.key,
        value: setting.value,
        category: setting.category as any,
        description: setting.description,
      },
    });
  }

  console.log("Seed completed successfully.");
};

// --------------------------------------------------
// Run Seed
// --------------------------------------------------

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });