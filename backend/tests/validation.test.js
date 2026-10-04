import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "../src/errors.js";
import {
  validateOrderItems,
  validateRating,
  validateReviewText,
  validateStatusUpdate,
} from "../src/utils/validation.js";

test("review text rejects empty, short, and oversized input", () => {
  assert.throws(() => validateReviewText("   "), (error) => error.code === "EMPTY_REVIEW");
  assert.throws(() => validateReviewText("too short"), (error) => error.code === "REVIEW_TOO_SHORT");
  assert.throws(() => validateReviewText("a".repeat(4501)), (error) => error.code === "REVIEW_TOO_LONG");
  assert.equal(validateReviewText("  The battery is terrible.  "), "The battery is terrible.");
});

test("rating must be an integer from 1 to 5", () => {
  assert.equal(validateRating(4), 4);
  assert.throws(() => validateRating(0), (error) => error instanceof AppError);
  assert.throws(() => validateRating(3.5), (error) => error.code === "INVALID_RATING");
});

test("orders reject duplicate products and bad quantities", () => {
  assert.throws(() => validateOrderItems([]), (error) => error.code === "EMPTY_CART");
  assert.throws(
    () => validateOrderItems([{ productId: "a", quantity: 1 }, { productId: "a", quantity: 1 }]),
    (error) => error.code === "INVALID_CART",
  );
  assert.deepEqual(validateOrderItems([{ productId: "nl-arc-7", quantity: 2 }]), [
    { productId: "nl-arc-7", quantity: 2 },
  ]);
});

test("status updates require a product and a known status", () => {
  assert.throws(() => validateStatusUpdate({}), (error) => error.code === "INVALID_STATUS");
  assert.deepEqual(validateStatusUpdate({ productId: "nl-arc-7", escalationStatus: "RESOLVED" }), {
    productId: "nl-arc-7",
    escalationStatus: "RESOLVED",
    priority: undefined,
  });
});
