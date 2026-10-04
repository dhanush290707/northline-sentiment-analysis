# Architecture

Northline is a browser shop, one HTTP API, and one Lambda. Amazon Comprehend is called only from that Lambda.

```text
Customer or shop owner
        |
        v
React (Vite)  ---- public pool id, client id, region, API URL
        |
        +--> Amazon Cognito (sign up, sign in, access token)
        |
        v
API Gateway HTTP API
        |
        v
Node.js Lambda (backend/src/handler.js)
        |                 \
        v                  v
DynamoDB table         Amazon Comprehend
NorthlineTable         DetectDominantLanguage
                       DetectSentiment
                       DetectTargetedSentiment (English only)
```

The same router runs locally. [backend/src/local-server.js](../backend/src/local-server.js) verifies the Cognito access token and calls [backend/src/handler.js](../backend/src/handler.js). Deployed routes let API Gateway validate the token and pass the claims through. Admin checks still run inside the Lambda, using `cognito:groups`.

## Why one Lambda

A Learner Lab account is easier to deploy and to permission with a single function. Route modules stay separate under [backend/src/routes](../backend/src/routes).

## What the browser never does

The React app does not call Comprehend, DynamoDB, or any AWS API that needs a secret. Cognito's app client is created without a client secret. Product reviews on the storefront show stars, the author's display name, and the text. Sentiment, confidence, aspects, and escalation stay on `/admin`.

## Static hosting

The template creates a private S3 bucket for the built frontend. CloudFront is off unless `EnableCloudFront=true`, because some labs cannot create distributions. Without CloudFront, run the Vite dev server or `vite preview` against the deployed API.

## Services that are intentionally absent

EC2, ECS, Kubernetes, RDS, SageMaker, and Bedrock are not used. Sentiment is Comprehend's `DetectSentiment`, not a hosted model.
