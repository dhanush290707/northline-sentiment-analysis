import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EmptyBlock, ErrorBlock } from "../components/StateViews.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { api } from "../services/api.js";
import { formatPrice } from "../utils/format.js";

const EMPTY = { fullName: "", line1: "", city: "", region: "", postalCode: "" };

export function CheckoutPage() {
  const { user } = useAuth();
  const cart = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [shipping, setShipping] = useState(EMPTY);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setShipping((current) => ({ ...current, [field]: value }));
  }

  async function placeOrder(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await api("/orders", {
        method: "POST",
        auth: true,
        body: {
          items: cart.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          shipping,
        },
      });
      cart.clear();
      toast.push("Order placed. No card was charged.");
      navigate(`/orders/${result.order.orderId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <div className="page" style={{ paddingTop: 32 }}>
        <h1>Checkout</h1>
        <p className="lede">Sign in so the order is attached to you. You will need that order before you can review a product.</p>
        <Link className="button" to="/login?next=/checkout">Sign in</Link>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="page" style={{ paddingTop: 32 }}>
        <EmptyBlock title="Nothing to check out">
          <Link to="/products">Return to the floor</Link>
        </EmptyBlock>
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingTop: 32 }}>
      <h1>Checkout</h1>
      <p className="lede">Demo checkout. The order is recorded and stock is reduced. No payment is captured.</p>
      <div className="checkout">
        <aside className="panel">
          <h3>Order</h3>
          {cart.items.map((item) => (
            <div key={item.productId} className="row-between" style={{ marginTop: 10 }}>
              <span>{item.name} × {item.quantity}</span>
              <span>{formatPrice(item.priceCents * item.quantity)}</span>
            </div>
          ))}
          <div className="row-between" style={{ marginTop: 16 }}>
            <strong>Total</strong>
            <span className="price">{formatPrice(cart.totalCents)}</span>
          </div>
        </aside>
        <form className="panel" onSubmit={placeOrder}>
          {["fullName", "line1", "city", "region", "postalCode"].map((field) => (
            <label className="field" key={field}>
              {field === "line1" ? "Address" : field === "fullName" ? "Full name" : field === "postalCode" ? "Postal code" : field[0].toUpperCase() + field.slice(1)}
              <input value={shipping[field]} onChange={(event) => update(field, event.target.value)} required minLength={2} />
            </label>
          ))}
          {error && <ErrorBlock error={{ message: error }} />}
          <button className="button wide" type="submit" disabled={submitting}>{submitting ? "Placing order…" : "Place order"}</button>
        </form>
      </div>
    </div>
  );
}
