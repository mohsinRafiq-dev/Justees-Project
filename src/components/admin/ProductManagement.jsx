import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Filter,
  Download,
  Upload,
  Star,
  Package,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  getAllProducts,
  deleteProduct,
  updateProduct,
  getProductAnalytics,
} from "../../services/products.service";
import { formatPrice, isAdminUser } from "../../utils/validation";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../contexts/ThemeContext";
import ProductForm from "./ProductForm";
import ProductTable from "./ProductTable";
import ConfirmDialog from "../common/ConfirmDialog";
import LoadingSpinner from "../common/LoadingSpinner";

const ProductManagement = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  // Form states
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Delete confirmation
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load products and analytics
  useEffect(() => {
    if (!isAdminUser(user)) return;
    loadProducts();
    loadAnalytics();
  }, [user]);

  // Filter products when filters change
  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, categoryFilter, statusFilter, sortBy, sortOrder]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const result = await getAllProducts({
        limitCount: 1000,
        status: null, // Load all statuses for admin
        isVisible: null, // Load all visibility states
      });

      if (result.success) {
        setProducts(result.products);
      } else {
        toast.error("Failed to load products");
      }
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Error loading products");
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const result = await getProductAnalytics();
      if (result.success) {
        setAnalytics(result.analytics);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(term) ||
          product.description.toLowerCase().includes(term) ||
          product.category.toLowerCase().includes(term) ||
          product.tags?.some((tag) => tag.toLowerCase().includes(term)),
      );
    }

    // Category filter
    if (categoryFilter && categoryFilter !== "All") {
      filtered = filtered.filter(
        (product) => product.category === categoryFilter,
      );
    }

    // Status filter
    if (statusFilter && statusFilter !== "All") {
      if (statusFilter === "active") {
        filtered = filtered.filter(
          (product) => product.status === "active" && product.isVisible,
        );
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter(
          (product) => product.status === "inactive" || !product.isVisible,
        );
      } else if (statusFilter === "out-of-stock") {
        filtered = filtered.filter(
          (product) => (product.totalStock || 0) === 0,
        );
      } else if (statusFilter === "low-stock") {
        filtered = filtered.filter(
          (product) =>
            (product.totalStock || 0) > 0 &&
            (product.totalStock || 0) <= (product.minStockLevel || 5),
        );
      }
    }

    // Sort products
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "createdAt" || sortBy === "updatedAt") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredProducts(filtered);
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleDeleteProduct = (product) => {
    setProductToDelete(product);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      setDeleteLoading(true);
      const result = await deleteProduct(productToDelete.id);

      if (result.success) {
        toast.success("Product deleted successfully");
        setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
        setProductToDelete(null);
        loadAnalytics(); // Refresh analytics
      } else {
        toast.error(result.error || "Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Error deleting product");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleVisibility = async (product) => {
    try {
      const result = await updateProduct(
        product.id,
        { isVisible: !product.isVisible },
        [],
        [],
        user?.uid,
      );

      if (result.success) {
        toast.success(
          product.isVisible
            ? "Product hidden from store"
            : "Product visible in store",
        );
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id ? { ...p, isVisible: !p.isVisible } : p,
          ),
        );
      } else {
        toast.error(result.error || "Failed to update product visibility");
      }
    } catch (error) {
      console.error("Error updating visibility:", error);
      toast.error("Error updating product");
    }
  };

  const handleToggleFeatured = async (product) => {
    try {
      const result = await updateProduct(
        product.id,
        { isFeatured: !product.isFeatured },
        [],
        [],
        user?.uid,
      );

      if (result.success) {
        toast.success(
          product.isFeatured ? "Removed from featured" : "Added to featured",
        );
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id ? { ...p, isFeatured: !p.isFeatured } : p,
          ),
        );
      } else {
        toast.error(result.error || "Failed to update featured status");
      }
    } catch (error) {
      console.error("Error updating featured status:", error);
      toast.error("Error updating product");
    }
  };

  const handleProductSave = (savedProduct) => {
    if (editingProduct) {
      // Update existing product
      setProducts((prev) =>
        prev.map((p) => (p.id === savedProduct.id ? savedProduct : p)),
      );
    } else {
      // Add new product
      setProducts((prev) => [savedProduct, ...prev]);
    }

    setShowProductForm(false);
    setEditingProduct(null);
    loadAnalytics(); // Refresh analytics
  };

  const categories = ["All", ...new Set(products.map((p) => p.category))];

  if (!isAdminUser(user)) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`backdrop-blur-xl rounded-2xl p-8 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'}`}>
          <h1 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Access Denied
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Product Management
              </h1>
              <p className={`mt-2 text-sm sm:text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Manage your product catalog, inventory, and settings
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreateProduct}
              className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 hover:from-blue-700 hover:via-cyan-700 hover:to-teal-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 shadow-lg transition-all w-full sm:w-auto"
            >
              <Plus className="w-5 h-5" />
              <span>Add Product</span>
            </motion.button>
          </div>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`backdrop-blur-xl rounded-2xl p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'} shadow-lg hover:shadow-xl transition-all`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total Products
                  </p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {analytics.totalProducts}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`backdrop-blur-xl rounded-2xl p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'} shadow-lg hover:shadow-xl transition-all`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Low Stock</p>
                  <p className="text-2xl font-bold text-orange-500">
                    {
                      products.filter(
                        (p) =>
                          (p.totalStock || 0) > 0 && (p.totalStock || 0) <= 5,
                      ).length
                    }
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-lg">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`backdrop-blur-xl rounded-2xl p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'} shadow-lg hover:shadow-xl transition-all`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Out of Stock
                  </p>
                  <p className="text-2xl font-bold text-red-500">
                    {analytics.outOfStock}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl shadow-lg">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Filters and Search */}
        <div className={`backdrop-blur-xl rounded-2xl mb-4 sm:mb-6 p-4 sm:p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'} shadow-lg`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className={`absolute left-3 top-3 h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 w-full rounded-xl px-4 py-2 transition-all focus:ring-2 focus:ring-cyan-500 focus:outline-none ${isDark ? 'bg-white/5 border border-white/10 text-white placeholder-gray-400' : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500'}`}
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`w-full rounded-xl px-4 py-2 transition-all focus:ring-2 focus:ring-cyan-500 focus:outline-none ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-white border border-gray-300 text-gray-900'}`}
              >
                {categories.map((category) => (
                  <option key={category} value={category} className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`w-full rounded-xl px-4 py-2 transition-all focus:ring-2 focus:ring-cyan-500 focus:outline-none ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-white border border-gray-300 text-gray-900'}`}
              >
                <option value="All" className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>All Status</option>
                <option value="active" className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>Active</option>
                <option value="inactive" className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>Inactive</option>
                <option value="out-of-stock" className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>Out of Stock</option>
                <option value="low-stock" className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>Low Stock</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split("-");
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className={`w-full rounded-xl px-4 py-2 transition-all focus:ring-2 focus:ring-cyan-500 focus:outline-none ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-white border border-gray-300 text-gray-900'}`}
              >
                <option value="createdAt-desc" className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>Newest First</option>
                <option value="createdAt-asc" className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>Oldest First</option>
                <option value="name-asc" className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>Name A-Z</option>
                <option value="name-desc" className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>Name Z-A</option>
                <option value="price-asc" className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>Price Low-High</option>
                <option value="price-desc" className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>Price High-Low</option>
                <option value="totalStock-desc" className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>Stock High-Low</option>
                <option value="views-desc" className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>Most Viewed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className={`backdrop-blur-xl rounded-2xl overflow-hidden border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'} shadow-lg`}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="large" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                No products found
              </h3>
              <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {searchTerm ||
                categoryFilter !== "All" ||
                statusFilter !== "All"
                  ? "Try adjusting your filters or search terms."
                  : "Get started by adding your first product."}
              </p>
              {!searchTerm &&
                categoryFilter === "All" &&
                statusFilter === "All" && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateProduct}
                    className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 hover:from-blue-700 hover:via-cyan-700 hover:to-teal-700 text-white px-6 py-2 rounded-xl font-semibold shadow-lg transition-all"
                  >
                    Add Your First Product
                  </motion.button>
                )}
            </div>
          ) : (
            <ProductTable
              products={filteredProducts}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
              onToggleVisibility={handleToggleVisibility}
              onToggleFeatured={handleToggleFeatured}
            />
          )}
        </div>

        {/* Product Form Modal */}
        {showProductForm && (
          <ProductForm
            product={editingProduct}
            onSave={handleProductSave}
            onCancel={() => {
              setShowProductForm(false);
              setEditingProduct(null);
            }}
            loading={formLoading}
          />
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmDialog
          isOpen={!!productToDelete}
          title="Delete Product"
          message={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          confirmButtonClass="bg-red-600 hover:bg-red-700"
          onConfirm={confirmDelete}
          onCancel={() => setProductToDelete(null)}
          loading={deleteLoading}
        />
      </div>
    </div>
  );
};

export default ProductManagement;
