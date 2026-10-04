# Security

## Credentials

- No AWS access keys, secret keys, or session tokens are written in source or in the React bundle.
- `backend/.env` and `frontend/.env` are gitignored. The examples contain empty identifiers only.
- Lambda uses its IAM role. Local development uses the AWS SDK default credential chain.
- The Cognito app client is created with `GenerateSecret: false`. The pool id and client id are public configuration, not secrets.

## Authorization

API Gateway validates the Cognito access token on every route except `GET /health`, `GET /products`, `GET /products/{id}`, and `GET /products/{id}/reviews`.

[backend/src/services/auth.js](../backend/src/services/auth.js) reads `sub` and `cognito:groups` from the authorizer claims. `/admin` routes call `requireAdmin`. A customer who only hides the desk in the browser still receives 403. The frontend admin check is only there to avoid a confusing page.

Profile email is whatever the signed-in user saves. It is not used to decide who is an admin.

## Validation

Review length, rating, quantities, shipping fields, and status values are checked in [backend/src/utils/validation.js](../backend/src/utils/validation.js) before any AWS call. A review is also refused unless that user has an order containing the product, and a lock item prevents a second review.

## Data exposed to customers

Product JSON omits sentiment counters. Review JSON omits scores, language analysis, email, escalation, and priority. Admin responses include the original text, the user id, the stored email, and the scores.

## Logging

Logs include the error name, review id, sentiment, and language code. They do not include the credential environment or the full review text. Unhandled errors return a generic message and keep the stack in CloudWatch.

## Headers and hosting

The HTTP API allows the `authorization` and `content-type` headers. The S3 bucket blocks public access. CloudFront, when enabled, uses origin access control rather than a public bucket policy.

## Least privilege

The API role's extra permissions are the three Comprehend detect actions and the one table. The pre-sign-up function has no AWS SDK calls. It only sets `autoConfirmUser` and `autoVerifyEmail` on the Cognito event.
