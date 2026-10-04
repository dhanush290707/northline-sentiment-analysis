import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function Protected({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <p className="muted">Checking your session…</p>;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  return children;
}

export function AdminOnly({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <p className="page muted">Checking your session…</p>;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (!user.isAdmin) {
    return (
      <main className="page" style={{ paddingTop: 48 }}>
        <h1>Shop owner access is required.</h1>
        <p className="lede">This desk shows sentiment and escalation. A customer account cannot open it, and the API enforces the same rule.</p>
      </main>
    );
  }
  return children;
}
