import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { authConfigured, cognitoMessage, confirmSignUp, signIn, signUp } from "../services/auth.js";

export function RegisterPage() {
  const { establish } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [code, setCode] = useState("");
  const [needsCode, setNeedsCode] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (needsCode) {
        await confirmSignUp(form.email.trim(), code.trim());
      } else {
        const result = await signUp({ email: form.email.trim(), password: form.password, name: form.name.trim() });
        if (!result.userConfirmed) {
          setNeedsCode(true);
          setSubmitting(false);
          return;
        }
      }
      const profile = await signIn(form.email.trim(), form.password);
      await establish(profile);
      navigate("/");
    } catch (err) {
      setError(cognitoMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-card" onSubmit={onSubmit}>
      <p className="eyebrow">Account</p>
      <h1>Create an account</h1>
      <p className="muted">Password needs 8 characters, with upper case, lower case, and a number.</p>
      {!authConfigured() && (
        <div className="callout">Set the Cognito pool id and client id in frontend/.env before creating an account.</div>
      )}
      {!needsCode ? (
        <>
          <label className="field">Name<input value={form.name} onChange={(event) => update("name", event.target.value)} required minLength={2} /></label>
          <label className="field">Email<input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required /></label>
          <label className="field">Password<input type="password" value={form.password} onChange={(event) => update("password", event.target.value)} required /></label>
        </>
      ) : (
        <label className="field">
          Confirmation code
          <input value={code} onChange={(event) => setCode(event.target.value)} required />
        </label>
      )}
      {error && <div className="banner error" role="alert">{error}</div>}
      <button className="button wide" disabled={submitting || !authConfigured()} type="submit">
        {submitting ? "Working…" : needsCode ? "Confirm and sign in" : "Create account"}
      </button>
      <p style={{ marginTop: 14 }}>Already registered? <Link to="/login">Sign in</Link></p>
    </form>
  );
}
