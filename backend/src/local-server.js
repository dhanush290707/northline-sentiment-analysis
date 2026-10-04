import "dotenv/config";
import cors from "cors";
import express from "express";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { handler } from "./handler.js";
import { logError, logInfo } from "./utils/logger.js";

const port = Number(process.env.PORT || 3001);
const app = express();
app.use(cors({ origin: true, allowedHeaders: ["content-type", "authorization"] }));
app.use(express.json({ limit: "1mb" }));

let verifier;
function tokenVerifier() {
  if (!process.env.USER_POOL_ID || !process.env.USER_POOL_CLIENT_ID) return null;
  if (!verifier) {
    verifier = CognitoJwtVerifier.create({
      userPoolId: process.env.USER_POOL_ID,
      tokenUse: "access",
      clientId: process.env.USER_POOL_CLIENT_ID,
    });
  }
  return verifier;
}

app.use(async (req, res) => {
  try {
    let claims;
    const header = req.headers.authorization || "";
    if (header.toLowerCase().startsWith("bearer ")) {
      const token = header.slice(7).trim();
      const verify = tokenVerifier();
      if (!verify) {
        res.status(503).json({
          error: {
            code: "CONFIGURATION_ERROR",
            message: "USER_POOL_ID and USER_POOL_CLIENT_ID must be set before the API can accept a sign-in token.",
          },
        });
        return;
      }
      claims = await verify.verify(token);
    }

    const result = await handler({
      rawPath: req.path,
      queryStringParameters: req.query,
      body: req.method === "GET" || req.method === "HEAD" ? null : JSON.stringify(req.body ?? {}),
      requestContext: {
        requestId: `local-${Date.now()}`,
        http: { method: req.method },
        authorizer: claims ? { jwt: { claims } } : undefined,
      },
    });
    res.status(result.statusCode);
    for (const [key, value] of Object.entries(result.headers || {})) {
      res.setHeader(key, value);
    }
    res.send(result.body);
  } catch (error) {
    logError("local request failed", error);
    const status = error?.name === "JwtExpiredError" || error?.name === "JwtInvalidSignatureError" ? 401 : 401;
    const authFailure = String(error?.message || "").toLowerCase().includes("token") || error?.name?.startsWith("Jwt");
    if (authFailure) {
      res.status(status).json({
        error: { code: "AUTH_REQUIRED", message: "The sign-in token is missing, expired, or not from this user pool." },
      });
      return;
    }
    res.status(500).json({
      error: { code: "INTERNAL", message: "The local API failed. Check the server log for the error name." },
    });
  }
});

app.use((error, _req, res, _next) => {
  if (error?.type === "entity.parse.failed") {
    res.status(400).json({
      error: { code: "INVALID_JSON", message: "Request body must be valid JSON." },
    });
    return;
  }
  logError("local parser failed", error);
  res.status(500).json({
    error: { code: "INTERNAL", message: "The local API failed before the route ran." },
  });
});

app.listen(port, () => {
  logInfo("northline api listening", { port });
});
