# API

Base URL: the `ApiUrl` stack output, or `http://localhost:3001` locally.

JSON in and out. Errors look like:

```json
{ "error": { "code": "EMPTY_REVIEW", "message": "The review text is empty." } }
```

Protected routes need `Authorization: Bearer <Cognito access token>`. The access token carries `cognito:groups`. API Gateway's JWT authorizer checks the token's `client_id` against the app client id. The Lambda checks the group again for `/admin`.

## Public

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Process is up. Does not touch AWS. |
| GET | `/products` | Catalog. Query `q` and `category`. |
| GET | `/products/{id}` | One product. Sentiment counts are omitted. |
| GET | `/products/{id}/reviews` | Published reviews: author, stars, text, time. No scores. |

## Signed-in customer

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/me` | Profile and `isAdmin`, derived from the token. |
| PUT | `/me` | Body `{ displayName, email }`. Email is display data. Authorization is the token `sub`. |
| GET | `/me/reviews` | Reviews written by the caller. |
| POST | `/orders` | Body `{ items: [{ productId, quantity }], shipping: { fullName, line1, city, region, postalCode } }`. |
| GET | `/orders` | The caller's orders, newest first. |
| GET | `/orders/{id}` | One order. Another customer's id returns 404. |
| POST | `/products/{id}/reviews` | Body `{ rating, reviewText }`. Requires a prior order that contains the product. |

## Shop owner

The token must include the Cognito group `admins`. A customer token receives 403 `ADMIN_REQUIRED`. A missing token receives 401.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/admin/dashboard` | Totals, threshold, per-product sentiment, daily trend, recent escalations. |
| GET | `/admin/reviews` | Query `sentiment` and `escalationStatus`. |
| GET | `/admin/reviews/negative` | Reviews whose Comprehend label is `NEGATIVE`. |
| GET | `/admin/reviews/{reviewId}?productId=` | Full analysis for one review. |
| PATCH | `/admin/reviews/{reviewId}/status` | Body `{ productId, escalationStatus, priority }`. Does not call Comprehend again. |
| GET | `/admin/products/{id}/sentiment` | One product's counters and its reviews, with scores. |

`escalationStatus` is one of `ESCALATED`, `OPEN`, `IN_REVIEW`, `RESOLVED`, `NONE`. `priority` is `HIGH`, `MEDIUM`, or `LOW`.

## Status codes

| Code | When |
| --- | --- |
| 400 | Empty, short, or oversized review. Bad rating, cart, address, or status. Invalid JSON. |
| 401 | Missing or invalid token. |
| 403 | Customer calling an admin route, or a review before purchase. |
| 404 | Unknown product, order, review, or route. |
| 409 | Second review of the same product, or not enough stock. |
| 422 | Language not supported, or language detection below 0.5 confidence. `details.language` is included when Comprehend detected one. |
| 503 | Missing table name, DynamoDB unreachable, or Comprehend failed. Nothing is invented in these cases. |

Review text must be 10 to 4,500 characters and at most 5,000 UTF-8 bytes, which is Comprehend's document limit.
