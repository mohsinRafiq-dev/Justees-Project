import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  ShoppingBag,
  Users,
  TrendingUp,
  Plus,
  Eye,
  EyeOff,
  Settings,
  BarChart3,
  AlertTriangle,
  Tag,
  Layers,
  LogOut,
  Menu,
  X,
  Home,
  Sun,
  Moon,
  Star,
  Image,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { getProductAnalytics } from "../../services/products.service";
import { formatPrice } from "../../utils/validation";
import ProductManagement from "../../components/admin/ProductManagement";
import CategoriesManagement from "./CategoriesManagement";
import SizesManagement from "./SizesManagement";
import OrdersManagement from "./OrdersManagement";
import ReviewsManagement from "./ReviewsManagement";
import SlidesManagement from "./SlidesManagement";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  // Initialize activeTab from localStorage or default to "dashboard"
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('adminActiveTab') || "dashboard";
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    revenue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Function to handle tab changes and persist to localStorage
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    localStorage.setItem('adminActiveTab', tabId);
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load product analytics
      const analyticsResult = await getProductAnalytics();
      if (analyticsResult.success) {
        setStats((prev) => ({
          ...prev,
          totalProducts: analyticsResult.analytics.totalProducts,
          lowStockItems:
            analyticsResult.analytics.totalProducts -
            analyticsResult.analytics.outOfStock,
          outOfStockItems: analyticsResult.analytics.outOfStock,
        }));
      }

      // Simulate other stats (replace with real API calls)
      setStats((prev) => ({
        ...prev,
        totalOrders: 128,
        totalUsers: 256,
        revenue: 12500,
      }));
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      navigate("/admin/login");
    }
  };

  const sidebarItems = [
    { id: "dashboard", name: "Dashboard", icon: BarChart3 },
    { id: "products", name: "Products", icon: Package },
    { id: "categories", name: "Categories", icon: Tag },
    { id: "sizes", name: "Sizes & Colors", icon: Layers },
    { id: "slides", name: "Slides", icon: Image },
    { id: "orders", name: "Orders", icon: ShoppingBag },
    { id: "reviews", name: "Reviews", icon: Star },
    { id: "users", name: "Users", icon: Users },
    { id: "settings", name: "Settings", icon: Settings },
  ];

  const quickActions = [
    {
      title: "Add Product",
      description: "Create new product",
      icon: Plus,
      color: "blue",
      action: () => handleTabChange("products"),
    },
    {
      title: "View Orders",
      description: "Manage orders",
      icon: Eye,
      color: "green",
      action: () => handleTabChange("orders"),
    },
    {
      title: "Manage Slides",
      description: "Add images & videos",
      icon: Image,
      color: "yellow",
      action: () => handleTabChange("slides"),
    },
    {
      title: "Analytics",
      description: "View reports",
      icon: TrendingUp,
      color: "purple",
      action: () => {},
    },
  ];

  const PasswordUpdateForm = () => {
    const { updatePassword } = useAuth();
    const [passLoading, setPassLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [pass, setPass] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleUpdate = async (e) => {
      e.preventDefault();
      if (pass.length < 6) {
        setMessage({
          type: "error",
          text: "Password must be at least 6 characters",
        });
        return;
      }
      setPassLoading(true);
      setMessage({ type: "", text: "" });

      const res = await updatePassword(pass);
      if (res.success) {
        setMessage({
          type: "success",
          text: "Password updated successfully!",
        });
        setPass("");
      } else {
        setMessage({
          type: "error",
          text: res.error || "Failed to update password",
        });
      }
      setPassLoading(false);
    };

    return (
      <div>
        <h4
          className={`font-medium mb-4 ${isDark ? "text-white" : "text-gray-900"}`}
        >
          Change Password
        </h4>
        {message.text && (
          <div
            className={`p-3 rounded-xl mb-4 text-sm ${
              message.type === "error"
                ? isDark
                  ? "bg-red-900/30 text-red-300 border border-red-500/50"
                  : "bg-red-50 text-red-700"
                : isDark
                  ? "bg-green-900/30 text-green-300 border border-green-500/50"
                  : "bg-green-50 text-green-700"
            }`}
          >
            {message.text}
          </div>
        )}
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}
            >
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                className={`w-full border ${isDark ? "border-gray-600 bg-gray-700/50 text-white placeholder-gray-400" : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"} rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none pr-10 transition-all`}
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute inset-y-0 right-0 pr-3 flex items-center ${isDark ? "text-gray-400 hover:text-gray-300" : "text-gray-400 hover:text-gray-500"}`}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={passLoading}
            className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-white px-6 py-2 rounded-xl hover:from-blue-700 hover:via-cyan-700 hover:to-teal-700 disabled:opacity-50 transition-all shadow-lg"
          >
            {passLoading ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    );
  };

  const StatCard = ({ title, value, icon: Icon, color, change, loading }) => (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      className={`glass ${isDark ? "" : "glass-light"} rounded-2xl shadow-xl p-6 border ${isDark ? "border-gray-700" : "border-gray-200"}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p
            className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"} mb-2`}
          >
            {title}
          </p>
          <div
            className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            {loading ? (
              <div className="h-8 w-20 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
            ) : typeof value === "number" && title.includes("Revenue") ? (
              formatPrice(value)
            ) : (
              value
            )}
          </div>
          {change && (
            <p
              className={`text-sm mt-2 flex items-center ${
                change.positive ? "text-green-500" : "text-red-500"
              }`}
            >
              {change.positive ? "↗" : "↘"} {change.value}% from last month
            </p>
          )}
        </div>
        <div
          className={`p-4 rounded-xl bg-gradient-to-br ${
            color === "blue"
              ? "from-blue-500/20 to-cyan-500/20"
              : color === "green"
                ? "from-green-500/20 to-emerald-500/20"
                : color === "purple"
                  ? "from-purple-500/20 to-pink-500/20"
                  : "from-yellow-500/20 to-orange-500/20"
          }`}
        >
          <Icon
            className={`w-8 h-8 ${
              color === "blue"
                ? "text-blue-500"
                : color === "green"
                  ? "text-green-500"
                  : color === "purple"
                    ? "text-purple-500"
                    : "text-yellow-500"
            }`}
          />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div
      className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"} flex relative`}
    >
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className={`lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl glass ${isDark ? "" : "glass-light"} border ${isDark ? "border-gray-700" : "border-gray-200"}`}
      >
        {mobileMenuOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || mobileMenuOpen) && (
          <motion.div
            initial={mobileMenuOpen ? { x: -300 } : { width: sidebarOpen ? 288 : 88 }}
            animate={{ 
              x: 0,
              width: mobileMenuOpen ? (window.innerWidth < 640 ? '100%' : 288) : (sidebarOpen ? 288 : 88)
            }}
            exit={mobileMenuOpen ? { x: -300 } : { width: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`${
              mobileMenuOpen
                ? "fixed inset-y-0 left-0 z-50 w-72"
                : "hidden lg:flex flex-col h-screen sticky top-0"
            } glass ${isDark ? "" : "glass-light"} shadow-2xl border-r ${isDark ? "border-gray-700" : "border-gray-200"} relative transition-all duration-300`}
          >
            {/* Collapse Toggle Button (Desktop Only) */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="absolute -right-3 top-20 bg-blue-600 text-white p-1.5 rounded-full shadow-lg z-50 hidden lg:block hover:scale-110 transition-transform"
            >
              {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            <div className={`p-6 flex items-center ${sidebarOpen ? "justify-between" : "justify-center"}`}>
              {sidebarOpen ? (
                <Link
                  to="/"
                  className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 bg-clip-text text-transparent flex items-center space-x-2 whitespace-nowrap"
                >
                  <span>Justees</span>
                  <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Admin</span>
                </Link>
              ) : (
                <Link to="/" className="text-2xl font-bold text-blue-500">J</Link>
              )}
              
              {/* Mobile Close Button */}
              {mobileMenuOpen && (
                <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden p-2 text-gray-500">
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>

            <nav className="mt-6 px-3 flex-1 space-y-1 overflow-y-auto">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.02, x: sidebarOpen ? 4 : 0 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      handleTabChange(item.id);
                      if (window.innerWidth < 1024) setMobileMenuOpen(false);
                    }}
                    title={!sidebarOpen ? item.name : ""}
                    className={`w-full flex items-center ${sidebarOpen ? "px-4" : "justify-center"} py-3 text-left transition-all rounded-xl ${
                      activeTab === item.id
                        ? "bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-white shadow-lg"
                        : isDark
                          ? "text-gray-300 hover:bg-gray-800/50"
                          : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${sidebarOpen ? "mr-3" : ""}`} />
                    {sidebarOpen && <span className="font-medium whitespace-nowrap">{item.name}</span>}
                  </motion.button>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className={`p-4 border-t ${isDark ? "border-gray-700" : "border-gray-200"}`}>
              {sidebarOpen ? (
                <div className={`glass ${isDark ? "" : "glass-light"} rounded-xl p-4 mb-3`}>
                  <div className="flex items-center space-x-3 mb-3">
                    <img
                      className="h-10 w-10 rounded-full ring-2 ring-blue-500 flex-shrink-0"
                      src={user?.photoURL || "https://via.placeholder.com/40"}
                      alt={user?.displayName || "Admin"}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isDark ? "text-white" : "text-gray-900"}`}>{user?.displayName || "Admin"}</p>
                      <p className={`text-xs truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={toggleTheme} className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-all ${isDark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}>
                      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                    <Link to="/" className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-all ${isDark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}>
                      <Home className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-4 mb-3">
                  <img
                    className="h-10 w-10 rounded-full ring-2 ring-blue-500"
                    src={user?.photoURL || "https://via.placeholder.com/40"}
                    alt="Admin"
                  />
                  <div className="flex flex-col items-center gap-2 w-full">
                    <button onClick={toggleTheme} className={`p-2 rounded-lg transition-all ${isDark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}>
                      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                    <Link to="/" className={`p-2 rounded-lg transition-all ${isDark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}>
                      <Home className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )}

              <button
                onClick={handleLogout}
                className={`w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-sm font-semibold transition-all shadow-lg flex items-center justify-center ${sidebarOpen ? "px-4 py-2 space-x-2" : "p-3"}`}
                title={!sidebarOpen ? "Logout" : ""}
              >
                <LogOut className="w-4 h-4" />
                {sidebarOpen && <span>Logout</span>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 lg:p-8"
            >
              {/* Header */}
              <div className="mb-8">
                <h2
                  className={`text-4xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  Welcome back,{" "}
                  {user?.displayName?.split(" ")[0] || "Admin"}!
                </h2>
                <p
                  className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  Here's what's happening with your store today.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="Total Products"
                  value={stats.totalProducts}
                  icon={Package}
                  color="blue"
                  loading={loading}
                  change={{ positive: true, value: 12 }}
                />
                <StatCard
                  title="Total Orders"
                  value={stats.totalOrders}
                  icon={ShoppingBag}
                  color="green"
                  loading={loading}
                  change={{ positive: true, value: 8 }}
                />
                <StatCard
                  title="Total Users"
                  value={stats.totalUsers}
                  icon={Users}
                  color="purple"
                  loading={loading}
                  change={{ positive: true, value: 15 }}
                />
                <StatCard
                  title="Revenue"
                  value={stats.revenue}
                  icon={TrendingUp}
                  color="yellow"
                  loading={loading}
                  change={{ positive: true, value: 23 }}
                />
              </div>

              {/* Alerts */}
              {(stats.outOfStockItems > 0 || stats.lowStockItems > 0) && (
                <div className="mb-8">
                  <h3
                    className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    Alerts & Notifications
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stats.outOfStockItems > 0 && (
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className={`glass ${isDark ? "" : "glass-light"} border-2 ${isDark ? "border-red-500/50" : "border-red-200"} rounded-xl p-4`}
                      >
                        <div className="flex items-center">
                          <div className="p-3 bg-red-500/20 rounded-xl mr-4">
                            <AlertTriangle className="w-6 h-6 text-red-500" />
                          </div>
                          <div>
                            <h4
                              className={`font-semibold ${isDark ? "text-red-300" : "text-red-900"}`}
                            >
                              Out of Stock
                            </h4>
                            <p
                              className={`text-sm ${isDark ? "text-red-200" : "text-red-700"}`}
                            >
                              {stats.outOfStockItems} products need restocking
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    {stats.lowStockItems > 0 && (
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className={`glass ${isDark ? "" : "glass-light"} border-2 ${isDark ? "border-orange-500/50" : "border-orange-200"} rounded-xl p-4`}
                      >
                        <div className="flex items-center">
                          <div className="p-3 bg-orange-500/20 rounded-xl mr-4">
                            <AlertTriangle className="w-6 h-6 text-orange-500" />
                          </div>
                          <div>
                            <h4
                              className={`font-semibold ${isDark ? "text-orange-300" : "text-orange-900"}`}
                            >
                              Low Stock Warning
                            </h4>
                            <p
                              className={`text-sm ${isDark ? "text-orange-200" : "text-orange-700"}`}
                            >
                              Some products are running low
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div
                className={`glass ${isDark ? "" : "glass-light"} rounded-2xl shadow-xl border ${isDark ? "border-gray-700" : "border-gray-200"}`}
              >
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3
                    className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    Quick Actions
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {quickActions.map((action, index) => {
                      const Icon = action.icon;
                      return (
                        <motion.button
                          key={index}
                          whileHover={{ scale: 1.05, y: -4 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={action.action}
                          className={`flex items-center p-4 border ${isDark ? "border-gray-700 hover:bg-gray-800/50" : "border-gray-200 hover:bg-gray-50"} rounded-xl transition-all`}
                        >
                          <div
                            className={`p-3 rounded-xl mr-4 ${
                              action.color === "blue"
                                ? "bg-blue-500/20"
                                : action.color === "green"
                                  ? "bg-green-500/20"
                                  : "bg-purple-500/20"
                            }`}
                          >
                            <Icon
                              className={`h-6 w-6 ${
                                action.color === "blue"
                                  ? "text-blue-500"
                                  : action.color === "green"
                                    ? "text-green-500"
                                    : "text-purple-500"
                              }`}
                            />
                          </div>
                          <div className="text-left">
                            <p
                              className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                            >
                              {action.title}
                            </p>
                            <p
                              className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                            >
                              {action.description}
                            </p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "products" && (
            <motion.div
              key="products"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ProductManagement />
            </motion.div>
          )}

          {activeTab === "categories" && (
            <motion.div
              key="categories"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <CategoriesManagement />
            </motion.div>
          )}

          {activeTab === "sizes" && (
            <motion.div
              key="sizes"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <SizesManagement />
            </motion.div>
          )}

          {activeTab === "orders" && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <OrdersManagement />
            </motion.div>
          )}

          {activeTab === "reviews" && (
            <motion.div
              key="reviews"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ReviewsManagement />
            </motion.div>
          )}

          {activeTab === "slides" && (
            <motion.div
              key="slides"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <SlidesManagement />
            </motion.div>
          )}

          {activeTab === "users" && (
            <motion.div
              key="users"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8"
            >
              <h2
                className={`text-3xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}
              >
                User Management
              </h2>
              <div
                className={`glass ${isDark ? "" : "glass-light"} rounded-2xl p-8 text-center border ${isDark ? "border-gray-700" : "border-gray-200"}`}
              >
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p
                  className={`text-lg ${isDark ? "text-gray-300" : "text-gray-600"}`}
                >
                  User management feature coming soon...
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8"
            >
              <h2
                className={`text-3xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Settings
              </h2>

              <div
                className={`glass ${isDark ? "" : "glass-light"} rounded-2xl shadow-xl max-w-2xl border ${isDark ? "border-gray-700" : "border-gray-200"}`}
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3
                    className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    Security Settings
                  </h3>
                  <p
                    className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Manage your account security and preferences
                  </p>
                </div>

                <div className="p-6">
                  <PasswordUpdateForm />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminDashboard;
