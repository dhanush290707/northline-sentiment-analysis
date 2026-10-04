import { Link } from "react-router-dom";
import { ProductCard } from "../components/ProductCard.jsx";
import { ErrorBlock, LoadingBlock } from "../components/StateViews.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { api } from "../services/api.js";

const SPOTLIGHT = ["Audio", "Phones", "Cameras", "Wearables"];

export function HomePage() {
  const state = useAsync(() => api("/products"), []);
  const featured = (state.data?.products || []).slice(0, 4);

  return (
    <div className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Northline electronics</p>
          <h1>Tools with a plain opinion.</h1>
          <p className="lede">
            Phones, cameras, and audio from a shop that does not exist outside this project. Buy a piece, then say what actually failed.
          </p>
          <div className="hero-actions">
            <Link className="button" to="/products">Browse the floor</Link>
            <Link className="ghost" to="/products?category=Audio">Listen first</Link>
          </div>
        </div>
        <aside className="hero-aside">
          <p>Twelve products. No marketplace branding. Reviews on a product page are the words customers wrote.</p>
        </aside>
      </section>
      <section className="section">
        <div className="chips" style={{ marginBottom: 18 }}>
          {SPOTLIGHT.map((category) => (
            <Link key={category} className="chip" to={`/products?category=${encodeURIComponent(category)}`}>{category}</Link>
          ))}
        </div>
        {state.loading && <LoadingBlock label="Bringing the floor out" />}
        {state.error && <ErrorBlock error={state.error} />}
        {!state.loading && !state.error && (
          <div className="product-grid">
            {featured.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </section>
    </div>
  );
}
