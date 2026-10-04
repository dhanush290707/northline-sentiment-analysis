import { Link, useParams } from "react-router-dom";
import { Protected } from "../components/Protected.jsx";
import { ErrorBlock, LoadingBlock } from "../components/StateViews.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { api } from "../services/api.js";
import { formatPrice, formatWhen } from "../utils/format.js";

export function OrderDetailPage() {
  return (
    <Protected>
      <OrderBody />
    </Protected>
  );
}

function OrderBody() {
  const { id } = useParams();
  const state = useAsync(() => api(`/orders/${id}`, { auth: true }), [id]);
  if (state.loading) return <div className="page"><LoadingBlock label="Loading the order" /></div>;
  if (state.error) return <div className="page"><ErrorBlock error={state.error} /></div>;
  const order = state.data.order;
  return (
    <div className="page" style={{ paddingTop: 32 }}>
      <p className="eyebrow">Order</p>
      <h1>{formatWhen(order.createdAt)}</h1>
      <p className="muted">{order.status} · {formatPrice(order.totalCents)}</p>
      <div className="panel" style={{ marginTop: 18 }}>
        {order.items.map((item) => (
          <div key={item.productId} className="row-between" style={{ marginBottom: 10 }}>
            <Link to={`/products/${item.productId}`}>{item.name} × {item.quantity}</Link>
            <span>{formatPrice(item.priceCents * item.quantity)}</span>
          </div>
        ))}
        <p className="muted">
          {order.shipping.fullName}, {order.shipping.line1}, {order.shipping.city}, {order.shipping.region} {order.shipping.postalCode}
        </p>
      </div>
    </div>
  );
}
