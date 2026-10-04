import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ProductArt } from "../components/ProductArt.jsx";
import { ErrorBlock, LoadingBlock } from "../components/StateViews.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { api } from "../services/api.js";
import { formatPrice, formatWhen, stars } from "../utils/format.js";

export function ProductPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const cart = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const productState = useAsync(() => api(`/products/${id}`), [id]);
  const reviewState = useAsync(() => api(`/products/${id}/reviews`), [id]);
  const orderState = useAsync(() => (user ? api("/orders", { auth: true }) : Promise.resolve({ orders: [] })), [user, id]);
  const mineState = useAsync(() => (user ? api("/me/reviews", { auth: true }) : Promise.resolve({ reviews: [] })), [user, id]);

  const product = productState.data?.product;
  const reviews = reviewState.data?.reviews || [];
  const purchased = (orderState.data?.orders || []).some((order) => order.items.some((item) => item.productId === id));
  const alreadyReviewed = (mineState.data?.reviews || []).some((review) => review.productId === id);

  function addToCart() {
    cart.add(product, quantity);
    toast.push(`${product.name} is in the cart.`);
  }

  async function submitReview(event) {
    event.preventDefault();
    setFormError("");
    if (!rating) {
      setFormError("Choose a star rating.");
      return;
    }
    if (text.trim().length < 10) {
      setFormError("Write at least 10 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await api(`/products/${id}/reviews`, {
        method: "POST",
        auth: true,
        body: { rating, reviewText: text },
      });
      setText("");
      setRating(0);
      toast.push("Review published.");
      reviewState.reload();
      mineState.reload();
      productState.reload();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (productState.loading) return <div className="page"><LoadingBlock label="Opening the product" /></div>;
  if (productState.error) return <div className="page"><ErrorBlock error={productState.error} /></div>;

  return (
    <div className="page">
      <article className="product-layout">
        <ProductArt motif={product.motif} accent={product.accent} title={product.name} />
        <div className="buy-box">
          <div className="kicker">{product.category}</div>
          <h1>{product.name}</h1>
          <p className="lede">{product.description}</p>
          <p className="price" style={{ marginTop: 12 }}>{formatPrice(product.priceCents)}</p>
          <p className="muted">
            {product.reviewCount ? `${stars(product.ratingAverage)} ${product.ratingAverage} · ${product.reviewCount} reviews` : "No reviews yet"}
            {" · "}{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </p>
          <ul className="specs">
            {product.specs.map((spec) => <li key={spec}>{spec}</li>)}
          </ul>
          <div className="qty">
            <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity">−</button>
            <span>{quantity}</span>
            <button type="button" onClick={() => setQuantity((value) => Math.min(5, value + 1))} aria-label="Increase quantity">+</button>
          </div>
          <div className="stack">
            <button className="button" type="button" disabled={product.stock < 1} onClick={addToCart}>Add to cart</button>
            <button className="button copper" type="button" disabled={product.stock < 1} onClick={() => { addToCart(); navigate("/checkout"); }}>Buy now</button>
          </div>
        </div>
      </article>

      <section className="section">
        <div className="section-head">
          <h2>Reviews</h2>
          <span className="muted">{reviews.length} published</span>
        </div>
        {reviewState.loading && <p className="muted">Loading reviews…</p>}
        {reviewState.error && <ErrorBlock error={reviewState.error} />}
        {!reviewState.loading && reviews.length === 0 && <p className="muted">No one has reviewed this yet.</p>}
        {reviews.map((review) => (
          <article key={review.reviewId} className="review">
            <div className="row-between">
              <strong>{review.authorName}</strong>
              <span className="muted">{formatWhen(review.createdAt)}</span>
            </div>
            <div className="stars" aria-label={`${review.rating} out of 5`}>{stars(review.rating)}</div>
            <p>{review.text}</p>
          </article>
        ))}

        <div className="panel" style={{ marginTop: 18 }}>
          <h3>Write a review</h3>
          <p className="muted">Order this product first. Star rating and a written review are both required.</p>
          {!user && <p>Sign in to review. <Link to={`/login?next=/products/${id}`}>Sign in</Link></p>}
          {user && !purchased && !orderState.loading && <p>Place an order that includes {product.name} before reviewing it.</p>}
          {user && alreadyReviewed && <p>You already reviewed this product.</p>}
          {user && purchased && !alreadyReviewed && !mineState.loading && (
            <form onSubmit={submitReview}>
              <div className="star-input" role="radiogroup" aria-label="Star rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" className={star <= rating ? "on" : ""} role="radio" aria-checked={rating === star} onClick={() => setRating(star)}>
                    ★
                  </button>
                ))}
              </div>
              <label className="field">
                Review
                <textarea
                  value={text}
                  maxLength={4500}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="The display is excellent, but the battery life is disappointing."
                />
              </label>
              <p className="muted">{text.trim().length} / 4500</p>
              {formError && <div className="banner error" role="alert">{formError}</div>}
              <button className="button" type="submit" disabled={submitting}>{submitting ? "Sending…" : "Publish review"}</button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
