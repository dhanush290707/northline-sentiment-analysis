import { Link, useParams } from "react-router-dom";
import { StatusBadge, ErrorBlock, LoadingBlock } from "../../components/StateViews.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { api } from "../../services/api.js";
import { formatScore, formatWhen, percent } from "../../utils/format.js";

export function ProductInsightPage() {
  const { id } = useParams();
  const state = useAsync(() => api(`/admin/products/${id}/sentiment`, { auth: true }), [id]);
  if (state.loading) return <LoadingBlock label="Loading product sentiment" />;
  if (state.error) return <ErrorBlock error={state.error} />;
  const { product, reviews } = state.data;
  const slices = [
    ["Positive", product.positive, "pos"],
    ["Negative", product.negative, "neg"],
    ["Neutral", product.neutral, "neu"],
    ["Mixed", product.mixed, "mix"],
  ];
  return (
    <>
      <p className="eyebrow"><Link to="/admin">Overview</Link></p>
      <h1>{product.name}</h1>
      <p className="muted">{product.category} · {product.reviewCount} reviews · {product.escalated} escalated</p>
      <div className="panel" style={{ marginTop: 16 }}>
        {product.reviewCount === 0 ? <p className="muted">No sentiment yet.</p> : (
          <>
            <div className="stack-bar">
              {slices.map(([label, value, tone]) => (
                <i key={label} className={tone} style={{ width: `${percent(value, product.reviewCount)}%` }} />
              ))}
            </div>
            <div className="legend">
              {slices.map(([label, value, tone]) => (
                <span key={label}><i className={`swatch ${tone}`} />{label} {value} ({percent(value, product.reviewCount)}%)</span>
              ))}
            </div>
          </>
        )}
      </div>
      <section className="section">
        {reviews.map((review) => (
          <article key={review.reviewId} className="review">
            <div className="row-between">
              <Link to={`/admin/reviews/${review.reviewId}?productId=${product.id}`}>{formatWhen(review.createdAt)}</Link>
              <StatusBadge value={review.sentiment} />
            </div>
            <p>{review.text}</p>
            <p className="muted">Rating {review.rating} · negative {formatScore(review.negativeScore)} · <StatusBadge value={review.escalationStatus} /></p>
          </article>
        ))}
      </section>
    </>
  );
}
