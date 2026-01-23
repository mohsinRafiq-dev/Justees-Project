import { useState, useEffect } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import {
  Package,
  ShoppingBag,
  Users,
  TrendingUp,
  Plus,
  Eye,
  Settings,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { getProductAnalytics } from "../../services/products.service";
import { formatPrice } from "../../utils/validation";
import ProductManagement from "../../components/admin/ProductManagement";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
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
    { id: "orders", name: "Orders", icon: ShoppingBag },
    { id: "users", name: "Users", icon: Users },
    { id: "settings", name: "Settings", icon: Settings },
  ];

  const quickActions = [
    {
      title: "Add Product",
      description: "Create new product",
      icon: Plus,
      color: "blue",
      action: () => setActiveTab("products"),
    },
    {
      title: "View Orders",
      description: "Manage orders",
      icon: Eye,
      color: "green",
      action: () => setActiveTab("orders"),
    },
    {
      title: "Analytics",
      description: "View reports",
      icon: TrendingUp,
      color: "purple",
      action: () => {},
    },
  ];

  const StatCard = ({ title, value, icon: Icon, color, change, loading }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-lg shadow p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="text-2xl font-bold text-gray-900">
            {loading ? (
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
            ) : typeof value === "number" && title.includes("Revenue") ? (
              formatPrice(value).replace("Rs. ", "$")
            ) : (
              value
            )}
          </div>
          {change && (
            <p
              className={`text-sm ${change.positive ? "text-green-600" : "text-red-600"}`}
            >
              {change.positive ? "↗" : "↘"} {change.value}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">Justees Admin</h1>
        </div>

        <nav className="mt-6">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-6 py-3 text-left transition-colors ${
                  activeTab === item.id
                    ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* User Menu */}
        <div className="absolute bottom-0 w-64 p-4 border-t">
          <div className="flex items-center space-x-3 mb-4">
            <img
              className="h-8 w-8 rounded-full"
              src={user?.photoURL || "https://via.placeholder.com/32"}
              alt={user?.displayName || "Admin"}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">
                {user?.displayName || "Admin"}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "dashboard" && (
          <div className="p-8">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.displayName?.split(" ")[0] || "Admin"}!
              </h2>
              <p className="mt-1 text-gray-600">
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Alerts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stats.outOfStockItems > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
                        <div>
                          <h4 className="font-medium text-red-900">
                            Out of Stock
                          </h4>
                          <p className="text-sm text-red-700">
                            {stats.outOfStockItems} products are out of stock
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {stats.lowStockItems > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertTriangle className="w-5 h-5 text-orange-600 mr-3" />
                        <div>
                          <h4 className="font-medium text-orange-900">
                            Low Stock
                          </h4>
                          <p className="text-sm text-orange-700">
                            Some products are running low on stock
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
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
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={action.action}
                        className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div
                          className={`p-2 rounded-lg bg-${action.color}-100 mr-4`}
                        >
                          <Icon
                            className={`h-6 w-6 text-${action.color}-600`}
                          />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">
                            {action.title}
                          </p>
                          <p className="text-sm text-gray-600">
                            {action.description}
                          </p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "products" && <ProductManagement />}

        {activeTab === "orders" && (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Orders Management
            </h2>
            <p className="text-gray-600">
              Orders management feature coming soon...
            </p>
          </div>
        )}

        {activeTab === "users" && (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              User Management
            </h2>
            <p className="text-gray-600">
              User management feature coming soon...
            </p>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Settings</h2>
            <p className="text-gray-600">Settings panel coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
