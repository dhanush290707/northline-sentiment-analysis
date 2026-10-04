# Sentiment analysis

Amazon Comprehend classifies the review. Northline decides whether to escalate it.

## Call order

Implemented in [backend/src/services/comprehend.js](../backend/src/services/comprehend.js).

1. `DetectDominantLanguage` on the review text.
2. If the top language scores under 0.5, or is outside the supported set, respond 422 and store nothing.
3. `DetectSentiment` with that language code. Store `POSITIVE`, `NEGATIVE`, `NEUTRAL`, or `MIXED`, plus `Positive`, `Negative`, `Neutral`, and `Mixed` scores.
4. If the language is English, call `DetectTargetedSentiment`. Store each mention's text, type, sentiment, and scores. A failure sets `targetedSentimentStatus` to `UNAVAILABLE` and records `error.name` only.
5. For any other supported language, set `targetedSentimentStatus` to `SKIPPED_NOT_ENGLISH`. Aspects are left empty. They are not guessed.

The React app never calls these APIs.

## Supported document languages

`en`, `es`, `fr`, `de`, `it`, `pt`, `ar`, `hi`, `ja`, `ko`, `zh`, `zh-TW`.

Hindi (`hi`) is a real `DetectSentiment` language. Targeted sentiment is still English-only, which matches the current Comprehend API.

Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, and other languages outside the list are rejected. The message names that limitation. The API does not fall back to an English score.

## Escalation

[backend/src/services/escalation.js](../backend/src/services/escalation.js), threshold `NEGATIVE_ESCALATION_THRESHOLD` (default 0.75):

| Comprehend result | Status | Priority |
| --- | --- | --- |
| `NEGATIVE` and negative score ≥ threshold | `ESCALATED` | `HIGH` |
| `NEGATIVE` below the threshold | `OPEN` | `MEDIUM` |
| `MIXED` | `OPEN` | `LOW` |
| `POSITIVE` or `NEUTRAL` | `NONE` | `LOW` |

`OPEN` means a person should look. It is not an automatic escalation. A shop owner can later set `IN_REVIEW`, `RESOLVED`, or `ESCALATED`, and can change priority. Those actions do not call Comprehend.

The dashboard prints the threshold so the rule is visible during a demo.

## Domain language

Reviews about battery backup, HDR, night mode, ANC, and transparency mode use electronics jargon. Comprehend can mislabel them. Northline does not train a custom classifier and does not rewrite the label. The desk shows the original sentence, the document scores, and any English aspects side by side. That is how the limitation is demonstrated.

## What a stored review contains

`reviewId`, `productId`, `userId`, `reviewText`, `rating`, `createdAt`, `language`, `languageScore`, `sentiment`, `positiveScore`, `negativeScore`, `neutralScore`, `mixedScore`, `aspects`, `targetedSentimentStatus`, `escalationStatus`, `priority`.

Customers receive only the public shape: id, rating, text, time, and display name.
