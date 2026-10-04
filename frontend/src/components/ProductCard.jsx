import { Link } from "react-router-dom";
import { formatPrice, stars } from "../utils/format.js";
import { ProductArt } from "./ProductArt.jsx";

export function ProductCard({ product }) {
  return (
    <Link className="product-card" to={`/products/${product.id}`}>
      <ProductArt motif={product.motif} accent={product.accent} title={product.name} />
      <div className="body">
        <div className="kicker">{product.category}</div>
        <h3>{product.name}</h3>
        <p className="summary">{product.summary}</p>
        <div className="card-meta">
          <span className="price">{formatPrice(product.priceCents)}</span>
          <span className="muted">
            {product.reviewCount ? `${stars(product.ratingAverage)} ${product.ratingAverage}` : "No reviews"}
          </span>
        </div>
      </div>
    </Link>
  );
}
