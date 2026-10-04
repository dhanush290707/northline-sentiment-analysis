import "dotenv/config";
import {
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";
import { catalog } from "../src/data/catalog.js";
import { ensureGlobalStats, putCatalogProduct } from "../src/services/dynamo.js";

async function seedCatalog() {
  let created = 0;
  let existing = 0;
  for (const product of catalog) {
    const result = await putCatalogProduct(product);
    if (result === "created") created += 1;
    else existing += 1;
  }
  await ensureGlobalStats();
  console.log(`Catalog seed finished. created=${created} alreadyPresent=${existing}`);
}

async function seedAdmin() {
  const userPoolId = process.env.USER_POOL_ID;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!userPoolId || !email || !password) {
    console.log("Skipped admin user. Set USER_POOL_ID, ADMIN_EMAIL, and ADMIN_PASSWORD to create the shop owner.");
    return;
  }

  const client = new CognitoIdentityProviderClient({});
  try {
    await client.send(
      new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: email,
        MessageAction: "SUPPRESS",
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "email_verified", Value: "true" },
          { Name: "name", Value: "Shop Owner" },
        ],
      }),
    );
    console.log(`Created admin user ${email}`);
  } catch (error) {
    if (error.name === "UsernameExistsException") {
      console.log(`Admin user ${email} already exists. Updating the password and group.`);
    } else {
      console.error(
        `Could not create the admin user (${error.name}). In AWS Academy this API is sometimes blocked. Create the user in the Cognito console, mark the email verified, set a permanent password, and add the user to the admins group.`,
      );
      return;
    }
  }

  await client.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: email,
      Password: password,
      Permanent: true,
    }),
  );
  await client.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: userPoolId,
      Username: email,
      GroupName: "admins",
    }),
  );
  console.log(`Admin ${email} is in the admins group.`);
}

try {
  await seedCatalog();
  await seedAdmin();
} catch (error) {
  console.error(`Seed failed (${error.name || "Error"}): ${error.message}`);
  process.exitCode = 1;
}
