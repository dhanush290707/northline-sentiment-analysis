export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let accessToken = "";

export function setAccessToken(token) {
  accessToken = token || "";
}

export function apiBase() {
  return (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
}

export async function api(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "content-type": "application/json" };
  if (auth) {
    if (!accessToken) {
      throw new ApiError(401, "AUTH_REQUIRED", "Sign in to continue.");
    }
    headers.authorization = `Bearer ${accessToken}`;
  }

  let response;
  try {
    response = await fetch(`${apiBase()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "NETWORK", "The network request failed. Check that the API is running and try again.");
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new ApiError(response.status, "BAD_RESPONSE", "The API returned a response that was not JSON.");
    }
  }
  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.error?.code || "API_ERROR",
      data?.error?.message || "The request failed.",
      data?.error?.details,
    );
  }
  return data;
}
