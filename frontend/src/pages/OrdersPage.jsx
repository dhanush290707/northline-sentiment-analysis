import { Link } from "react-router-dom";
import { Protected } from "../components/Protected.jsx";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "../components/StateViews.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { api } from "../services/api.js";
import { formatPrice, formatWhen } from "../utils/format.js";

export function OrdersPage() {
  return (
    <Protected>
      <OrdersBody />
    </Protected>
  );
}

function OrdersBody() {
  const state = useAsync(() => api("/orders", { auth: true }), []);
  const orders = state.data?.orders || [];
  return (
    <div className="page" style={{ paddingTop: 32 }}>
      <h1>Orders</h1>
      {state.loading && <LoadingBlock label="Loading orders" />}
      {state.error && <ErrorBlock error={state.error} />}
      {!state.loading && !state.error && orders.length === 0 && (
        <EmptyBlock title="No orders yet">A review can be written after an order includes the product.</EmptyBlock>
      )}
      <div className="order-list" style={{ marginTop: 16 }}>
        {orders.map((order) => (
          <Link key={order.orderId} className="order-card" to={`/orders/${order.orderId}`}>
            <div className="row-between">
              <strong>{formatWhen(order.createdAt)}</strong>
              <span>{formatPrice(order.totalCents)}</span>
            </div>
            <p className="muted">{order.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}</p>
            <p className="kicker">{order.status}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
