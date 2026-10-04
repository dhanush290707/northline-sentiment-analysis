import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
} from "amazon-cognito-identity-js";

export function authConfigured() {
  return Boolean(import.meta.env.VITE_USER_POOL_ID && import.meta.env.VITE_USER_POOL_CLIENT_ID);
}

function pool() {
  if (!authConfigured()) {
    throw new Error("Set VITE_USER_POOL_ID and VITE_USER_POOL_CLIENT_ID before signing in.");
  }
  return new CognitoUserPool({
    UserPoolId: import.meta.env.VITE_USER_POOL_ID,
    ClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
  });
}

function parseGroups(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  return String(raw)
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .split(/[,\s]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function sessionProfile(session) {
  const access = session.getAccessToken().getJwtToken();
  const idPayload = session.getIdToken().payload || {};
  const accessPayload = session.getAccessToken().payload || {};
  const groups = parseGroups(accessPayload["cognito:groups"]);
  return {
    accessToken: access,
    email: idPayload.email || "",
    name: idPayload.name || "",
    userId: accessPayload.sub,
    isAdmin: groups.includes("admins"),
  };
}

export function signIn(email, password) {
  const user = new CognitoUser({ Username: email, Pool: pool() });
  return new Promise((resolve, reject) => {
    user.authenticateUser(new AuthenticationDetails({ Username: email, Password: password }), {
      onSuccess: (session) => resolve(sessionProfile(session)),
      onFailure: reject,
    });
  });
}

export function signUp({ email, password, name }) {
  return new Promise((resolve, reject) => {
    pool().signUp(
      email,
      password,
      [
        new CognitoUserAttribute({ Name: "email", Value: email }),
        new CognitoUserAttribute({ Name: "name", Value: name }),
      ],
      null,
      (error, result) => (error ? reject(error) : resolve(result)),
    );
  });
}

export function confirmSignUp(email, code) {
  const user = new CognitoUser({ Username: email, Pool: pool() });
  return new Promise((resolve, reject) => {
    user.confirmRegistration(code, true, (error, result) => (error ? reject(error) : resolve(result)));
  });
}

export function restoreSession() {
  if (!authConfigured()) return Promise.resolve(null);
  const user = pool().getCurrentUser();
  if (!user) return Promise.resolve(null);
  return new Promise((resolve) => {
    user.getSession((error, session) => {
      if (error || !session?.isValid()) {
        resolve(null);
        return;
      }
      resolve(sessionProfile(session));
    });
  });
}

export function signOut() {
  if (!authConfigured()) return;
  pool().getCurrentUser()?.signOut();
}

export function cognitoMessage(error) {
  const code = error?.code || error?.name;
  if (code === "UserNotConfirmedException") return "Confirm the email code before signing in.";
  if (code === "NotAuthorizedException") return "The email or password was not accepted.";
  if (code === "UsernameExistsException") return "An account with that email already exists.";
  if (code === "InvalidPasswordException") return "Use at least 8 characters with upper case, lower case, and a number.";
  if (code === "CodeMismatchException") return "That confirmation code does not match.";
  return error?.message || "Sign-in failed.";
}
