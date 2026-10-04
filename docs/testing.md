# Testing

## Automated

From the repository root:

```bash
npm test
```

These tests do not call AWS. They cover:

- Escalation at the threshold, under it, and for mixed, positive, and neutral labels
- Empty, short, and oversized reviews, ratings, carts, and status updates
- English and Hindi accepted; Tamil and Telugu rejected; low language confidence rejected
- `/health`, unknown routes, a missing `TABLE_NAME`, anonymous review submission, and a customer token on `/admin/dashboard`

A missing table returns `CONFIGURATION_ERROR`. The handler does not invent products or sentiment.

## Live demo script

Use two accounts: a customer created on the Register page, and the shop owner in the `admins` group. Place an order before reviewing. Submit these through the product page so Comprehend, not a fixture, produces the scores.

Positive, on Arc 7 or Field Cam:

```text
Excellent phone. The camera quality is amazing.
```

Negative, expect escalation when the negative score is at least 0.75:

```text
The battery is terrible and the phone overheats.
```

Neutral:

```text
The phone arrived yesterday. I have used it for one day.
```

Mixed, expect `OPEN` rather than automatic escalation:

```text
The display is excellent but the battery life is disappointing.
```

Domain language, on Harbor ANC. Read the original sentence next to the scores on the desk. Do not treat a surprising label as a bug in the escalation rule.

```text
ANC is excellent but transparency mode has noticeable latency.
```

Two more domain lines worth trying on Field Cam and Arc 7:

```text
Battery backup is terrible after three charge cycles.
```

```text
The camera has good HDR but night mode is noisy.
```

Hindi. Document sentiment should run. Targeted sentiment should be `SKIPPED_NOT_ENGLISH`.

```text
यह फोन अच्छा है लेकिन बैटरी खराब है।
```

Unsupported language. Expect HTTP 422 and no stored review. Tamil example:

```text
இந்த போன் நல்லா இருக்கு ஆனா பேட்டரி சரியில்ல.
```

## What to click as the shop owner

1. Desk overview: product count, review count, four sentiment totals, escalated count.
2. The distribution bar and the daily chart.
3. A product row, then that product's sentiment page.
4. Negative, from the desk navigation.
5. Open one review and compare the text, the four scores, the aspects, and the escalation status.
6. Mark it reviewed, then resolved. The escalated total drops when a review leaves `ESCALATED`.

## Failure cases worth showing

- Submit an empty review. The form and the API both refuse it.
- Submit before ordering. The API returns `PURCHASE_REQUIRED`.
- Stop the API, or remove `TABLE_NAME`. The page shows the configuration or network message.
- Call `GET /admin/dashboard` with the customer access token. The status is 403.
