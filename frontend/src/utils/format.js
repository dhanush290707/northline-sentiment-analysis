export function formatPrice(cents) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((cents || 0) / 100);
}

export function formatWhen(iso) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}

export function formatScore(value) {
  return `${Math.round(Number(value || 0) * 100)}%`;
}

export function stars(value) {
  const rating = Math.round(Number(value) || 0);
  return "★★★★★".slice(0, rating) + "☆☆☆☆☆".slice(0, 5 - rating);
}

export function percent(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}
