import assert from "node:assert/strict";
import test from "node:test";
import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

process.env.DATABASE_URL ??= "postgresql://127.0.0.1:5432/test";

const { prisma } = await import("../config/database.js");
const { requireAuth } = await import("../middleware/auth.middleware.js");
const { requirePermission } = await import("../middleware/permission.middleware.js");
const { createInventory } = await import("./inventory.service.js");
const { createInventorySchema } = await import("../validators/inventory.validator.js");

type InventoryRecord = {
  id: string;
  variantId: string;
  quantity: number;
  reservedQuantity: number;
  reorderLevel: number;
};

type TransactionClientStub = {
  inventory: {
    findUnique: (args: unknown) => Promise<InventoryRecord | null>;
    create: (args: unknown) => Promise<InventoryRecord>;
  };
  auditLog: {
    create: (args: unknown) => Promise<unknown>;
  };
};

type DatabaseStub = {
  productVariant: {
    findFirst: (args: unknown) => Promise<unknown>;
  };
  inventory: {
    findUnique: (args: unknown) => Promise<unknown>;
    create: (args: unknown) => Promise<unknown>;
  };
  auditLog: {
    create: (args: unknown) => Promise<unknown>;
  };
  rolePermission: {
    findFirst: (args: unknown) => Promise<unknown>;
  };
  $transaction: (
    callback: (tx: TransactionClientStub) => Promise<unknown>,
    options?: unknown,
  ) => Promise<unknown>;
};

const database = prisma as unknown as DatabaseStub;

const makeTx = ({
  existingInventory = null,
  onCreate = () => {},
  onAudit = () => {},
}: {
  existingInventory?: InventoryRecord | null;
  onCreate?: (args: unknown) => void;
  onAudit?: (args: unknown) => void;
} = {}): TransactionClientStub => ({
  inventory: {
    findUnique: async () => existingInventory,
    create: async (args) => {
      onCreate(args);
      return {
        id: "inventory-id",
        variantId: "variant-id",
        quantity: 12,
        reservedQuantity: 0,
        reorderLevel: 3,
      };
    },
  },
  auditLog: {
    create: async (args) => {
      onAudit(args);
      return {};
    },
  },
});

test("creates inventory with the explicitly provided quantity and audit log atomically", async () => {
  const originals = {
    findFirst: database.productVariant.findFirst,
    transaction: database.$transaction,
  };
  const observed: { create?: unknown; audit?: unknown; isolation?: unknown } = {};

  database.productVariant.findFirst = async () => ({
    id: "variant-id",
    productId: "product-id",
    sku: "ryucomm-sim-router-01",
    name: "Router variant",
    price: 12000,
    status: "ACTIVE",
  });
  database.$transaction = async (callback, options) => {
    observed.isolation = options;
    return callback(makeTx({
      onCreate: (args) => { observed.create = args; },
      onAudit: (args) => { observed.audit = args; },
    }));
  };

  try {
    const inventory = await createInventory(
      "product-id",
      "variant-id",
      { quantity: 12, reorderLevel: 3 },
      "admin-id",
    );

    assert.equal(inventory.availableQuantity, 12);
    assert.deepEqual(observed.create, {
      data: {
        variantId: "variant-id",
        quantity: 12,
        reservedQuantity: 0,
        reorderLevel: 3,
      },
    });
    assert.deepEqual(observed.audit, {
      data: {
        userId: "admin-id",
        action: "CREATE",
        entity: "Inventory",
        entityId: "inventory-id",
        description: "Created inventory for variant",
        metadata: {
          productId: "product-id",
          variantId: "variant-id",
          quantity: 12,
          reservedQuantity: 0,
          reorderLevel: 3,
        },
      },
    });
    assert.equal(
      (observed.isolation as { isolationLevel?: string }).isolationLevel,
      "Serializable",
    );
  } finally {
    database.productVariant.findFirst = originals.findFirst;
    database.$transaction = originals.transaction;
  }
});

test("refuses duplicate inventory without creating another record", async () => {
  const originals = {
    findFirst: database.productVariant.findFirst,
    transaction: database.$transaction,
  };
  let createCalled = false;

  database.productVariant.findFirst = async () => ({
    id: "variant-id",
    productId: "product-id",
    sku: "ryucomm-sim-router-01",
    name: "Router variant",
    price: 12000,
    status: "ACTIVE",
  });
  database.$transaction = async (callback) =>
    callback(makeTx({
      existingInventory: {
        id: "existing-inventory-id",
        variantId: "variant-id",
        quantity: 4,
        reservedQuantity: 0,
        reorderLevel: 1,
      },
      onCreate: () => { createCalled = true; },
    }));

  try {
    await assert.rejects(
      createInventory("product-id", "variant-id", { quantity: 12 }, "admin-id"),
      (error: unknown) =>
        error instanceof Error &&
        error.message === "Inventory already exists for this variant",
    );
    assert.equal(createCalled, false);
  } finally {
    database.productVariant.findFirst = originals.findFirst;
    database.$transaction = originals.transaction;
  }
});

test("rejects negative and fractional inventory quantities at API validation", () => {
  const baseRequest = {
    params: {
      productId: "00000000-0000-4000-8000-000000000001",
      variantId: "00000000-0000-4000-8000-000000000002",
    },
    query: {},
  };

  assert.equal(
    createInventorySchema.safeParse({
      ...baseRequest,
      body: { quantity: -1 },
    }).success,
    false,
  );
  assert.equal(
    createInventorySchema.safeParse({
      ...baseRequest,
      body: { quantity: 1.5 },
    }).success,
    false,
  );
});

test("requires authentication and inventory.update permission", async () => {
  const request = {
    cookies: {},
  } as AuthenticatedRequest;
  let authError: unknown;
  requireAuth(request, {} as Response, (error) => {
    authError = error;
  });
  assert.equal((authError as { statusCode?: number })?.statusCode, 401);

  const originalFindFirst = database.rolePermission.findFirst;
  database.rolePermission.findFirst = async () => null;
  let permissionError: unknown;
  try {
    await requirePermission("inventory.update")(
      {
        user: {
          userId: "admin-id",
          roleId: "role-id",
          roleName: "Admin",
        },
      } as AuthenticatedRequest,
      {} as Response,
      (error) => {
        permissionError = error;
      },
    );
    assert.equal((permissionError as { statusCode?: number })?.statusCode, 403);
  } finally {
    database.rolePermission.findFirst = originalFindFirst;
  }
});
