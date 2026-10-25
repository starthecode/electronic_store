import assert from "node:assert/strict";
import test from "node:test";

process.env.DATABASE_URL ??= "postgresql://127.0.0.1:5432/test";

const { prisma } = await import("../config/database.js");
const { deleteProduct } = await import("./product.service.js");

type DeleteTransaction = {
  product: {
    findUnique: (args: unknown) => Promise<unknown>;
    delete: (args: unknown) => Promise<unknown>;
  };
  orderItem: {
    count: (args: unknown) => Promise<number>;
  };
  inventoryTransaction: {
    count: (args: unknown) => Promise<number>;
  };
  auditLog: {
    create: (args: unknown) => Promise<unknown>;
  };
};

const database = prisma as unknown as {
  $transaction: (
    callback: (transaction: DeleteTransaction) => Promise<unknown>,
    options?: { isolationLevel: string },
  ) => Promise<unknown>;
};

const createTransaction = ({
  orderItemCount,
  inventoryTransactionCount,
  deleted,
  queries,
}: {
  orderItemCount: number;
  inventoryTransactionCount: number;
  deleted: string[];
  queries: Record<string, unknown>[];
}): DeleteTransaction => ({
  product: {
    findUnique: async (args) => {
      queries.push(args as Record<string, unknown>);
      return {
        id: "product-id",
        name: "Test product",
      };
    },
    delete: async (args) => {
      deleted.push("product");
      queries.push(args as Record<string, unknown>);
      return {};
    },
  },
  orderItem: {
    count: async (args) => {
      queries.push(args as Record<string, unknown>);
      return orderItemCount;
    },
  },
  inventoryTransaction: {
    count: async (args) => {
      queries.push(args as Record<string, unknown>);
      return inventoryTransactionCount;
    },
  },
  auditLog: {
    create: async (args) => {
      deleted.push("audit");
      queries.push(args as Record<string, unknown>);
      return {};
    },
  },
});

test("deletes a product and schema-cascaded dependents with no protected history", async () => {
  const originalTransaction = database.$transaction;
  const deleted: string[] = [];
  const queries: Record<string, unknown>[] = [];
  let isolationLevel: string | undefined;
  database.$transaction = async (callback, options) => {
    isolationLevel = options?.isolationLevel;
    return callback(createTransaction({
      orderItemCount: 0,
      inventoryTransactionCount: 0,
      deleted,
      queries,
    }));
  };

  try {
    await deleteProduct("product-id", "admin-id");
    assert.deepEqual(deleted, ["product", "audit"]);
    assert.equal(isolationLevel, "Serializable");
    assert.deepEqual(queries[1], {
      where: {
        variant: { is: { productId: "product-id" } },
      },
    });
    assert.deepEqual(queries[2], queries[1]);
  } finally {
    database.$transaction = originalTransaction;
  }
});

test("refuses to delete a product referenced by existing order items", async () => {
  const originalTransaction = database.$transaction;
  const deleted: string[] = [];
  const queries: Record<string, unknown>[] = [];
  database.$transaction = async (callback) =>
    callback(createTransaction({
      orderItemCount: 1,
      inventoryTransactionCount: 0,
      deleted,
      queries,
    }));

  try {
    await assert.rejects(
      deleteProduct("product-id", "admin-id"),
      (error: unknown) =>
        error instanceof Error &&
        error.message === "Product cannot be deleted because it has order history"
    );
    assert.deepEqual(deleted, []);
  } finally {
    database.$transaction = originalTransaction;
  }
});

test("refuses to delete a product with inventory transaction history", async () => {
  const originalTransaction = database.$transaction;
  const deleted: string[] = [];
  const queries: Record<string, unknown>[] = [];
  database.$transaction = async (callback) =>
    callback(createTransaction({
      orderItemCount: 0,
      inventoryTransactionCount: 1,
      deleted,
      queries,
    }));

  try {
    await assert.rejects(
      deleteProduct("product-id", "admin-id"),
      (error: unknown) =>
        error instanceof Error &&
        error.message ===
          "Product cannot be deleted because it has inventory transaction history"
    );
    assert.deepEqual(deleted, []);
  } finally {
    database.$transaction = originalTransaction;
  }
});
