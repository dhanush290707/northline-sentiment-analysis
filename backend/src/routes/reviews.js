import { randomUUID } from "node:crypto";
import { threshold } from "../config.js";
import { AppError } from "../errors.js";
import { toPublicReview } from "../mappers.js";
import { requireUser } from "../services/auth.js";
import { analyzeReview } from "../services/comprehend.js";
import {
  createReviewRecord,
  getProductItem,
  getProfile,
  hasReviewed,
  queryProductReviews,
  userHasPurchased,
} from "../services/dynamo.js";
import { decideEscalation } from "../services/escalation.js";
import { publishEscalation } from "../services/notify.js";
import { logInfo } from "../utils/logger.js";
import { json, parseBody } from "../utils/response.js";
import { validateRating, validateReviewText } from "../utils/validation.js";

export async function listReviews(event, user) {
  const productId = event.pathParameters.id;
  const product = await getProductItem(productId);
  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "That product is not in the catalog.");
  }
  const reviews = await queryProductReviews(productId);
  return json(200, {
    reviews: reviews.map((review) => ({
      ...toPublicReview(review),
      mine: Boolean(user && review.userId === user.userId),
    })),
  });
}

export async function createReview(event, user) {
  const current = requireUser(user);
  const productId = event.pathParameters.id;
  const body = parseBody(event);
  const reviewText = validateReviewText(body.reviewText ?? body.text);
  const rating = validateRating(body.rating);

  const product = await getProductItem(productId);
  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "That product is not in the catalog.");
  }
  if (await hasReviewed(current.userId, productId)) {
    throw new AppError(409, "DUPLICATE_REVIEW", "You have already reviewed this product.");
  }
  const purchased = await userHasPurchased(current.userId, productId);
  if (!purchased) {
    throw new AppError(
      403,
      "PURCHASE_REQUIRED",
      "Order this product before reviewing it. Feedback is tied to a completed checkout.",
    );
  }

  const analysis = await analyzeReview(reviewText);
  const routing = decideEscalation(
    analysis.sentiment,
    { Negative: analysis.negativeScore },
    threshold(),
  );
  const profile = await getProfile(current.userId);
  const authorName = profile?.displayName || current.email || "Customer";
  const review = {
    reviewId: randomUUID(),
    productId,
    productName: product.name,
    userId: current.userId,
    userEmail: profile?.email || current.email || "",
    authorName,
    reviewText,
    rating,
    createdAt: new Date().toISOString(),
    language: analysis.language,
    languageScore: analysis.languageScore,
    sentiment: analysis.sentiment,
    positiveScore: analysis.positiveScore,
    negativeScore: analysis.negativeScore,
    neutralScore: analysis.neutralScore,
    mixedScore: analysis.mixedScore,
    aspects: analysis.aspects,
    targetedSentimentStatus: analysis.targetedSentimentStatus,
    targetedErrorName: analysis.targetedErrorName,
    escalationStatus: routing.escalationStatus,
    priority: routing.priority,
  };

  await createReviewRecord(review);
  await publishEscalation(review);
  logInfo("review analyzed", {
    reviewId: review.reviewId,
    productId,
    sentiment: review.sentiment,
    escalationStatus: review.escalationStatus,
    language: review.language,
    targetedSentimentStatus: review.targetedSentimentStatus,
  });

  return json(201, {
    review: toPublicReview(review),
    message: "Thanks. Your review is published.",
  });
}
