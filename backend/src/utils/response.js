import { allowedOrigin } from "../config.js";

export function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": allowedOrigin(),
      "access-control-allow-headers": "content-type,authorization",
      "access-control-allow-methods": "GET,POST,PUT,PATCH,OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

export function parseBody(event) {
  if (!event.body) return {};
  try {
    return JSON.parse(event.body);
  } catch {
    const error = new Error("Request body must be valid JSON.");
    error.statusCode = 400;
    error.code = "INVALID_JSON";
    throw error;
  }
}
