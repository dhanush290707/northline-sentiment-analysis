import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AdminOnly } from "./components/Protected.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { AdminLayout, ShopLayout } from "./layouts/ShopLayout.jsx";
import { CartPage } from "./pages/CartPage.jsx";
import { CheckoutPage } from "./pages/CheckoutPage.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { OrderDetailPage } from "./pages/OrderDetailPage.jsx";
import { OrdersPage } from "./pages/OrdersPage.jsx";
import { ProductPage } from "./pages/ProductPage.jsx";
import { ProductsPage } from "./pages/ProductsPage.jsx";
import { ProfilePage } from "./pages/ProfilePage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";
import { DashboardPage } from "./pages/admin/DashboardPage.jsx";
import { ProductInsightPage } from "./pages/admin/ProductInsightPage.jsx";
import { ReviewDetailPage } from "./pages/admin/ReviewDetailPage.jsx";
import { ReviewsPage } from "./pages/admin/ReviewsPage.jsx";

export function App() {
  const { ready } = useAuth();
  if (!ready) return <p className="boot">Opening the shop…</p>;
  return (
    <Routes>
      <Route element={<AdminShell />}>
        <Route path="/admin" element={<DashboardPage />} />
        <Route path="/admin/reviews" element={<ReviewsPage />} />
        <Route path="/admin/reviews/:reviewId" element={<ReviewDetailPage />} />
        <Route path="/admin/products/:id" element={<ProductInsightPage />} />
      </Route>
      <Route element={<ShopShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function ShopShell() {
  return (
    <ShopLayout>
      <Outlet />
    </ShopLayout>
  );
}

function AdminShell() {
  return (
    <AdminOnly>
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    </AdminOnly>
  );
}
