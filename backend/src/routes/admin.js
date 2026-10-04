import { threshold } from "../config.js";
import { AppError } from "../errors.js";
import { toAdminProduct, toAdminReview } from "../mappers.js";
import { requireAdmin } from "../services/auth.js";
import { publishEscalation } from "../services/notify.js";
import {
  findReview,
  getGlobalStats,
  getProductItem,
  queryProductReviews,
  queryProducts,
  queryReviewIndex,
  updateReviewStatus,
} from "../services/dynamo.js";
import { json, parseBody } from "../utils/response.js";
import { validateStatusUpdate } from "../utils/validation.js";

function dayKey(iso) {
  return iso.slice(0, 10);
}

function buildTrend(reviews) {
  const buckets = new Map();
  for (const review of reviews) {
    const date = dayKey(review.createdAt);
    if (!buckets.has(date)) {
      buckets.set(date, { date, POSITIVE: 0, NEGATIVE: 0, NEUTRAL: 0, MIXED: 0 });
    }
    const bucket = buckets.get(date);
    if (bucket[review.sentiment] !== undefined) bucket[review.sentiment] += 1;
  }
  return [...buckets.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export async function dashboard(_event, user) {
  requireAdmin(user);
  const [stats, products, recent] = await Promise.all([
    getGlobalStats(),
    queryProducts(),
    queryReviewIndex({ index: "gsi2", pk: "ENTITY#REVIEW", limit: 200 }),
  ]);
  const adminProducts = products.map(toAdminProduct).sort((a, b) => b.negativeRatio - a.negativeRatio || b.reviewCount - a.reviewCount);
  const escalated = recent.filter((review) => review.escalationStatus === "ESCALATED");
  return json(200, {
    threshold: threshold(),
    totals: {
      products: products.length,
      reviews: stats.totalReviews || 0,
      positive: stats.positive || 0,
      negative: stats.negative || 0,
      neutral: stats.neutral || 0,
      mixed: stats.mixed || 0,
      escalated: stats.escalated || 0,
      orders: stats.totalOrders || 0,
    },
    products: adminProducts,
    trend: buildTrend(recent),
    recentEscalations: escalated.slice(0, 8).map(toAdminReview),
  });
}

export async function adminReviews(event, user) {
  requireAdmin(user);
  const query = event.queryStringParameters || {};
  const sentiment = query.sentiment?.trim().toUpperCase() || "";
  const escalationStatus = query.escalationStatus?.trim().toUpperCase() || "";
  const allowed = new Set(["POSITIVE", "NEGATIVE", "NEUTRAL", "MIXED"]);
  if (sentiment && !allowed.has(sentiment)) {
    throw new AppError(400, "INVALID_FILTER", "sentiment must be POSITIVE, NEGATIVE, NEUTRAL, or MIXED.");
  }
  const reviews = sentiment
    ? await queryReviewIndex({ index: "gsi3", pk: `SENTIMENT#${sentiment}`, filter: { escalationStatus }, limit: 100 })
    : await queryReviewIndex({
        index: "gsi2",
        pk: "ENTITY#REVIEW",
        filter: { escalationStatus },
        limit: 100,
      });
  return json(200, { reviews: reviews.map(toAdminReview) });
}

export async function negativeReviews(_event, user) {
  requireAdmin(user);
  const reviews = await queryReviewIndex({
    index: "gsi3",
    pk: "SENTIMENT#NEGATIVE",
    limit: 100,
  });
  return json(200, { reviews: reviews.map(toAdminReview) });
}

export async function productSentiment(event, user) {
  requireAdmin(user);
  const product = await getProductItem(event.pathParameters.id);
  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "That product is not in the catalog.");
  }
  const reviews = await queryProductReviews(product.id);
  return json(200, {
    product: toAdminProduct(product),
    reviews: reviews.map(toAdminReview),
  });
}

export async function adminReview(event, user) {
  requireAdmin(user);
  const productId = event.queryStringParameters?.productId;
  if (!productId) {
    throw new AppError(400, "INVALID_REVIEW", "Pass productId to open a review.");
  }
  const review = await findReview(productId, event.pathParameters.reviewId);
  if (!review) {
    throw new AppError(404, "REVIEW_NOT_FOUND", "That review could not be found.");
  }
  return json(200, { review: toAdminReview(review) });
}

export async function updateStatus(event, user) {
  requireAdmin(user);
  const body = validateStatusUpdate(parseBody(event));
  const review = await findReview(body.productId, event.pathParameters.reviewId);
  if (!review) {
    throw new AppError(404, "REVIEW_NOT_FOUND", "That review could not be found.");
  }
  const updated = await updateReviewStatus(review, body);
  if (updated.escalationStatus === "ESCALATED" && review.escalationStatus !== "ESCALATED") {
    await publishEscalation(updated);
  }
  return json(200, { review: toAdminReview(updated) });
}
