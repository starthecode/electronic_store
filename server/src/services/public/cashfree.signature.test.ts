import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";

process.env.DATABASE_URL ??= "postgresql://127.0.0.1:5432/test";
process.env.CASHFREE_APP_ID = "cashfree-test-app-id";
process.env.CASHFREE_SECRET_KEY = "cashfree-test-secret";
process.env.CASHFREE_ENV = "sandbox";

const { verifyCashfreeWebhookSignature } = await import("./cashfree.service.js");

test("Cashfree webhook signature uses timestamp, separator, and the unmodified raw body", () => {
    const timestamp = "1785401067911";
    const rawBody = Buffer.from('{"type":"PAYMENT_SUCCESS_WEBHOOK","data":{"amount":170.00}}');
    const signature = crypto
        .createHmac("sha256", process.env.CASHFREE_SECRET_KEY!)
        .update(`${timestamp}.${rawBody.toString("utf8")}`)
        .digest("base64");

    assert.equal(verifyCashfreeWebhookSignature(rawBody, timestamp, signature), true);
    assert.equal(
        verifyCashfreeWebhookSignature(Buffer.from(`${rawBody.toString("utf8")} `), timestamp, signature),
        false
    );
    assert.equal(verifyCashfreeWebhookSignature(rawBody, `${timestamp}0`, signature), false);
});
