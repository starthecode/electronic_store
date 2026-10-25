import assert from "node:assert/strict";
import test from "node:test";
import { loadInventorySnapshot } from "./inventoryData.js";

test("refreshes inventory rows and summary together", async () => {
  const inventoryRows = [{ id: "inventory-1", quantity: 8 }];
  const pagination = { page: 1, limit: 20, total: 1, totalPages: 1 };
  const summary = {
    totalStock: 8,
    totalReserved: 2,
    totalAvailable: 6,
    lowStockProducts: 1,
  };
  const calls = [];

  const snapshot = await loadInventorySnapshot(
    async (params) => {
      calls.push(["list", params]);
      return { inventories: inventoryRows, pagination };
    },
    async () => {
      calls.push(["summary"]);
      return summary;
    },
    { page: 1, limit: 20, search: "router" },
  );

  assert.deepEqual(calls, [
    ["list", { page: 1, limit: 20, search: "router" }],
    ["summary"],
  ]);
  assert.deepEqual(snapshot, {
    inventories: inventoryRows,
    pagination,
    summary,
  });
});
