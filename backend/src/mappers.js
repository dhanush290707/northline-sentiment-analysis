function average(item) {
  if (!item.reviewCount) return null;
  return Math.round((item.ratingSum / item.reviewCount) * 10) / 10;
}

export function toPublicProduct(item) {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    priceCents: item.priceCents,
    summary: item.summary,
    description: item.description,
    specs: item.specs || [],
    accent: item.accent,
    motif: item.motif,
    stock: item.stock ?? 0,
    ratingAverage: average(item),
    reviewCount: item.reviewCount || 0,
  };
}

export function toAdminProduct(item) {
  const reviewCount = item.reviewCount || 0;
  const negative = item.negativeCount || 0;
  return {
    ...toPublicProduct(item),
    positive: item.positiveCount || 0,
    negative,
    neutral: item.neutralCount || 0,
    mixed: item.mixedCount || 0,
    escalated: item.escalatedCount || 0,
    negativeRatio: reviewCount ? Math.round((negative / reviewCount) * 1000) / 1000 : 0,
  };
}

export function toPublicReview(item) {
  return {
    reviewId: item.reviewId,
    productId: item.productId,
    rating: item.rating,
    text: item.reviewText,
    createdAt: item.createdAt,
    authorName: item.authorName || "Customer",
  };
}

export function toAdminReview(item) {
  return {
    reviewId: item.reviewId,
    productId: item.productId,
    productName: item.productName,
    userId: item.userId,
    authorName: item.authorName || "Customer",
    userEmail: item.userEmail || "",
    rating: item.rating,
    text: item.reviewText,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt || null,
    language: item.language,
    languageScore: item.languageScore,
    sentiment: item.sentiment,
    positiveScore: item.positiveScore,
    negativeScore: item.negativeScore,
    neutralScore: item.neutralScore,
    mixedScore: item.mixedScore,
    aspects: item.aspects || [],
    targetedSentimentStatus: item.targetedSentimentStatus,
    targetedErrorName: item.targetedErrorName || null,
    escalationStatus: item.escalationStatus,
    priority: item.priority,
  };
}

export function toOrder(item) {
  return {
    orderId: item.orderId,
    items: item.items,
    shipping: item.shipping,
    totalCents: item.totalCents,
    status: item.status,
    createdAt: item.createdAt,
  };
}
