export function parseGroups(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw !== "string") return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      /* Cognito sometimes uses a bracketed list that is not JSON. */
    }
    return trimmed
      .replace(/^\[/, "")
      .replace(/\]$/, "")
      .split(/[,\s]+/)
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return trimmed.split(/[,\s]+/).map((part) => part.trim()).filter(Boolean);
}

export function userFromEvent(event) {
  const claims = event?.requestContext?.authorizer?.jwt?.claims;
  if (!claims?.sub) return null;
  const groups = parseGroups(claims["cognito:groups"]);
  return {
    userId: claims.sub,
    email: claims.email || "",
    username: claims.username || claims["cognito:username"] || "",
    groups,
    isAdmin: groups.includes("admins"),
  };
}

export function requireUser(user) {
  if (!user) {
    const error = new Error("Sign in to continue.");
    error.statusCode = 401;
    error.code = "AUTH_REQUIRED";
    throw error;
  }
  return user;
}

export function requireAdmin(user) {
  requireUser(user);
  if (!user.isAdmin) {
    const error = new Error("This action is limited to shop owners.");
    error.statusCode = 403;
    error.code = "ADMIN_REQUIRED";
    throw error;
  }
  return user;
}
