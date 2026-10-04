/** Languages DetectSentiment documents as supported. Targeted sentiment is English only. */
export const SENTIMENT_LANGUAGES = new Set([
  "en",
  "es",
  "fr",
  "de",
  "it",
  "pt",
  "ar",
  "hi",
  "ja",
  "ko",
  "zh",
  "zh-TW",
]);

export const MIN_LANGUAGE_SCORE = 0.5;

export function languageSupport(languageCode, score) {
  if (!languageCode || typeof score !== "number" || score < MIN_LANGUAGE_SCORE) {
    return {
      ok: false,
      reason: "LOW_CONFIDENCE",
      message:
        "We couldn't read the language of this review. Rewrite it in English or Hindi.",
    };
  }
  if (!SENTIMENT_LANGUAGES.has(languageCode)) {
    return {
      ok: false,
      reason: "UNSUPPORTED_LANGUAGE",
      message: `This review couldn't be published in "${languageCode}". Write it in English, Hindi, Spanish, French, German, Italian, Portuguese, Arabic, Japanese, Korean, or Chinese. Tamil, Telugu, and most other Indian languages are not accepted.`,
    };
  }
  return { ok: true };
}
