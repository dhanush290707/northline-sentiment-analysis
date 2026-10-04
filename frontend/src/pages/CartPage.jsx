import { Link } from "react-router-dom";
import { ProductArt } from "../components/ProductArt.jsx";
import { EmptyBlock } from "../components/StateViews.jsx";
import { useCart } from "../context/CartContext.jsx";
import { formatPrice } from "../utils/format.js";

export function CartPage() {
  const cart = useCart();
  return (
    <div className="page" style={{ paddingTop: 32 }}>
      <div className="page-title">
        <h1>Cart</h1>
        <span className="price">{formatPrice(cart.totalCents)}</span>
      </div>
      {cart.items.length === 0 ? (
        <EmptyBlock title="The cart is empty">
          The floor is still open. <Link to="/products">Browse products</Link>
        </EmptyBlock>
      ) : (
        <>
          <table className="cart-row">
            <tbody>
              {cart.items.map((item) => (
                <tr key={item.productId}>
                  <td style={{ width: 92 }}>
                    <ProductArt motif={item.motif} accent={item.accent} title={item.name} />
                  </td>
                  <td>
                    <strong>{item.name}</strong>
                    <div className="muted">{formatPrice(item.priceCents)}</div>
                  </td>
                  <td>
                    <div className="qty">
                      <button type="button" onClick={() => cart.setQuantity(item.productId, item.quantity - 1)} aria-label={`Decrease ${item.name}`}>−</button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => cart.setQuantity(item.productId, item.quantity + 1)} aria-label={`Increase ${item.name}`}>+</button>
                    </div>
                  </td>
                  <td>{formatPrice(item.priceCents * item.quantity)}</td>
                  <td><button className="text-button" type="button" onClick={() => cart.remove(item.productId)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 18 }}>
            <Link className="button" to="/checkout">Checkout</Link>
          </div>
        </>
      )}
    </div>
  );
}
