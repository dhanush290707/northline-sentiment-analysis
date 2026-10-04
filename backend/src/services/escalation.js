/**
 * Application routing on top of Comprehend's sentiment result.
 * Comprehend does not escalate feedback. This function does.
 */
export function decideEscalation(sentiment, scores, threshold) {
  const negativeScore = Number(scores?.Negative ?? scores?.negativeScore ?? 0);
  if (sentiment === "NEGATIVE" && negativeScore >= threshold) {
    return { escalationStatus: "ESCALATED", priority: "HIGH" };
  }
  if (sentiment === "NEGATIVE") {
    return { escalationStatus: "OPEN", priority: "MEDIUM" };
  }
  if (sentiment === "MIXED") {
    return { escalationStatus: "OPEN", priority: "LOW" };
  }
  return { escalationStatus: "NONE", priority: "LOW" };
}

export function countsForSentiment(sentiment) {
  return {
    positive: sentiment === "POSITIVE" ? 1 : 0,
    negative: sentiment === "NEGATIVE" ? 1 : 0,
    neutral: sentiment === "NEUTRAL" ? 1 : 0,
    mixed: sentiment === "MIXED" ? 1 : 0,
  };
}
