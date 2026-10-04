# Northline

Northline is a fictional electronics shop. Customers browse, buy, and review products. Amazon Comprehend scores each review. The shop's own rules escalate strongly negative feedback, and the shop owner reads that analysis on a private desk.

The store is not Amazon or Flipkart, and it does not use their names, logos, or assets.

## What you can demo

1. Open the shop, create an account, and sign in.
2. Browse, search, and filter products.
3. Add a product to the cart and place an order. Checkout records the order and does not charge a card.
4. Submit a written review with a star rating.
5. The API sends the text to Amazon Comprehend, stores the sentiment and confidence, and escalates the review when the negative score crosses the configured threshold.
6. Sign in as a shop owner and open the desk: totals, sentiment distribution, sentiment over time, product-level sentiment, the negative queue, and the original text beside the scores.
7. Mark an escalated review reviewed or resolved.

## Repository

- [frontend](frontend) — React and Vite
- [backend](backend) — one Node.js router used by Lambda and by the local API
- [infrastructure/template.yaml](infrastructure/template.yaml) — Cognito, HTTP API, Lambda, DynamoDB, S3, optional CloudFront
- [docs](docs) — architecture, data, API, sentiment, security, deployment, tests, and the problem-statement map

## Local run

Install once:

```bash
npm install --prefix backend
npm install --prefix frontend
```

Copy the examples and fill in the public identifiers from the stack outputs. Do not put secret keys in either file.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

AWS credentials stay in the environment (`aws configure`, or the Learner Lab access key, secret, and session token). The API reads the default credential chain.

```bash
npm run dev:api
npm run dev:web
```

The shop is at http://127.0.0.1:5173 and the API at http://localhost:3001.

Seed the catalog after `TABLE_NAME` points at the deployed table:

```bash
npm run seed
```

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env` if the lab allows `AdminCreateUser`. Otherwise create the shop owner in the Cognito console and add them to the `admins` group. Steps are in [docs/deployment.md](docs/deployment.md).

Unit tests do not call AWS:

```bash
npm test
```

## Sentiment, in one paragraph

Comprehend returns a label and four confidence scores. [backend/src/services/escalation.js](backend/src/services/escalation.js) applies the threshold in `NEGATIVE_ESCALATION_THRESHOLD` (default `0.75`). A negative review at or above that score is `ESCALATED` with priority `HIGH`. Comprehend does not escalate anything. Languages outside Comprehend's document-sentiment set are rejected with HTTP 422. Targeted aspect sentiment is requested only for English. Details are in [docs/sentiment-analysis.md](docs/sentiment-analysis.md).

## Problem statement

24CC3014-P072, Amazon Comprehend Sentiment Analysis on Customer Feedback. The mapping of each requirement to code is in [docs/problem-statement-mapping.md](docs/problem-statement-mapping.md).
