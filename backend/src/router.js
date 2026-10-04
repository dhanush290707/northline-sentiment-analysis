import { userFromEvent, requireAdmin } from "./services/auth.js";
import { json } from "./utils/response.js";
import { listProducts, getProduct } from "./routes/products.js";
import { listReviews, createReview } from "./routes/reviews.js";
import { createOrder, listOrders, getOrder } from "./routes/orders.js";
import { getMe, updateMe, listMyReviews } from "./routes/profile.js";
import {
  dashboard,
  adminReviews,
  negativeReviews,
  productSentiment,
  adminReview,
  updateStatus,
} from "./routes/admin.js";

const routes = [
  { method: "GET", pattern: "/health", auth: false, admin: false, handler: health },
  { method: "GET", pattern: "/products", auth: false, admin: false, handler: listProducts },
  { method: "GET", pattern: "/products/:id/reviews", auth: false, admin: false, handler: listReviews },
  { method: "POST", pattern: "/products/:id/reviews", auth: true, admin: false, handler: createReview },
  { method: "GET", pattern: "/products/:id", auth: false, admin: false, handler: getProduct },
  { method: "POST", pattern: "/orders", auth: true, admin: false, handler: createOrder },
  { method: "GET", pattern: "/orders", auth: true, admin: false, handler: listOrders },
  { method: "GET", pattern: "/orders/:id", auth: true, admin: false, handler: getOrder },
  { method: "GET", pattern: "/me/reviews", auth: true, admin: false, handler: listMyReviews },
  { method: "GET", pattern: "/me", auth: true, admin: false, handler: getMe },
  { method: "PUT", pattern: "/me", auth: true, admin: false, handler: updateMe },
  { method: "GET", pattern: "/admin/dashboard", auth: true, admin: true, handler: dashboard },
  { method: "GET", pattern: "/admin/reviews/negative", auth: true, admin: true, handler: negativeReviews },
  { method: "GET", pattern: "/admin/reviews/:reviewId", auth: true, admin: true, handler: adminReview },
  { method: "PATCH", pattern: "/admin/reviews/:reviewId/status", auth: true, admin: true, handler: updateStatus },
  { method: "GET", pattern: "/admin/reviews", auth: true, admin: true, handler: adminReviews },
  { method: "GET", pattern: "/admin/products/:id/sentiment", auth: true, admin: true, handler: productSentiment },
];

function matchPattern(pattern, path) {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;
  const params = {};
  for (let index = 0; index < patternParts.length; index += 1) {
    const token = patternParts[index];
    if (token.startsWith(":")) {
      params[token.slice(1)] = decodeURIComponent(pathParts[index]);
    } else if (token !== pathParts[index]) {
      return null;
    }
  }
  return params;
}

async function health() {
  return json(200, { ok: true, service: "northline-api" });
}

export async function route(event) {
  const method = event.requestContext?.http?.method || "GET";
  const rawPath = event.rawPath || "/";
  const path = rawPath.replace(/\/+$/, "") || "/";
  if (method === "OPTIONS") return json(204, {});

  const user = userFromEvent(event);
  for (const entry of routes) {
    if (entry.method !== method) continue;
    const params = matchPattern(entry.pattern, path);
    if (!params) continue;
    if (entry.admin) requireAdmin(user);
    else if (entry.auth && !user) {
      const error = new Error("Sign in to continue.");
      error.statusCode = 401;
      error.code = "AUTH_REQUIRED";
      throw error;
    }
    return entry.handler({ ...event, pathParameters: params }, user);
  }

  const error = new Error("That route does not exist.");
  error.statusCode = 404;
  error.code = "NOT_FOUND";
  throw error;
}
