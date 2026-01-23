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
import ProductForm from "./ProductForm";
import ProductTable from "./ProductTable";
import ConfirmDialog from "../common/ConfirmDialog";
import LoadingSpinner from "../common/LoadingSpinner";

const ProductManagement = () => {
  const { user } = useAuth();
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

  // Check admin permissions
  useEffect(() => {
    if (!isAdminUser(user)) {
      toast.error("Unauthorized access");
      return;
    }
  }, [user]);

  // Load products and analytics
  useEffect(() => {
    loadProducts();
    loadAnalytics();
  }, []);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Product Management
              </h1>
              <p className="mt-2 text-gray-600">
                Manage your product catalog, inventory, and settings
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreateProduct}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add Product</span>
            </motion.button>
          </div>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Products
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.totalProducts}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Sales
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.totalSales}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Low Stock</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {
                      products.filter(
                        (p) =>
                          (p.totalStock || 0) > 0 && (p.totalStock || 0) <= 5,
                      ).length
                    }
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Out of Stock
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {analytics.outOfStock}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
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
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="out-of-stock">Out of Stock</option>
                <option value="low-stock">Low Stock</option>
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
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="price-asc">Price Low-High</option>
                <option value="price-desc">Price High-Low</option>
                <option value="totalStock-desc">Stock High-Low</option>
                <option value="views-desc">Most Viewed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="large" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-gray-600 mb-4">
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
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
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
