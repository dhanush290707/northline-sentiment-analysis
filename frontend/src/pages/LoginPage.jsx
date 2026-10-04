import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { authConfigured, cognitoMessage, signIn } from "../services/auth.js";

export function LoginPage() {
  const { establish, user } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const next = params.get("next") || "/";

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const profile = await signIn(email.trim(), password);
      await establish(profile);
      navigate(profile.isAdmin && next === "/" ? "/admin" : next);
    } catch (err) {
      setError(cognitoMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-card" onSubmit={onSubmit}>
      <p className="eyebrow">Account</p>
      <h1>Sign in</h1>
      <p className="muted">Customers shop and review. Shop owners land on the desk.</p>
      {!authConfigured() && (
        <div className="callout">
          Cognito is not configured. Set VITE_USER_POOL_ID and VITE_USER_POOL_CLIENT_ID in frontend/.env. The app client must not have a secret.
        </div>
      )}
      {user && <p className="muted">You are already signed in as {user.email}.</p>}
      <label className="field">
        Email
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="username" />
      </label>
      <label className="field">
        Password
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" />
      </label>
      {error && <div className="banner error" role="alert">{error}</div>}
      <button className="button wide" type="submit" disabled={submitting || !authConfigured()}>{submitting ? "Signing in…" : "Sign in"}</button>
      <p style={{ marginTop: 14 }}>New here? <Link to="/register">Create an account</Link></p>
    </form>
  );
}
