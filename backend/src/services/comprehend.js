import {
  ComprehendClient,
  DetectDominantLanguageCommand,
  DetectSentimentCommand,
  DetectTargetedSentimentCommand,
} from "@aws-sdk/client-comprehend";
import { AppError } from "../errors.js";
import { languageSupport } from "../utils/languages.js";
import { logError } from "../utils/logger.js";

const client = new ComprehendClient({});

function roundScore(value) {
  const number = Number(value ?? 0);
  return Math.round(number * 10000) / 10000;
}

function scoreBlock(score) {
  return {
    positiveScore: roundScore(score?.Positive),
    negativeScore: roundScore(score?.Negative),
    neutralScore: roundScore(score?.Neutral),
    mixedScore: roundScore(score?.Mixed),
  };
}

function mapAspects(result) {
  const aspects = [];
  for (const entity of result?.Entities || []) {
    for (const mention of entity.Mentions || []) {
      if (!mention?.Text || !mention?.MentionSentiment?.Sentiment) continue;
      aspects.push({
        text: mention.Text,
        type: mention.Type || "OTHER",
        sentiment: mention.MentionSentiment.Sentiment,
        ...scoreBlock(mention.MentionSentiment.SentimentScore),
      });
    }
  }
  return aspects;
}

const CUSTOMER_PUBLISH_FAILURE = "We couldn't publish your review. Please try again.";

function mapComprehendFailure(error) {
  logError("comprehend request failed", error);
  const name = error?.name || "ComprehendError";
  if (name === "SubscriptionRequiredException") {
    return new AppError(503, "COMPREHEND_UNAVAILABLE", CUSTOMER_PUBLISH_FAILURE);
  }
  if (name === "AccessDeniedException") {
    return new AppError(503, "COMPREHEND_DENIED", CUSTOMER_PUBLISH_FAILURE);
  }
  if (name === "TextSizeLimitExceededException") {
    return new AppError(400, "REVIEW_TOO_LONG", "The review is too long to publish.");
  }
  if (name === "ThrottlingException" || name === "TooManyRequestsException") {
    return new AppError(503, "COMPREHEND_BUSY", CUSTOMER_PUBLISH_FAILURE);
  }
  if (name === "CredentialsProviderError" || name === "UnrecognizedClientException") {
    return new AppError(503, "CONFIGURATION_ERROR", CUSTOMER_PUBLISH_FAILURE);
  }
  return new AppError(503, "COMPREHEND_UNAVAILABLE", CUSTOMER_PUBLISH_FAILURE);
}

export async function analyzeReview(text) {
  let languageResult;
  try {
    languageResult = await client.send(new DetectDominantLanguageCommand({ Text: text }));
  } catch (error) {
    throw mapComprehendFailure(error);
  }

  const ranked = [...(languageResult.Languages || [])].sort((a, b) => (b.Score || 0) - (a.Score || 0));
  const top = ranked[0];
  const languageCode = top?.LanguageCode || "";
  const languageScore = roundScore(top?.Score);
  const support = languageSupport(languageCode, languageScore);
  if (!support.ok) {
    throw new AppError(422, support.reason, support.message, {
      language: languageCode || null,
      languageScore,
    });
  }

  let sentimentResult;
  try {
    sentimentResult = await client.send(
      new DetectSentimentCommand({ Text: text, LanguageCode: languageCode }),
    );
  } catch (error) {
    if (error?.name === "UnsupportedLanguageException") {
      throw new AppError(422, "UNSUPPORTED_LANGUAGE", support.message || error.message, {
        language: languageCode,
      });
    }
    throw mapComprehendFailure(error);
  }

  const analysis = {
    language: languageCode,
    languageScore,
    sentiment: sentimentResult.Sentiment,
    ...scoreBlock(sentimentResult.SentimentScore),
    aspects: [],
    targetedSentimentStatus: languageCode === "en" ? "UNAVAILABLE" : "SKIPPED_NOT_ENGLISH",
    targetedErrorName: null,
  };

  if (languageCode !== "en") {
    return analysis;
  }

  try {
    const targeted = await client.send(
      new DetectTargetedSentimentCommand({ Text: text, LanguageCode: "en" }),
    );
    analysis.aspects = mapAspects(targeted);
    analysis.targetedSentimentStatus = "OK";
  } catch (error) {
    logError("targeted sentiment unavailable", error);
    analysis.targetedSentimentStatus = "UNAVAILABLE";
    analysis.targetedErrorName = error?.name || "ComprehendError";
  }

  return analysis;
}
