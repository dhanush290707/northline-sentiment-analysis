import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { StatusBadge, ErrorBlock, LoadingBlock } from "../../components/StateViews.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { api } from "../../services/api.js";
import { formatScore, formatWhen, percent } from "../../utils/format.js";

export function DashboardPage() {
  const state = useAsync(() => api("/admin/dashboard", { auth: true }), []);
  if (state.loading) return <LoadingBlock label="Loading the desk" />;
  if (state.error) return <ErrorBlock error={state.error} />;
  const { totals, products, trend, threshold, recentEscalations } = state.data;
  const slices = [
    ["POSITIVE", totals.positive, "pos"],
    ["NEGATIVE", totals.negative, "neg"],
    ["NEUTRAL", totals.neutral, "neu"],
    ["MIXED", totals.mixed, "mix"],
  ];

  return (
    <>
      <p className="eyebrow">Shop desk</p>
      <div className="page-title">
        <h1>Feedback</h1>
        <span className="muted">Escalate when negative confidence is at least {Math.round(threshold * 100)}%. Comprehend does not set this.</span>
      </div>
      <div className="stat-grid">
        <Stat label="Products" value={totals.products} />
        <Stat label="Reviews" value={totals.reviews} />
        <Stat label="Positive" value={totals.positive} />
        <Stat label="Negative" value={totals.negative} />
        <Stat label="Neutral" value={totals.neutral} />
        <Stat label="Mixed" value={totals.mixed} />
        <Stat label="Escalated" value={totals.escalated} />
        <Stat label="Orders" value={totals.orders} />
      </div>
      <div className="charts">
        <section className="panel">
          <h3>Distribution</h3>
          {totals.reviews === 0 ? (
            <p className="muted">No scored reviews yet.</p>
          ) : (
            <>
              <div className="stack-bar" aria-label="Sentiment distribution">
                {slices.map(([label, value, tone]) => (
                  <i key={label} className={tone} style={{ width: `${percent(value, totals.reviews)}%` }} title={`${label} ${percent(value, totals.reviews)}%`} />
                ))}
              </div>
              <div className="legend">
                {slices.map(([label, value, tone]) => (
                  <span key={label}><i className={`swatch ${tone}`} />{label} {percent(value, totals.reviews)}% ({value})</span>
                ))}
              </div>
            </>
          )}
        </section>
        <section className="panel">
          <h3>Sentiment over time</h3>
          {trend.length === 0 ? <p className="muted">The chart fills in after the first review.</p> : (
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={trend}>
                  <CartesianGrid stroke="#e6dfd2" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="POSITIVE" stackId="s" fill="#1d6842" />
                  <Bar dataKey="NEGATIVE" stackId="s" fill="#9d2424" />
                  <Bar dataKey="NEUTRAL" stackId="s" fill="#8d877d" />
                  <Bar dataKey="MIXED" stackId="s" fill="#2c4d72" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>
      <section className="section">
        <div className="section-head">
          <h2>Products by negative share</h2>
        </div>
        <div className="table-wrap panel">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Reviews</th>
                <th>Positive</th>
                <th>Negative</th>
                <th>Neutral</th>
                <th>Mixed</th>
                <th>Escalated</th>
                <th>Negative share</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td><Link to={`/admin/products/${product.id}`}>{product.name}</Link></td>
                  <td>{product.reviewCount}</td>
                  <td>{product.positive}</td>
                  <td>{product.negative}</td>
                  <td>{product.neutral}</td>
                  <td>{product.mixed}</td>
                  <td>{product.escalated}</td>
                  <td>{product.reviewCount ? `${Math.round(product.negativeRatio * 100)}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="section">
        <div className="section-head">
          <h2>Escalated now</h2>
          <Link to="/admin/reviews?escalationStatus=ESCALATED">Open the queue</Link>
        </div>
        {recentEscalations.length === 0 && <p className="muted">Nothing is escalated.</p>}
        {recentEscalations.map((review) => (
          <article key={review.reviewId} className="review">
            <div className="row-between">
              <Link to={`/admin/reviews/${review.reviewId}?productId=${review.productId}`}><strong>{review.productName}</strong></Link>
              <span className="muted">{formatWhen(review.createdAt)}</span>
            </div>
            <p>{review.text}</p>
            <div className="status-actions">
              <StatusBadge value={review.sentiment} />
              <StatusBadge value={review.priority} />
              <span className="muted">Negative confidence {formatScore(review.negativeScore)}</span>
            </div>
          </article>
        ))}
      </section>
      <aside className="callout">
        Domain phrases such as battery backup, HDR, ANC, and transparency mode can be misread. The original review stays next to the scores so a shop owner can see a bad classification. This project does not claim to have removed that limitation.
      </aside>
    </>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
