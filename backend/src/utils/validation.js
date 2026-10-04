import { AppError } from "../errors.js";

const MAX_REVIEW_CHARS = 4500;

export function validateReviewText(value) {
  if (typeof value !== "string") {
    throw new AppError(400, "INVALID_REVIEW", "Write a review before submitting.");
  }
  const text = value.trim();
  if (!text) {
    throw new AppError(400, "EMPTY_REVIEW", "The review text is empty.");
  }
  if (text.length < 10) {
    throw new AppError(400, "REVIEW_TOO_SHORT", "Write at least 10 characters so the review can be analyzed.");
  }
  if (text.length > MAX_REVIEW_CHARS || Buffer.byteLength(text, "utf8") > 5000) {
    throw new AppError(
      400,
      "REVIEW_TOO_LONG",
      "The review is too long. Keep it under 4,500 characters so it fits Amazon Comprehend's 5,000-byte limit.",
    );
  }
  return text;
}

export function validateRating(value) {
  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new AppError(400, "INVALID_RATING", "Choose a star rating from 1 to 5.");
  }
  return rating;
}

export function validateShipping(shipping) {
  if (!shipping || typeof shipping !== "object") {
    throw new AppError(400, "INVALID_SHIPPING", "Add a shipping address before placing the order.");
  }
  const fields = ["fullName", "line1", "city", "region", "postalCode"];
  const cleaned = {};
  for (const field of fields) {
    const value = typeof shipping[field] === "string" ? shipping[field].trim() : "";
    if (value.length < 2 || value.length > 80) {
      throw new AppError(400, "INVALID_SHIPPING", `Enter a valid ${field}.`);
    }
    cleaned[field] = value;
  }
  return cleaned;
}

export function validateOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError(400, "EMPTY_CART", "Add at least one product before checkout.");
  }
  if (items.length > 12) {
    throw new AppError(400, "CART_TOO_LARGE", "Checkout supports up to 12 different products per order.");
  }
  const seen = new Set();
  return items.map((item) => {
    const productId = typeof item?.productId === "string" ? item.productId.trim() : "";
    const quantity = Number(item?.quantity);
    if (!productId || seen.has(productId)) {
      throw new AppError(400, "INVALID_CART", "Each product can appear once in the cart.");
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 5) {
      throw new AppError(400, "INVALID_QUANTITY", "Quantity must be a whole number from 1 to 5.");
    }
    seen.add(productId);
    return { productId, quantity };
  });
}

export function validateProfile(body) {
  const displayName = typeof body?.displayName === "string" ? body.displayName.trim() : "";
  if (displayName.length < 2 || displayName.length > 60) {
    throw new AppError(400, "INVALID_PROFILE", "Display name must be 2 to 60 characters.");
  }
  return { displayName };
}

const STATUSES = new Set(["ESCALATED", "OPEN", "IN_REVIEW", "RESOLVED", "NONE"]);
const PRIORITIES = new Set(["HIGH", "MEDIUM", "LOW"]);

export function validateStatusUpdate(body) {
  const productId = typeof body?.productId === "string" ? body.productId.trim() : "";
  if (!productId) {
    throw new AppError(400, "INVALID_STATUS", "productId is required to update a review.");
  }
  const escalationStatus = body?.escalationStatus;
  const priority = body?.priority;
  if (escalationStatus !== undefined && !STATUSES.has(escalationStatus)) {
    throw new AppError(400, "INVALID_STATUS", "escalationStatus is not one of the allowed values.");
  }
  if (priority !== undefined && !PRIORITIES.has(priority)) {
    throw new AppError(400, "INVALID_STATUS", "priority must be HIGH, MEDIUM, or LOW.");
  }
  if (escalationStatus === undefined && priority === undefined) {
    throw new AppError(400, "INVALID_STATUS", "Provide a new escalation status or priority.");
  }
  return { productId, escalationStatus, priority };
}
