import { AppError } from "./errors.js";

export function threshold() {
  const raw = process.env.NEGATIVE_ESCALATION_THRESHOLD;
  const value = raw === undefined || raw === "" ? 0.75 : Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    return 0.75;
  }
  return value;
}

export function tableName() {
  const name = process.env.TABLE_NAME;
  if (!name) {
    throw new AppError(
      503,
      "CONFIGURATION_ERROR",
      "TABLE_NAME is not set. Point the API at the Northline DynamoDB table before using this route.",
    );
  }
  return name;
}

export function allowedOrigin() {
  return process.env.ALLOWED_ORIGIN || "*";
}
