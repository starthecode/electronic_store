import assert from "node:assert/strict";
import test from "node:test";

process.env.DATABASE_URL ??= "postgresql://127.0.0.1:5432/test";

const [{ prisma }, customerService] = await Promise.all([
    import("../../config/database.js"),
    import("./customer.service.js"),
]);

test("address listing is scoped to the authenticated customer", async () => {
    const originalFindUser = prisma.user.findFirst;
    const originalFindAddresses = prisma.address.findMany;
    let addressFilter: unknown;

    Object.defineProperty(prisma.user, "findFirst", {
        configurable: true,
        value: async (args: { where: { id: string } }) => ({ id: args.where.id }),
    });
    Object.defineProperty(prisma.address, "findMany", {
        configurable: true,
        value: async (args: { where: unknown }) => {
            addressFilter = args.where;
            return [];
        },
    });

    try {
        await customerService.listAddresses("customer-a");
        assert.deepEqual(addressFilter, { userId: "customer-a" });
    } finally {
        Object.defineProperty(prisma.user, "findFirst", { configurable: true, value: originalFindUser });
        Object.defineProperty(prisma.address, "findMany", { configurable: true, value: originalFindAddresses });
    }
});

test("address update refuses an address owned by another customer", async () => {
    const originalFindUser = prisma.user.findFirst;
    const originalFindAddress = prisma.address.findFirst;
    let addressFilter: unknown;

    Object.defineProperty(prisma.user, "findFirst", {
        configurable: true,
        value: async (args: { where: { id: string } }) => ({ id: args.where.id }),
    });
    Object.defineProperty(prisma.address, "findFirst", {
        configurable: true,
        value: async (args: { where: unknown }) => {
            addressFilter = args.where;
            return null;
        },
    });

    try {
        await assert.rejects(
            customerService.updateAddress("customer-a", "address-b", {
                type: "BILLING",
                firstName: "Customer",
                phone: "9876543210",
                addressLine1: "Test address",
                city: "Test city",
                state: "Test state",
                postalCode: "123456",
            }),
            (error: { statusCode?: number }) => error.statusCode === 404
        );
        assert.deepEqual(addressFilter, { id: "address-b", userId: "customer-a" });
    } finally {
        Object.defineProperty(prisma.user, "findFirst", { configurable: true, value: originalFindUser });
        Object.defineProperty(prisma.address, "findFirst", { configurable: true, value: originalFindAddress });
    }
});
