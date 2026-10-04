import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { StatusBadge, ErrorBlock, LoadingBlock } from "../../components/StateViews.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { api } from "../../services/api.js";
import { formatScore, formatWhen, stars } from "../../utils/format.js";

export function ReviewDetailPage() {
  const { reviewId } = useParams();
  const [params] = useSearchParams();
  const productId = params.get("productId") || "";
  const toast = useToast();
  const [priority, setPriority] = useState("");
  const [saving, setSaving] = useState(false);
  const state = useAsync(() => {
    if (!productId) return Promise.reject(new Error("This review link is missing productId."));
    return api(`/admin/reviews/${reviewId}?productId=${encodeURIComponent(productId)}`, { auth: true });
  }, [reviewId, productId]);

  async function update(escalationStatus, nextPriority) {
    setSaving(true);
    try {
      await api(`/admin/reviews/${reviewId}/status`, {
        method: "PATCH",
        auth: true,
        body: {
          productId,
          escalationStatus,
          priority: nextPriority || priority || state.data.review.priority,
        },
      });
      toast.push("Review updated.");
      state.reload();
    } catch (error) {
      toast.push(error.message, "error");
    } finally {
      setSaving(false);
    }
  }

  if (state.loading) return <LoadingBlock label="Opening the review" />;
  if (state.error) return <ErrorBlock error={state.error} />;
  const review = state.data.review;
  const chosenPriority = priority || review.priority;

  return (
    <>
      <p className="eyebrow"><Link to="/admin/reviews">Reviews</Link></p>
      <div className="page-title">
        <h1>{review.productName}</h1>
        <StatusBadge value={review.escalationStatus} />
      </div>
      <div className="charts">
        <article className="panel">
          <div className="row-between">
            <span className="stars">{stars(review.rating)}</span>
            <span className="muted">{formatWhen(review.createdAt)}</span>
          </div>
          <p style={{ marginTop: 12, fontSize: 18 }}>{review.text}</p>
          <p className="muted" style={{ marginTop: 12 }}>{review.authorName} · {review.userEmail || "email not stored"}</p>
          <p className="muted">Language {review.language} ({formatScore(review.languageScore)})</p>
        </article>
        <article className="panel">
          <h3>Comprehend scores</h3>
          <p><StatusBadge value={review.sentiment} /></p>
          <Score label="Positive" value={review.positiveScore} tone="pos" />
          <Score label="Negative" value={review.negativeScore} tone="neg" />
          <Score label="Neutral" value={review.neutralScore} tone="" />
          <Score label="Mixed" value={review.mixedScore} tone="mix" />
          <p className="muted">Targeted sentiment: {review.targetedSentimentStatus}{review.targetedErrorName ? ` (${review.targetedErrorName})` : ""}</p>
          <div className="aspects">
            {(review.aspects || []).map((aspect) => (
              <span key={`${aspect.text}-${aspect.sentiment}`} className="aspect">
                {aspect.text} · {aspect.sentiment} · {formatScore(aspect.negativeScore)} negative
              </span>
            ))}
          </div>
          {review.aspects?.length === 0 && <p className="muted">No aspect sentiments were returned.</p>}
        </article>
      </div>
      <div className="panel" style={{ marginTop: 16 }}>
        <h3>Escalation</h3>
        <p className="muted">Priority <StatusBadge value={review.priority} />. Changing status here is shop logic. It does not call Comprehend again.</p>
        <label className="field" style={{ maxWidth: 220 }}>
          Priority
          <select value={chosenPriority} onChange={(event) => setPriority(event.target.value)}>
            {["HIGH", "MEDIUM", "LOW"].map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <div className="status-actions">
          <button className="button" type="button" disabled={saving} onClick={() => update("IN_REVIEW", chosenPriority)}>Mark reviewed</button>
          <button className="button copper" type="button" disabled={saving} onClick={() => update("RESOLVED", chosenPriority)}>Mark resolved</button>
          <button className="ghost" type="button" disabled={saving} onClick={() => update("ESCALATED", "HIGH")}>Escalate</button>
          <button className="ghost" type="button" disabled={saving} onClick={() => update(review.escalationStatus, chosenPriority)}>Save priority</button>
        </div>
      </div>
      <aside className="callout">
        If this review uses domain language — battery backup, HDR, night mode, ANC, transparency mode — compare the sentence with the scores. A wrong label is a Comprehend limitation, not an escalation rule. Hindi can receive a document sentiment. Targeted aspects are requested only for English.
      </aside>
    </>
  );
}

function Score({ label, value, tone }) {
  return (
    <div className="score-row">
      <span style={{ width: 80 }}>{label}</span>
      <div className="score-track"><div className={`score-fill ${tone}`} style={{ width: formatScore(value) }} /></div>
      <strong>{formatScore(value)}</strong>
    </div>
  );
}
