import assert from "node:assert/strict";
import test from "node:test";

process.env.DATABASE_URL ??= "postgresql://127.0.0.1:5432/test";

const { prisma } = await import("../config/database.js");
const {
  createProductSpecification,
  createSpecification,
  createSpecificationGroup,
  deleteSpecification,
  getProductSpecifications,
  getSpecificationGroups,
  getSpecifications,
} = await import("./specification.service.js");
const {
  createProductSpecificationSchema,
  createSpecificationGroupSchema,
  createSpecificationSchema,
} = await import("../validators/specification.validator.js");

const database = prisma as unknown as Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>>;

const replace = (
  model: string,
  method: string,
  implementation: (...args: unknown[]) => Promise<unknown>,
) => {
  const original = database[model][method];
  database[model][method] = implementation;
  return () => {
    database[model][method] = original;
  };
};

test("loads all groups and only the definitions in the selected group", async () => {
  const groups = [
    { id: "display-id", name: "Display", specifications: [{ id: "resolution" }] },
    { id: "connectivity-id", name: "Connectivity", specifications: [{ id: "sim-type" }] },
  ];
  let definitionQuery: Record<string, unknown> | undefined;
  const restoreGroups = replace("specificationGroup", "findMany", async () => groups);
  const restoreEnsure = replace("specificationGroup", "findUnique", async () => ({ id: "connectivity-id" }));
  const restoreDefinitions = replace("specification", "findMany", async (args) => {
    definitionQuery = args as Record<string, unknown>;
    return [{ id: "sim-type", groupId: "connectivity-id", name: "SIM Card Type" }];
  });

  try {
    assert.deepEqual(await getSpecificationGroups(), groups);
    const definitions = await getSpecifications("connectivity-id");
    assert.equal(definitions[0].name, "SIM Card Type");
    assert.deepEqual(definitionQuery?.where, { groupId: "connectivity-id" });
  } finally {
    restoreGroups();
    restoreEnsure();
    restoreDefinitions();
  }
});

test("creates reusable groups and definitions with audit records", async () => {
  const observed: Record<string, unknown> = {};
  const auditRecords: unknown[] = [];
  const group = { id: "connectivity-id", name: "Connectivity", sortOrder: 0 };
  const definition = {
    id: "sim-type",
    groupId: group.id,
    name: "SIM Card Type",
    group,
  };
  const restores = [
    replace("specificationGroup", "findUnique", async () => group),
    replace("specificationGroup", "findFirst", async () => null),
    replace("specificationGroup", "create", async (args) => {
      observed.groupCreate = args;
      return group;
    }),
    replace("specification", "findFirst", async () => null),
    replace("specification", "create", async (args) => {
      observed.specificationCreate = args;
      return definition;
    }),
    replace("auditLog", "create", async (args) => {
      auditRecords.push(args);
      return {};
    }),
  ];

  try {
    assert.equal((await createSpecificationGroup({ name: "Connectivity" }, "admin")).name, "Connectivity");
    assert.equal((await createSpecification(group.id, { name: "SIM Card Type" }, "admin")).name, "SIM Card Type");
    assert.deepEqual(observed.groupCreate, {
      data: { name: "Connectivity", sortOrder: 0 },
    });
    assert.deepEqual(observed.specificationCreate, {
      data: { groupId: group.id, name: "SIM Card Type" },
      include: { group: true },
    });
    assert.equal(auditRecords.length, 2);
  } finally {
    restores.forEach((restore) => restore());
  }
});

test("validates names and rejects duplicate group and definition names", async () => {
  const groupParams = { body: { name: "Connectivity" }, params: {}, query: {} };
  const specificationParams = {
    body: { name: "Wi-Fi Standard" },
    params: { groupId: "00000000-0000-4000-8000-000000000001" },
    query: {},
  };
  assert.equal(createSpecificationGroupSchema.safeParse(groupParams).success, true);
  assert.equal(createSpecificationGroupSchema.safeParse({
    ...groupParams,
    body: { name: " " },
  }).success, false);
  assert.equal(createSpecificationSchema.safeParse(specificationParams).success, true);
  assert.equal(createSpecificationSchema.safeParse({
    ...specificationParams,
    body: { name: "" },
  }).success, false);

  const restoreEnsureGroup = replace("specificationGroup", "findUnique", async () => ({ id: "group-id" }));
  const restoreGroupFind = replace("specificationGroup", "findFirst", async () => ({ id: "existing" }));
  const restoreSpecFind = replace("specification", "findFirst", async () => ({ id: "existing" }));
  try {
    await assert.rejects(
      createSpecificationGroup({ name: "connectivity" }, "admin"),
      (error: unknown) => error instanceof Error && error.message === "Specification group already exists",
    );
    await assert.rejects(
      createSpecification("group-id", { name: "wi-fi standard" }, "admin"),
      (error: unknown) => error instanceof Error && error.message === "Specification already exists in this group",
    );
  } finally {
    restoreEnsureGroup();
    restoreGroupFind();
    restoreSpecFind();
  }
});

test("rejects duplicate product assignments and preserves existing TV specifications", async () => {
  const assigned = {
    id: "tv-panel-assignment",
    productId: "tv-product-id",
    specificationId: "panel-type",
    value: "OLED",
    specification: {
      id: "panel-type",
      name: "Panel Type",
      group: { id: "display-id", name: "Display", sortOrder: 0 },
    },
  };
  const restores = [
    replace("product", "findUnique", async () => ({ id: "tv-product-id", name: "TV", slug: "tv" })),
    replace("productSpecification", "findMany", async () => [assigned]),
    replace("specification", "findUnique", async () => ({
      id: "panel-type",
      name: "Panel Type",
      group: { id: "display-id", name: "Display" },
    })),
    replace("productSpecification", "findUnique", async () => assigned),
  ];

  try {
    const existingTvSpecs = await getProductSpecifications("tv-product-id");
    assert.deepEqual(existingTvSpecs, [assigned]);
    await assert.rejects(
      createProductSpecification(
        "tv-product-id",
        { specificationId: "panel-type", value: "LED" },
        "admin",
      ),
      (error: unknown) =>
        error instanceof Error &&
        error.message === "This specification is already assigned to the product",
    );
  } finally {
    restores.forEach((restore) => restore());
  }
});

test("validates product specification assignments", () => {
  const base = {
    params: { productId: "00000000-0000-4000-8000-000000000001" },
    query: {},
  };
  assert.equal(createProductSpecificationSchema.safeParse({
    ...base,
    body: {
      specificationId: "00000000-0000-4000-8000-000000000002",
      value: "Wi-Fi 6",
    },
  }).success, true);
  assert.equal(createProductSpecificationSchema.safeParse({
    ...base,
    body: {
      specificationId: "00000000-0000-4000-8000-000000000002",
      value: " ",
    },
  }).success, false);
});

test("protects specification definitions assigned to products from deletion", async () => {
  const restoreSpecification = replace("specification", "findUnique", async () => ({
    id: "panel-type",
    name: "Panel Type",
    group: { id: "display-id", name: "Display" },
  }));
  const restoreCount = replace("productSpecification", "count", async () => 1);
  let deleteCalled = false;
  const restoreDelete = replace("specification", "delete", async () => {
    deleteCalled = true;
    return {};
  });

  try {
    await assert.rejects(
      deleteSpecification("panel-type", "admin"),
      (error: unknown) =>
        error instanceof Error &&
        error.message === "Cannot delete specification while it is assigned to products",
    );
    assert.equal(deleteCalled, false);
  } finally {
    restoreSpecification();
    restoreCount();
    restoreDelete();
  }
});
