import { Link, useSearchParams } from "react-router-dom";
import { ProductCard } from "../components/ProductCard.jsx";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "../components/StateViews.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { api } from "../services/api.js";

const CATEGORIES = ["Phones", "Cameras", "Audio", "Wearables", "Home"];

export function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const category = params.get("category") || "";
  const sort = params.get("sort") || "name";
  const state = useAsync(
    () => api(`/products?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}`),
    [q, category],
  );

  const products = [...(state.data?.products || [])].sort((a, b) => {
    if (sort === "price-asc") return a.priceCents - b.priceCents;
    if (sort === "price-desc") return b.priceCents - a.priceCents;
    return a.name.localeCompare(b.name);
  });

  function setSort(value) {
    const next = new URLSearchParams(params);
    next.set("sort", value);
    setParams(next);
  }

  return (
    <div className="page">
      <div className="page-title" style={{ paddingTop: 32 }}>
        <div>
          <p className="eyebrow">Catalog</p>
          <h1>{category || (q ? `Results for “${q}”` : "The floor")}</h1>
        </div>
        <label className="field" style={{ minWidth: 180 }}>
          <span className="muted">Sort</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products">
            <option value="name">Name</option>
            <option value="price-asc">Price, low to high</option>
            <option value="price-desc">Price, high to low</option>
          </select>
        </label>
      </div>
      <div className="filters">
        <div className="chips">
          <Link className={`chip ${category ? "" : "on"}`} to={q ? `/products?q=${encodeURIComponent(q)}` : "/products"}>All</Link>
          {CATEGORIES.map((item) => (
            <Link
              key={item}
              className={`chip ${category === item ? "on" : ""}`}
              to={`/products?category=${encodeURIComponent(item)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            >
              {item}
            </Link>
          ))}
        </div>
      </div>
      {state.loading && <LoadingBlock label="Looking through the catalog" />}
      {state.error && <ErrorBlock error={state.error} />}
      {!state.loading && !state.error && products.length === 0 && (
        <EmptyBlock title="Nothing matches">Try another category, or clear the search.</EmptyBlock>
      )}
      <div className="product-grid">
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </div>
  );
}
