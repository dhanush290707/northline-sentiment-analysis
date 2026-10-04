export function StatusBadge({ value }) {
  if (!value) return null;
  return <span className={`badge ${value}`}>{value.replaceAll("_", " ")}</span>;
}

export function LoadingBlock({ label = "Loading" }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <p className="muted">{label}</p>
      <div className="product-grid" style={{ marginTop: 12 }}>
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    </div>
  );
}

export function ErrorBlock({ error }) {
  return (
    <div className="banner error" role="alert">
      {error?.message || "Something went wrong."}
    </div>
  );
}

export function EmptyBlock({ title, children }) {
  return (
    <div className="banner empty">
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  );
}
