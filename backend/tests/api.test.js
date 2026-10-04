import assert from "node:assert/strict";
import test from "node:test";
import { handler } from "../src/handler.js";
import { parseGroups } from "../src/services/auth.js";

test("health does not require AWS", async () => {
  const response = await handler({
    rawPath: "/health",
    requestContext: { http: { method: "GET" } },
  });
  assert.equal(response.statusCode, 200);
  assert.equal(JSON.parse(response.body).service, "northline-api");
});

test("unknown routes return 404", async () => {
  const response = await handler({
    rawPath: "/missing",
    requestContext: { http: { method: "GET" } },
  });
  assert.equal(response.statusCode, 404);
  assert.equal(JSON.parse(response.body).error.code, "NOT_FOUND");
});

test("catalog routes explain a missing table instead of inventing products", async () => {
  const previous = process.env.TABLE_NAME;
  delete process.env.TABLE_NAME;
  const response = await handler({
    rawPath: "/products",
    requestContext: { http: { method: "GET" } },
  });
  if (previous === undefined) delete process.env.TABLE_NAME;
  else process.env.TABLE_NAME = previous;
  assert.equal(response.statusCode, 503);
  assert.equal(JSON.parse(response.body).error.code, "CONFIGURATION_ERROR");
});

test("review submission requires a signed-in customer before any analysis", async () => {
  const response = await handler({
    rawPath: "/products/nl-arc-7/reviews",
    body: JSON.stringify({ rating: 2, reviewText: "The battery is terrible and the phone overheats." }),
    requestContext: { http: { method: "POST" } },
  });
  assert.equal(response.statusCode, 401);
  assert.equal(JSON.parse(response.body).error.code, "AUTH_REQUIRED");
});

test("customers cannot open the admin dashboard", async () => {
  const response = await handler({
    rawPath: "/admin/dashboard",
    requestContext: {
      http: { method: "GET" },
      authorizer: { jwt: { claims: { sub: "customer-1", "cognito:groups": "customers" } } },
    },
  });
  assert.equal(response.statusCode, 403);
  assert.equal(JSON.parse(response.body).error.code, "ADMIN_REQUIRED");
});

test("anonymous admin calls are rejected", async () => {
  const response = await handler({
    rawPath: "/admin/reviews/negative",
    requestContext: { http: { method: "GET" } },
  });
  assert.equal(response.statusCode, 401);
});

test("cognito group claims are parsed from the shapes API Gateway sends", () => {
  assert.deepEqual(parseGroups("admins"), ["admins"]);
  assert.deepEqual(parseGroups("[admins]"), ["admins"]);
  assert.deepEqual(parseGroups("admins,customers"), ["admins", "customers"]);
  assert.deepEqual(parseGroups(["admins"]), ["admins"]);
});
