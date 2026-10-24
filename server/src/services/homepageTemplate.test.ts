import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import cookieParser from "cookie-parser";

process.env.DATABASE_URL ??= "postgresql://127.0.0.1:5432/test";
process.env.JWT_SECRET ??= "test-homepage-template-secret";

const { prisma } = await import("../config/database.js");
const { generateToken } = await import("../utils/jwt.js");
const {
  createHomepageSlide,
  createTestimonial,
  deleteHomepageSlide,
  deleteTestimonial,
  getAdminHomepageSlides,
  getPublicTestimonials,
  getPublicHomepageSlides,
  reorderHomepageSlides,
  updateHomepageSlide,
  updateTestimonial,
} = await import("./homepageTemplate.service.js");
const { createHomepageSlideSchema, createTestimonialSchema } = await import(
  "../validators/homepageTemplate.validator.js"
);
const { default: homepageTemplateRoutes } = await import(
  "../routes/homepageTemplate.routes.js"
);
const { errorMiddleware } = await import("../middleware/error.middleware.js");

const database = prisma as unknown as {
  homepageSlide: {
    create: (...args: unknown[]) => Promise<unknown>;
    delete: (...args: unknown[]) => Promise<unknown>;
    findMany: (...args: unknown[]) => Promise<unknown[]>;
    findUnique: (...args: unknown[]) => Promise<unknown>;
    update: (...args: unknown[]) => Promise<unknown>;
  };
  customerTestimonial: {
    create: (...args: unknown[]) => Promise<unknown>;
    delete: (...args: unknown[]) => Promise<unknown>;
    findUnique: (...args: unknown[]) => Promise<unknown>;
    findMany: (...args: unknown[]) => Promise<unknown[]>;
    update: (...args: unknown[]) => Promise<unknown>;
  };
  auditLog: {
    create: (...args: unknown[]) => Promise<unknown>;
  };
  rolePermission: {
    findFirst: (...args: unknown[]) => Promise<unknown>;
  };
  $transaction: (items: Promise<unknown>[]) => Promise<unknown>;
};

test("public slide listing filters active slides and selects public fields in display order", async () => {
  const originalFindMany = database.homepageSlide.findMany;
  let query: Record<string, unknown> | undefined;
  database.homepageSlide.findMany = async (args: unknown) => {
    query = args as Record<string, unknown>;
    return [];
  };

  try {
    await getPublicHomepageSlides();
    assert.deepEqual(query?.where, { isActive: true });
    assert.deepEqual(query?.orderBy, [
      { sortOrder: "asc" },
      { createdAt: "asc" },
    ]);
    assert.deepEqual(query?.select, {
      id: true,
      brandName: true,
      title: true,
      titleHighlight: true,
      description: true,
      featureBullets: true,
      specText: true,
      priceLabel: true,
      price: true,
      variantLabels: true,
      buttonLabel: true,
      buttonUrl: true,
      imageUrl: true,
      mobileImageUrl: true,
      backgroundImageUrl: true,
      backgroundColor: true,
      sortOrder: true,
    });
  } finally {
    database.homepageSlide.findMany = originalFindMany;
  }
});

test("admin slide CRUD records audit events", async () => {
  const originalCreate = database.homepageSlide.create;
  const originalFindUnique = database.homepageSlide.findUnique;
  const originalUpdate = database.homepageSlide.update;
  const originalDelete = database.homepageSlide.delete;
  const originalAuditCreate = database.auditLog.create;
  const auditActions: string[] = [];
  const slide = {
    id: "slide-id",
    title: "New launch",
    description: "A new product range",
    buttonLabel: "Shop now",
    buttonUrl: "/shop",
    imageUrl: "https://images.example/hero.jpg",
  };

  database.homepageSlide.create = async () => slide;
  database.homepageSlide.findUnique = async () => slide;
  database.homepageSlide.update = async () => ({ ...slide, title: "Updated" });
  database.homepageSlide.delete = async () => slide;
  database.auditLog.create = async (args: unknown) => {
    const data = (args as { data: { action: string } }).data;
    auditActions.push(data.action);
    return {};
  };

  try {
    await createHomepageSlide(slide, "admin-id");
    await updateHomepageSlide("slide-id", { title: "Updated" }, "admin-id");
    await deleteHomepageSlide("slide-id", "admin-id");
    assert.deepEqual(auditActions, ["CREATE", "UPDATE", "DELETE"]);
  } finally {
    database.homepageSlide.create = originalCreate;
    database.homepageSlide.findUnique = originalFindUnique;
    database.homepageSlide.update = originalUpdate;
    database.homepageSlide.delete = originalDelete;
    database.auditLog.create = originalAuditCreate;
  }
});

test("public testimonials are active-only and ordered without admin timestamps", async () => {
  const originalFindMany = database.customerTestimonial.findMany;
  let query: Record<string, unknown> | undefined;
  database.customerTestimonial.findMany = async (args: unknown) => {
    query = args as Record<string, unknown>;
    return [];
  };

  try {
    await getPublicTestimonials();
    assert.deepEqual(query?.where, { isActive: true });
    assert.deepEqual(query?.orderBy, [
      { sortOrder: "asc" },
      { createdAt: "asc" },
    ]);
    assert.deepEqual(query?.select, {
      id: true,
      customerName: true,
      customerRole: true,
      text: true,
      rating: true,
      avatarUrl: true,
      sortOrder: true,
    });
  } finally {
    database.customerTestimonial.findMany = originalFindMany;
  }
});

test("testimonial CRUD records audit events", async () => {
  const originalCreate = database.customerTestimonial.create;
  const originalFindUnique = database.customerTestimonial.findUnique;
  const originalUpdate = database.customerTestimonial.update;
  const originalDelete = database.customerTestimonial.delete;
  const originalAuditCreate = database.auditLog.create;
  const auditActions: string[] = [];
  const testimonial = {
    id: "testimonial-id",
    customerName: "Customer",
    customerRole: "Customer",
    text: "A verified experience",
    rating: 5,
    avatarUrl: null,
  };

  database.customerTestimonial.create = async () => testimonial;
  database.customerTestimonial.findUnique = async () => testimonial;
  database.customerTestimonial.update = async () => ({
    ...testimonial,
    rating: 4,
  });
  database.customerTestimonial.delete = async () => testimonial;
  database.auditLog.create = async (args: unknown) => {
    const data = (args as { data: { action: string } }).data;
    auditActions.push(data.action);
    return {};
  };

  try {
    await createTestimonial(testimonial, "admin-id");
    await updateTestimonial("testimonial-id", { rating: 4 }, "admin-id");
    await deleteTestimonial("testimonial-id", "admin-id");
    assert.deepEqual(auditActions, ["CREATE", "UPDATE", "DELETE"]);
  } finally {
    database.customerTestimonial.create = originalCreate;
    database.customerTestimonial.findUnique = originalFindUnique;
    database.customerTestimonial.update = originalUpdate;
    database.customerTestimonial.delete = originalDelete;
    database.auditLog.create = originalAuditCreate;
  }
});

test("template validators reject unsafe destinations and invalid star ratings", () => {
  const baseSlide = {
    title: "Featured",
    description: "Browse new arrivals",
    buttonLabel: "Shop now",
    imageUrl: "https://images.example/slide.jpg",
  };
  const baseTestimonial = {
    customerName: "Customer",
    customerRole: "Member",
    text: "A genuine review",
    rating: 5,
  };

  assert.throws(() =>
    createHomepageSlideSchema.parse({
      body: { ...baseSlide, buttonUrl: "javascript:alert(1)" },
      params: {},
      query: {},
    })
  );
  assert.throws(() =>
    createHomepageSlideSchema.parse({
      body: { ...baseSlide, buttonUrl: "/\\external.example" },
      params: {},
      query: {},
    })
  );
  assert.throws(() =>
    createTestimonialSchema.parse({
      body: { ...baseTestimonial, rating: 0 },
      params: {},
      query: {},
    })
  );
  assert.doesNotThrow(() =>
    createHomepageSlideSchema.parse({
      body: {
        ...baseSlide,
        buttonUrl: "/shop",
        brandName: "Device brand",
        titleHighlight: "Highlighted copy",
        featureBullets: ["Foldable display"],
        specText: "256GB + 12GB",
        priceLabel: "BDT",
        price: "285,999",
        variantLabels: ["Graphite"],
        backgroundImageUrl: "https://images.example/background.jpg",
        backgroundColor: "#ffffff",
      },
      params: {},
      query: {},
    })
  );
  assert.throws(() =>
    createHomepageSlideSchema.parse({
      body: {
        ...baseSlide,
        buttonUrl: "/shop",
        featureBullets: ["x".repeat(181)],
      },
      params: {},
      query: {},
    })
  );
  assert.throws(() =>
    createHomepageSlideSchema.parse({
      body: { ...baseSlide, buttonUrl: "/shop", backgroundColor: "red" },
      params: {},
      query: {},
    })
  );
});

test("slide reorder requires every id once and persists the supplied order", async () => {
  const originalFindMany = database.homepageSlide.findMany;
  const originalUpdate = database.homepageSlide.update;
  const originalTransaction = database.$transaction;
  const originalAuditCreate = database.auditLog.create;
  const updates: { id: string; sortOrder: number }[] = [];

  database.homepageSlide.findMany = async () => [
    { id: "slide-a" },
    { id: "slide-b" },
  ];
  database.homepageSlide.update = async (args: unknown) => {
    const { where, data } = args as {
      where: { id: string };
      data: { sortOrder: number };
    };
    updates.push({ id: where.id, sortOrder: data.sortOrder });
    return {};
  };
  database.$transaction = async (operations) => Promise.all(operations);
  database.auditLog.create = async () => ({});

  try {
    await assert.rejects(
      reorderHomepageSlides(["slide-a"], "admin-id"),
      /every homepage slide exactly once/
    );
    assert.equal(updates.length, 0);

    await reorderHomepageSlides(["slide-b", "slide-a"], "admin-id");
    assert.deepEqual(updates, [
      { id: "slide-b", sortOrder: 0 },
      { id: "slide-a", sortOrder: 1 },
    ]);
  } finally {
    database.homepageSlide.findMany = originalFindMany;
    database.homepageSlide.update = originalUpdate;
    database.$transaction = originalTransaction;
    database.auditLog.create = originalAuditCreate;
  }
});

test("template management requires authentication and the dedicated permission", async () => {
  const originalPermissionFind = database.rolePermission.findFirst;
  const originalSlideList = database.homepageSlide.findMany;
  let hasPermission = false;
  let requestedQuery: Record<string, unknown> | undefined;

  database.rolePermission.findFirst = async () =>
    hasPermission ? { permission: { name: "homepage_templates.manage" } } : null;
  database.homepageSlide.findMany = async (args: unknown) => {
    requestedQuery = args as Record<string, unknown>;
    return [];
  };

  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/homepage", homepageTemplateRoutes);
  app.use(errorMiddleware);
  const server = app.listen(0, "127.0.0.1");
  try {
    await new Promise<void>((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const endpoint = `http://127.0.0.1:${address.port}/api/homepage/slides`;
    const token = generateToken({
      userId: "admin-id",
      roleId: "role-id",
      roleName: "EDITOR",
    });

    const unauthenticated = await fetch(endpoint);
    assert.equal(unauthenticated.status, 401);

    const forbidden = await fetch(endpoint, {
      headers: { Cookie: `auth_token=${token}` },
    });
    assert.equal(forbidden.status, 403);

    hasPermission = true;
    const authorized = await fetch(endpoint, {
      headers: { Cookie: `auth_token=${token}` },
    });
    assert.equal(authorized.status, 200);
    assert.deepEqual(requestedQuery?.orderBy, [
      { sortOrder: "asc" },
      { createdAt: "asc" },
    ]);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
    database.rolePermission.findFirst = originalPermissionFind;
    database.homepageSlide.findMany = originalSlideList;
  }
});
