import assert from "node:assert/strict";
import test from "node:test";
import { checkoutSchema, checkoutQuoteSchema } from "./checkout.validator.js";

const validCheckout = {
    body: {
        requestId: "2d4a9a6a-6978-45dc-b8a7-135746f25229",
        items: [{
            variantId: "31a57eaa-53a9-4fde-8937-85c49454c90b",
            quantity: 2,
        }],
        shippingAddressId: "4f91311b-4550-4ba1-9d3c-50934c255023",
        billingAddressId: "4f91311b-4550-4ba1-9d3c-50934c255023",
        paymentMethod: "COD",
    },
    params: {},
    query: {},
};

test("checkout validates server-owned order input and supported payment methods", () => {
    assert.equal(checkoutSchema.safeParse(validCheckout).success, true);
    assert.equal(
        checkoutSchema.safeParse({
            ...validCheckout,
            body: { ...validCheckout.body, paymentMethod: "CASHFREE" },
        }).success,
        false
    );
});

test("checkout rejects invalid quantities and malformed request identifiers", () => {
    assert.equal(
        checkoutSchema.safeParse({
            ...validCheckout,
            body: {
                ...validCheckout.body,
                items: [{ ...validCheckout.body.items[0], quantity: 0 }],
            },
        }).success,
        false
    );
    assert.equal(
        checkoutSchema.safeParse({
            ...validCheckout,
            body: { ...validCheckout.body, requestId: "not-a-uuid" },
        }).success,
        false
    );
});

test("checkout quote requires a valid address and non-empty cart", () => {
    const quote = {
        body: {
            items: validCheckout.body.items,
            shippingAddressId: validCheckout.body.shippingAddressId,
        },
        params: {},
        query: {},
    };
    assert.equal(checkoutQuoteSchema.safeParse(quote).success, true);
    assert.equal(
        checkoutQuoteSchema.safeParse({
            ...quote,
            body: { ...quote.body, items: [] },
        }).success,
        false
    );
});
