# Deployment

Tested path: AWS SAM. The template is [infrastructure/template.yaml](../infrastructure/template.yaml). It expects the SAM CLI and credentials that can create Cognito, Lambda, API Gateway, DynamoDB, and S3. CloudFront stays off unless you opt in.

## Deploy

From the repository root, with lab credentials exported:

```bash
npm install --prefix backend
sam build -t infrastructure/template.yaml
sam deploy -t infrastructure/template.yaml --guided --stack-name northline
```

Accept the defaults, including `EnableCloudFront=false` and `NegativeEscalationThreshold=0.75`. SAM saves `samconfig.toml`. Do not commit account-specific config if it contains anything private. The guided deploy will ask to acknowledge IAM changes because the function role allows the three Comprehend actions.

Copy the outputs into the env files:

```text
backend/.env
  AWS_REGION
  TABLE_NAME          <- TableName output
  USER_POOL_ID
  USER_POOL_CLIENT_ID
  NEGATIVE_ESCALATION_THRESHOLD=0.75

frontend/.env
  VITE_AWS_REGION
  VITE_USER_POOL_ID
  VITE_USER_POOL_CLIENT_ID
  VITE_API_BASE_URL   <- ApiUrl output, no trailing slash
```

Seed the twelve products:

```bash
npm run seed
```

## Shop owner

With `ADMIN_EMAIL` and `ADMIN_PASSWORD` set, the seed script calls `AdminCreateUser`, sets a permanent password, and adds the user to `admins`.

If that call is denied, use the Cognito console:

1. Open the user pool from the stack output.
2. Create a user with the email, mark the email verified, and set a permanent password.
3. Add the user to the group `admins`.
4. Sign in on the shop with that email. The desk link appears only when the access token contains `admins`. The API still checks the group.

Customer accounts are created from the Register page. The pre-sign-up Lambda confirms them, so no verification email is sent.

## Frontend hosting

Development:

```bash
npm run dev:web
```

Production build:

```bash
npm run build --prefix frontend
```

To publish through CloudFront, redeploy with `EnableCloudFront=true`, then:

```bash
aws s3 sync frontend/dist "s3://<FrontendBucket>" --delete
```

The distribution rewrites 403 and 404 to `index.html` so client-side routes work. If the lab cannot create CloudFront, keep using `npm run dev:web` or `npx vite preview --prefix frontend` pointed at the deployed API. The bucket is private on purpose. New AWS accounts block public website hosting, and a public bucket is not required for the demo.

## Learner Lab credential refresh

When the lab session rotates, export the new access key, secret, and session token, then restart `npm run dev:api`. The code does not cache keys in a file.

## Changing the threshold

Set `NEGATIVE_ESCALATION_THRESHOLD` on the Lambda (a stack parameter) and in `backend/.env` for local runs. Redeploy or restart. Reviews already stored keep the status they were given.
