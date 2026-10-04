import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { logError, logInfo } from "../utils/logger.js";

const client = new SNSClient({});

export async function publishEscalation(review) {
  if (review?.escalationStatus !== "ESCALATED") return;
  const topicArn = process.env.ESCALATION_TOPIC_ARN;
  if (!topicArn) {
    logInfo("escalation topic not configured", { reviewId: review.reviewId });
    return;
  }
  const product = review.productName || review.productId || "product";
  const subject = `Northline escalation: ${product}`.slice(0, 100);
  const message = [
    `Product: ${product}`,
    `Priority: ${review.priority || ""}`,
    `Negative score: ${review.negativeScore ?? ""}`,
    `Review: ${review.reviewText || ""}`,
  ].join("\n");
  try {
    await client.send(
      new PublishCommand({
        TopicArn: topicArn,
        Subject: subject,
        Message: message,
      }),
    );
    logInfo("escalation published", { reviewId: review.reviewId, productId: review.productId });
  } catch (error) {
    logError("escalation publish failed", error, { reviewId: review.reviewId });
  }
}
