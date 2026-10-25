import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import rateLimit from "express-rate-limit";

process.env.DATABASE_URL ??= "postgresql://127.0.0.1:5432/test";
process.env.JWT_SECRET ??= "test-proxy-configuration-secret";

const { default: apiApp } = await import("./app.js");

test("Render trusts one proxy hop and rate limits by the proxy-supplied client address", async () => {
  const trustedProxyHops = apiApp.get("trust proxy");
  assert.equal(trustedProxyHops, 1);

  const app = express();
  app.set("trust proxy", trustedProxyHops);
  app.use(rateLimit({
    windowMs: 60_000,
    limit: 1,
    standardHeaders: false,
    legacyHeaders: false,
  }));
  app.get("/", (req, res) => res.json({ ip: req.ip }));

  const server = app.listen(0, "127.0.0.1");
  try {
    await new Promise<void>((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const url = `http://127.0.0.1:${address.port}/`;
    const first = await fetch(url, {
      headers: { "X-Forwarded-For": "198.51.100.88, 203.0.113.22" },
    });
    assert.equal(first.status, 200);
    assert.deepEqual(await first.json(), { ip: "203.0.113.22" });

    const spoofedPrefix = await fetch(url, {
      headers: { "X-Forwarded-For": "192.0.2.44, 203.0.113.22" },
    });
    assert.equal(spoofedPrefix.status, 429);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});

test("customer address API rejects requests without the auth cookie", async () => {
  const server = apiApp.listen(0, "127.0.0.1");
  try {
    await new Promise<void>((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/store/account/addresses`
    );
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      success: false,
      message: "Authentication required",
      errors: null,
    });
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});
