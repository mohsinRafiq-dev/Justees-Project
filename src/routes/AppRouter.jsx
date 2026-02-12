import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import CartDrawer from "../components/common/CartDrawer";
import WishlistDrawer from "../components/layout/WishlistDrawer";
import ScrollToTop from "../components/common/ScrollToTop";
import ProtectedRoute from "./ProtectedRoute";

// Context Imports
import { AuthProvider } from "../contexts/AuthContext.jsx";
import { CartProvider } from "../contexts/CartContext.jsx";
import { WishlistProvider } from "../contexts/WishlistContext";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";

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
 * Also handles the main layout structure
 */

const AppContent = () => {
  const { isDark } = useTheme();
  
  return (
    <BrowserRouter>
      <AppLayout isDark={isDark} />
    </BrowserRouter>
  );
};

// Extracted inner component to use useLocation hook (which requires being inside BrowserRouter)
import { useLocation } from 'react-router-dom';

const AppLayout = ({ isDark }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      <ScrollToTop />
      <div
        className={`flex flex-col min-h-screen transition-colors duration-300 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}
      >
        {!isAdminRoute && (
          <>
            <Navbar />
            <CartDrawer />
            <WishlistDrawer />
          </>
        )}
        <main className="flex-grow">
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
        </main>
        {!isAdminRoute && <Footer />}
      </div>
    </>
  );
};

const AppRouter = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <AppContent />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default AppRouter;
