import assert from "node:assert/strict";
import test from "node:test";

process.env.DATABASE_URL ??= "postgresql://127.0.0.1:5432/test";
process.env.JWT_SECRET ??= "test-store-branding-secret";

const { prisma } = await import("../config/database.js");
const {
  getStoreBranding,
  saveStoreBranding,
} = await import("./setting.service.js");
const { storeBrandingSchema } = await import("../validators/setting.validator.js");

const database = prisma as unknown as {
  setting: {
    findMany: (...args: unknown[]) => Promise<unknown[]>;
  };
  $transaction: (
    callback: (transaction: {
      setting: { upsert: (...args: unknown[]) => Promise<unknown> };
      auditLog: { create: (...args: unknown[]) => Promise<unknown> };
    }) => Promise<unknown>
  ) => Promise<unknown>;
};

test("branding reads only public setting values and defaults alt text to the store name", async () => {
  const originalFindMany = database.setting.findMany;
  let query: Record<string, unknown> | undefined;
  database.setting.findMany = async (args: unknown) => {
    query = args as Record<string, unknown>;
    return [
      { key: "store.name", value: "  My Store  ", isSensitive: false },
      {
        key: "store.logoUrl",
        value: "https://cdn.example/logo.svg",
        isSensitive: false,
      },
      { key: "store.logoAltText", value: null, isSensitive: false },
      { key: "private.setting", value: "secret", isSensitive: true },
    ];
  };

  try {
    assert.deepEqual(await getStoreBranding(), {
      logoUrl: "https://cdn.example/logo.svg",
      storeName: "My Store",
      logoAltText: "My Store",
    });
    assert.deepEqual(query?.where, {
      key: { in: ["store.name", "store.logoUrl", "store.logoAltText"] },
    });
    assert.deepEqual(query?.select, {
      key: true,
      value: true,
      isSensitive: true,
    });
  } finally {
    database.setting.findMany = originalFindMany;
  }
});

test("branding save upserts existing settings without touching unrelated keys", async () => {
  const originalTransaction = database.$transaction;
  const originalFindMany = database.setting.findMany;
  const writes: Record<string, unknown>[] = [];
  let audit: Record<string, unknown> | undefined;
  const savedSettings = new Map<string, unknown>([
    ["store.name", "Old Store"],
    ["store.email", "keep@example.com"],
  ]);
  database.$transaction = async (callback) => callback({
    setting: {
      upsert: async (args: unknown) => {
        const write = args as Record<string, unknown>;
        const key = (write.where as { key: string }).key;
        const data = write.update as { value: unknown };
        writes.push(write);
        savedSettings.set(key, data.value);
        return {};
      },
    },
    auditLog: {
      create: async (args: unknown) => {
        audit = args as Record<string, unknown>;
        return {};
      },
    },
  });
  database.setting.findMany = async () =>
    [...savedSettings.entries()]
      .filter(([key]) => [
        "store.name",
        "store.logoUrl",
        "store.logoAltText",
      ].includes(key))
      .map(([key, value]) => ({ key, value, isSensitive: false }));

  try {
    const result = await saveStoreBranding(
      {
        logoUrl: "",
        storeName: "My Store",
        logoAltText: "",
      },
      "admin-id"
    );
    assert.deepEqual(result, {
      logoUrl: "",
      storeName: "My Store",
      logoAltText: "My Store",
    });
    assert.deepEqual(
      writes.map((write) => (write.where as { key: string }).key),
      ["store.name", "store.logoUrl", "store.logoAltText"]
    );
    assert.ok(writes.every((write) => {
      const data = write.update as Record<string, unknown>;
      return data.category === "STORE" && data.isSensitive === false;
    }));
    assert.equal((audit?.data as Record<string, unknown>).entity, "StoreBranding");
    assert.equal(savedSettings.get("store.email"), "keep@example.com");
    assert.deepEqual(await getStoreBranding(), {
      logoUrl: "",
      storeName: "My Store",
      logoAltText: "My Store",
    });
  } finally {
    database.$transaction = originalTransaction;
    database.setting.findMany = originalFindMany;
  }
});

test("branding validator allows an empty logo URL and rejects unsafe or malformed values", () => {
  const request = {
    params: {},
    query: {},
    body: {
      logoUrl: "",
      storeName: "My Store",
      logoAltText: "",
    },
  };
  assert.doesNotThrow(() => storeBrandingSchema.parse(request));
  assert.throws(() =>
    storeBrandingSchema.parse({
      ...request,
      body: { ...request.body, logoUrl: "javascript:alert(1)" },
    })
  );
  assert.throws(() =>
    storeBrandingSchema.parse({
      ...request,
      body: { ...request.body, storeName: "   " },
    })
  );
});
