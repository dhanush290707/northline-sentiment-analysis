import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { StatusBadge, EmptyBlock, ErrorBlock, LoadingBlock } from "../../components/StateViews.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { api } from "../../services/api.js";
import { formatScore, formatWhen } from "../../utils/format.js";

export function ReviewsPage() {
  const [params, setParams] = useSearchParams();
  const sentiment = params.get("sentiment") || "";
  const escalationStatus = params.get("escalationStatus") || "";
  const toast = useToast();
  const [busyId, setBusyId] = useState("");
  const state = useAsync(
    () => api(`/admin/reviews?sentiment=${encodeURIComponent(sentiment)}&escalationStatus=${encodeURIComponent(escalationStatus)}`, { auth: true }),
    [sentiment, escalationStatus],
  );

  function updateFilter(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  async function setStatus(review, escalationStatusNext, priority) {
    setBusyId(review.reviewId);
    try {
      await api(`/admin/reviews/${review.reviewId}/status`, {
        method: "PATCH",
        auth: true,
        body: { productId: review.productId, escalationStatus: escalationStatusNext, priority },
      });
      toast.push("Escalation updated.");
      state.reload();
    } catch (error) {
      toast.push(error.message, "error");
    } finally {
      setBusyId("");
    }
  }

  const reviews = state.data?.reviews || [];
  return (
    <>
      <p className="eyebrow">Queue</p>
      <h1>Reviews</h1>
      <div className="filters">
        <label className="field">
          Sentiment
          <select value={sentiment} onChange={(event) => updateFilter("sentiment", event.target.value)}>
            <option value="">All</option>
            {["POSITIVE", "NEGATIVE", "NEUTRAL", "MIXED"].map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="field">
          Escalation
          <select value={escalationStatus} onChange={(event) => updateFilter("escalationStatus", event.target.value)}>
            <option value="">All</option>
            {["ESCALATED", "OPEN", "IN_REVIEW", "RESOLVED", "NONE"].map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
      </div>
      {state.loading && <LoadingBlock label="Loading reviews" />}
      {state.error && <ErrorBlock error={state.error} />}
      {!state.loading && !state.error && reviews.length === 0 && <EmptyBlock title="No reviews in this view">Submit one from a product page after an order.</EmptyBlock>}
      {!state.loading && reviews.length > 0 && (
        <div className="table-wrap panel">
          <table className="admin-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Product</th>
                <th>Rating</th>
                <th>Sentiment</th>
                <th>Negative</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.reviewId}>
                  <td>{formatWhen(review.createdAt)}</td>
                  <td>
                    <Link to={`/admin/reviews/${review.reviewId}?productId=${review.productId}`}>{review.productName}</Link>
                    <div className="muted">{review.text.slice(0, 90)}{review.text.length > 90 ? "…" : ""}</div>
                  </td>
                  <td>{review.rating}</td>
                  <td><StatusBadge value={review.sentiment} /></td>
                  <td>{formatScore(review.negativeScore)}</td>
                  <td><StatusBadge value={review.priority} /></td>
                  <td><StatusBadge value={review.escalationStatus} /></td>
                  <td className="stack">
                    <button className="ghost" type="button" disabled={busyId === review.reviewId} onClick={() => setStatus(review, "IN_REVIEW", review.priority)}>Mark reviewed</button>
                    <button className="ghost" type="button" disabled={busyId === review.reviewId} onClick={() => setStatus(review, "RESOLVED", "LOW")}>Resolve</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
