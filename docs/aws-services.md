# AWS services

| Service | Role in Northline | Where it is defined |
| --- | --- | --- |
| Amazon Cognito | Email sign-up and sign-in. Groups `customers` and `admins`. A pre-sign-up function confirms the user so the lab does not need SES. | `UserPool`, `UserPoolClient`, `PreSignupFunction` in [infrastructure/template.yaml](../infrastructure/template.yaml) |
| API Gateway HTTP API | Public catalog routes and JWT-protected customer and admin routes. | `HttpApi` and the `ApiFunction` events |
| AWS Lambda | The shop API, plus the small pre-sign-up confirmer. Node.js 20, x86_64. | `ApiFunction`, `PreSignupFunction` |
| Amazon DynamoDB | One on-demand table and three GSIs. | `AppTable` |
| Amazon Comprehend | Language detection, document sentiment, and English targeted sentiment. | IAM on `ApiFunction`; calls in [backend/src/services/comprehend.js](../backend/src/services/comprehend.js) |
| Amazon S3 | Private bucket for the production frontend build. | `FrontendBucket` |
| Amazon CloudFront | Optional CDN in front of that bucket. | `FrontendDistribution`, parameter `EnableCloudFront` |
| Amazon CloudWatch Logs | Lambda logs. The default SAM execution role writes them. The application logs the route, review id, sentiment, and error name. It does not log credentials. | [backend/src/utils/logger.js](../backend/src/utils/logger.js) |

## IAM for the API function

The function can read and write the one DynamoDB table (the SAM `DynamoDBCrudPolicy` includes its indexes) and can call:

- `comprehend:DetectSentiment`
- `comprehend:DetectDominantLanguage`
- `comprehend:DetectTargetedSentiment`

Comprehend does not support resource-level permissions for these actions, so the resource is `*`. No other AWS API is granted.

## Learner Lab limits

- Session credentials expire. Refresh `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_SESSION_TOKEN`. Do not copy them into git.
- `AdminCreateUser` is sometimes denied. The seed script prints the error name and [deployment.md](deployment.md) has the console steps.
- CloudFront is optional. Leave `EnableCloudFront` at `false` if the lab blocks it.
- Targeted sentiment can return `AccessDeniedException`. The review is still stored with `targetedSentimentStatus: UNAVAILABLE` and the error name. Document sentiment is not replaced with a guess.
- These actions are not required and are not in the template: EC2, ECS, EKS, RDS, SageMaker, Bedrock.

## Local credentials

The AWS SDK uses the default provider chain. Region comes from `AWS_REGION`. There is no hardcoded key in the frontend or the backend.
