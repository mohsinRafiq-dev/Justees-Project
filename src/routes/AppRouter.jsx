import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext.jsx";
import { CartProvider, useCart } from "../contexts/CartContext.jsx";
import ProtectedRoute from "./ProtectedRoute";
import CartDrawer from "../components/common/CartDrawer";
import ScrollToTop from "../components/common/ScrollToTop";

// Wrapper to use context
const GlobalCartDrawer = () => {
  const { isCartOpen, closeCart } = useCart();
  return <CartDrawer isOpen={isCartOpen} onClose={closeCart} />;
};

// Page imports
import Home from "../pages/Home";
import Products from "../pages/Products";
import ProductDetail from "../pages/ProductDetail";
import Categories from "../pages/Categories";
import About from "../pages/About";
import AdminLogin from "../pages/admin/AdminLogin";
import AdminDashboard from "../pages/admin/AdminDashboard";

/**
 * Main Application Router
 * Defines all routes and their access control
 */

const AppRouter = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <CartProvider>
          <GlobalCartDrawer />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/about" element={<About />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Redirect /admin to /admin/dashboard */}
            <Route
              path="/admin"
              element={<Navigate to="/admin/dashboard" replace />}
            />

            {/* 404 - Redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRouter;
