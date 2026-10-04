import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Protected } from "../components/Protected.jsx";
import { ErrorBlock, LoadingBlock } from "../components/StateViews.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { api } from "../services/api.js";
import { formatWhen, stars } from "../utils/format.js";

export function ProfilePage() {
  return (
    <Protected>
      <ProfileBody />
    </Protected>
  );
}

function ProfileBody() {
  const { user } = useAuth();
  const toast = useToast();
  const me = useAsync(() => api("/me", { auth: true }), []);
  const reviews = useAsync(() => api("/me/reviews", { auth: true }), []);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (me.data?.user?.displayName) setDisplayName(me.data.user.displayName);
  }, [me.data]);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api("/me", {
        method: "PUT",
        auth: true,
        body: { displayName, email: me.data?.user?.email || user.email },
      });
      toast.push("Profile saved.");
      me.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page" style={{ paddingTop: 32 }}>
      <p className="eyebrow">{user.isAdmin ? "Shop owner" : "Customer"}</p>
      <h1>Profile</h1>
      {me.loading && <LoadingBlock label="Loading profile" />}
      {me.error && <ErrorBlock error={me.error} />}
      {me.data && (
        <form className="panel" onSubmit={save} style={{ maxWidth: 480, marginTop: 16 }}>
          <p className="muted">{me.data.user.email || user.email}</p>
          <label className="field">
            Display name
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} minLength={2} maxLength={60} required />
          </label>
          {error && <ErrorBlock error={{ message: error }} />}
          <button className="button" disabled={saving} type="submit">{saving ? "Saving…" : "Save"}</button>
        </form>
      )}
      <section className="section">
        <h2>Your reviews</h2>
        {reviews.loading && <p className="muted">Loading reviews…</p>}
        {reviews.error && <ErrorBlock error={reviews.error} />}
        {(reviews.data?.reviews || []).length === 0 && !reviews.loading && <p className="muted">You have not published a review.</p>}
        {(reviews.data?.reviews || []).map((review) => (
          <article key={review.reviewId} className="review">
            <div className="row-between">
              <Link to={`/products/${review.productId}`}>{stars(review.rating)}</Link>
              <span className="muted">{formatWhen(review.createdAt)}</span>
            </div>
            <p>{review.text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
