import { AppError } from "./errors.js";
import { route } from "./router.js";
import { logError } from "./utils/logger.js";
import { json } from "./utils/response.js";

function toResponse(error) {
  if (error instanceof AppError || error.statusCode) {
    return json(error.statusCode, {
      error: {
        code: error.code || "REQUEST_FAILED",
        message: error.message,
        details: error.details || undefined,
      },
    });
  }
  logError("unhandled error", error);
  return json(500, {
    error: {
      code: "INTERNAL",
      message: "The request failed. Check the API logs for the error name.",
    },
  });
}

export async function handler(event) {
  try {
    return await route(event);
  } catch (error) {
    if (!error.statusCode) logError("request failed", error, { path: event?.rawPath });
    return toResponse(error);
  }
}
