import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

export function ShopLayout({ children }) {
  const { user, signOut } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  function onSearch(event) {
    event.preventDefault();
    const q = query.trim();
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
  }

  return (
    <>
      <header className="site-header">
        <Link className="brand" to="/">
          <span className="mark">N</span>
          <span>
            <strong>NORTHLINE</strong>
            <small>Electronics</small>
          </span>
        </Link>
        <form className="search" onSubmit={onSearch}>
          <input
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search phones, audio, cameras"
            aria-label="Search products"
          />
          <button type="submit">Search</button>
        </form>
        <nav className="site-nav">
          <NavLink to="/products">Shop</NavLink>
          <NavLink to="/orders">Orders</NavLink>
          {user && <NavLink to="/profile">Profile</NavLink>}
          {user?.isAdmin && <NavLink to="/admin">Desk</NavLink>}
          {user ? (
            <button className="text-button" type="button" onClick={signOut}>Sign out</button>
          ) : (
            <NavLink to="/login">Sign in</NavLink>
          )}
          <NavLink className="cart-link" to="/cart">
            Cart{count > 0 && <span className="count">{count}</span>}
          </NavLink>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <div>
          <strong>Northline</strong>
          <p>A fictional electronics shop. Reviews on the product page are the words customers wrote.</p>
        </div>
      </footer>
    </>
  );
}

export function AdminLayout({ children }) {
  return (
    <div className="admin-shell">
      <aside className="admin-nav">
        <Link className="brand" to="/admin">
          <span className="mark">N</span>
          <span>
            <strong>DESK</strong>
            <small>Northline</small>
          </span>
        </Link>
        <NavLink end to="/admin">Overview</NavLink>
        <NavLink end to="/admin/reviews">All reviews</NavLink>
        <Link to="/admin/reviews?sentiment=NEGATIVE">Negative</Link>
        <Link to="/admin/reviews?escalationStatus=ESCALATED">Escalated</Link>
        <NavLink to="/">Back to shop</NavLink>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
