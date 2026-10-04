import { toPublicReview } from "../mappers.js";
import { requireUser } from "../services/auth.js";
import { getProfile, queryByUser, saveProfile } from "../services/dynamo.js";
import { json, parseBody } from "../utils/response.js";
import { validateProfile } from "../utils/validation.js";

export async function getMe(_event, user) {
  const current = requireUser(user);
  const profile = await getProfile(current.userId);
  return json(200, {
    user: {
      userId: current.userId,
      email: profile?.email || current.email || "",
      displayName: profile?.displayName || current.email || "Customer",
      isAdmin: current.isAdmin,
    },
  });
}

export async function updateMe(event, user) {
  const current = requireUser(user);
  const body = parseBody(event);
  const { displayName } = validateProfile(body);
  const email = typeof body.email === "string" ? body.email.trim() : current.email;
  const profile = await saveProfile({
    userId: current.userId,
    email: email || current.email,
    displayName,
  });
  return json(200, {
    user: {
      userId: profile.userId,
      email: profile.email,
      displayName: profile.displayName,
      isAdmin: current.isAdmin,
    },
  });
}

export async function listMyReviews(_event, user) {
  const current = requireUser(user);
  const reviews = await queryByUser(current.userId, "REVIEW#");
  return json(200, { reviews: reviews.map(toPublicReview) });
}
