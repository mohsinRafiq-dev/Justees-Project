import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion"; // eslint-disable-line
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Star,
  User,
  Calendar,
  Package,
  X,
  Shield,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  getAllReviews,
  addReview,
  updateReview,
  deleteReview,
  toggleReviewVisibility,
} from "../../services/reviews.service";
import { getAllProducts } from "../../services/products.service";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../contexts/ThemeContext";
import { isAdminUser } from "../../utils/validation";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const ReviewsManagement = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    customerName: "",
    rating: 5,
    review: "",
    productId: "",
    productName: "",
    isVisible: true,
  });

  useEffect(() => {
    if (!isAdminUser(user)) {
      toast.error("Unauthorized access");
      return;
    }
    loadReviews();
    loadProducts();
  }, [user]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const result = await getAllReviews({
        limitCount: 1000,
        orderByField: "createdAt",
        orderDirection: "desc",
      });

      if (result.success) {
        setReviews(result.reviews);
      } else {
        toast.error("Failed to load reviews");
      }
    } catch (error) {
      console.error("Error loading reviews:", error);
      toast.error("Error loading reviews");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const result = await getAllProducts({
        limitCount: 1000,
        status: "active",
      });
      if (result.success) {
        setProducts(result.products);
      }
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const handleCreateReview = () => {
    setEditingReview(null);
    setFormData({
      customerName: "",
      rating: 5,
      review: "",
      productId: "",
      productName: "",
      isVisible: true,
    });
    setShowForm(true);
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setFormData({
      customerName: review.customerName || "",
      rating: review.rating || 5,
      review: review.review || "",
      productId: review.productId || "",
      productName: review.productName || "",
      isVisible: review.isVisible ?? true,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customerName || !formData.review || !formData.rating) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.rating < 1 || formData.rating > 5) {
      toast.error("Rating must be between 1 and 5");
      return;
    }

    setFormLoading(true);

    try {
      const reviewData = {
        ...formData,
        rating: Number(formData.rating),
        source: 'admin', // Mark as admin-created review
      };

      let result;
      if (editingReview) {
        result = await updateReview(editingReview.id, reviewData);
      } else {
        result = await addReview(reviewData);
      }

      if (result.success) {
        toast.success(
          editingReview ? "Review updated successfully" : "Review added successfully"
        );
        setShowForm(false);
        setEditingReview(null);
        loadReviews();
      } else {
        toast.error(result.error || "Failed to save review");
      }
    } catch (error) {
      console.error("Error saving review:", error);
      toast.error("Error saving review");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteReview = (review) => {
    setReviewToDelete(review);
  };

  const confirmDelete = async () => {
    if (!reviewToDelete) return;

    try {
      setDeleteLoading(true);
      const result = await deleteReview(reviewToDelete.id);

      if (result.success) {
        toast.success("Review deleted successfully");
        setReviews((prev) => prev.filter((r) => r.id !== reviewToDelete.id));
        setReviewToDelete(null);
      } else {
        toast.error(result.error || "Failed to delete review");
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Error deleting review");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleVisibility = async (review) => {
    try {
      const result = await toggleReviewVisibility(review.id, !review.isVisible);

      if (result.success) {
        toast.success(
          review.isVisible ? "Review hidden" : "Review visible"
        );
        setReviews((prev) =>
          prev.map((r) =>
            r.id === review.id ? { ...r, isVisible: !r.isVisible } : r
          )
        );
      } else {
        toast.error(result.error || "Failed to update review visibility");
      }
    } catch (error) {
      console.error("Error updating visibility:", error);
      toast.error("Error updating review");
    }
  };

  const handleProductChange = (e) => {
    const selectedProduct = products.find((p) => p.id === e.target.value);
    setFormData({
      ...formData,
      productId: e.target.value,
      productName: selectedProduct ? selectedProduct.name : "",
    });
  };

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Reviews Management
              </h1>
              <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Manage customer reviews and testimonials
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreateReview}
              className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 hover:from-blue-700 hover:via-cyan-700 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Add Review</span>
            </motion.button>
          </div>
        </div>

        {/* Reviews Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`backdrop-blur-xl rounded-2xl p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'} shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Reviews
                </p>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {reviews.length}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                <Star className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`backdrop-blur-xl rounded-2xl p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'} shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Visible Reviews
                </p>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {reviews.filter((r) => r.isVisible).length}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
                <Eye className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`backdrop-blur-xl rounded-2xl p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'} shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Average Rating
                </p>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {reviews.length > 0
                    ? (
                        reviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
                        reviews.length
                      ).toFixed(1)
                    : "0.0"}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-lg">
                <Star className="w-6 h-6 text-white fill-current" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Reviews List */}
        <div className={`backdrop-blur-xl rounded-2xl overflow-hidden border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'} shadow-lg`}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="large" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12">
              <Star className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                No reviews yet
              </h3>
              <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Get started by adding your first review.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateReview}
                className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 hover:from-blue-700 hover:via-cyan-700 hover:to-teal-700 text-white px-6 py-2 rounded-xl font-semibold shadow-lg transition-all"
              >
                Add Your First Review
              </motion.button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Customer
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Product
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Rating
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Review
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Source
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Date
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Status
                    </th>
                    <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {reviews.map((review, index) => (
                    <motion.tr
                      key={review.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                            <User className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                          </div>
                          <div className="ml-3">
                            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {review.customerName}
                            </span>
                            {review.email && (
                              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {review.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {review.productId ? (
                            <>
                              <Package className={`w-4 h-4 mr-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                {review.productName || review.productId}
                              </span>
                            </>
                          ) : (
                            <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              General Review
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? "text-yellow-500 fill-current"
                                  : isDark ? "text-gray-600" : "text-gray-300"
                              }`}
                            />
                          ))}
                          <span className={`ml-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {review.rating}/5
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className={`text-sm line-clamp-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {review.review}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {review.source === 'visitor' ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-600 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            Visitor
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-600 flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Admin
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className={`w-4 h-4 mr-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {review.createdAt?.toDate
                              ? new Date(review.createdAt.toDate()).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {review.isVisible ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600">
                            Visible
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                            Hidden
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleToggleVisibility(review)}
                            className={`p-2 rounded-lg transition-colors ${
                              review.isVisible
                                ? "text-green-600 hover:bg-green-500/10"
                                : isDark
                                ? "text-gray-600 hover:bg-white/5"
                                : "text-gray-400 hover:bg-gray-100"
                            }`}
                            title={review.isVisible ? "Hide review" : "Show review"}
                          >
                            {review.isVisible ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleEditReview(review)}
                            className="p-2 text-cyan-600 hover:bg-cyan-500/10 rounded-lg transition-colors"
                            title="Edit review"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteReview(review)}
                            className="p-2 text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete review"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Review Form Modal */}
        <AnimatePresence>
          {showForm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`w-full max-w-2xl rounded-2xl border ${isDark ? 'bg-gray-800 border-white/10' : 'bg-white border-gray-200'} shadow-2xl`}
              >
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {editingReview ? "Edit Review" : "Add New Review"}
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                  >
                    <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        value={formData.customerName}
                        onChange={(e) =>
                          setFormData({ ...formData, customerName: e.target.value })
                        }
                        className={`w-full px-4 py-2 rounded-xl border transition-all focus:ring-2 focus:ring-cyan-500 focus:outline-none ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Rating *
                      </label>
                      <select
                        value={formData.rating}
                        onChange={(e) =>
                          setFormData({ ...formData, rating: Number(e.target.value) })
                        }
                        className={`w-full px-4 py-2 rounded-xl border transition-all focus:ring-2 focus:ring-cyan-500 focus:outline-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                        required
                      >
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <option key={rating} value={rating}>
                            {rating} Star{rating !== 1 ? "s" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Product (Optional)
                    </label>
                    <select
                      value={formData.productId}
                      onChange={handleProductChange}
                      className={`w-full px-4 py-2 rounded-xl border transition-all focus:ring-2 focus:ring-cyan-500 focus:outline-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    >
                      <option value="">General Review (No specific product)</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Review *
                    </label>
                    <textarea
                      value={formData.review}
                      onChange={(e) =>
                        setFormData({ ...formData, review: e.target.value })
                      }
                      rows="5"
                      className={`w-full px-4 py-2 rounded-xl border transition-all focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                      placeholder="Write the customer review here..."
                      required
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isVisible"
                      checked={formData.isVisible}
                      onChange={(e) =>
                        setFormData({ ...formData, isVisible: e.target.checked })
                      }
                      className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="isVisible"
                      className={`ml-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Make review visible on website
                    </label>
                  </div>

                  <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className={`px-6 py-2 rounded-xl font-medium transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
                      disabled={formLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 hover:from-blue-700 hover:via-cyan-700 hover:to-teal-700 text-white px-6 py-2 rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50"
                      disabled={formLoading}
                    >
                      {formLoading ? "Saving..." : editingReview ? "Update Review" : "Add Review"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <ConfirmDialog
          isOpen={!!reviewToDelete}
          title="Delete Review"
          message={`Are you sure you want to delete this review from "${reviewToDelete?.customerName}"? This action cannot be undone.`}
          confirmText="Delete"
          confirmButtonClass="bg-red-600 hover:bg-red-700"
          onConfirm={confirmDelete}
          onCancel={() => setReviewToDelete(null)}
          loading={deleteLoading}
        />
      </div>
    </div>
  );
};

export default ReviewsManagement;
