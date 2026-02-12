import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion"; // eslint-disable-line
import { Heart, ShoppingCart, Eye, Filter, Star } from "lucide-react";
import { toast } from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useCart } from "../contexts/CartContext";
import { getAllProducts, getCategories } from "../services/products.service";
import LazyImage from "../components/common/LazyImage";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import ProductQuickView from "../components/products/ProductQuickView";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatPrice } from "../utils/validation";

const Products = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isDark } = useTheme();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [searchTerm, setSearchTerm] = useState("");

  // Load products and categories
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          getAllProducts({
            status: "active",
            isVisible: true,
            orderByField: "createdAt",
            orderDirection: "desc",
            limitCount: 100,
          }),
          getCategories()
        ]);

        if (productsRes.success) {
          setProducts(productsRes.products);
        }

        if (categoriesRes.success) {
          setCategories(categoriesRes.categories || []);
        }

        // Handle category from URL search params
        const categoryParam = searchParams.get("category");
        if (categoryParam) {
          setSelectedCategory(categoryParam);
        }
      } catch (error) {
        console.error("Error loading products/categories:", error);
        toast.error("Error loading data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  const filterAndSortProducts = useCallback(() => {
    let filtered = [...products];

    // Category filter
    if (selectedCategory !== "All") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Price range filter
    filtered = filtered.filter(
      (p) => p.price >= priceRange.min && p.price <= priceRange.max,
    );

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(term) ||
          product.description.toLowerCase().includes(term) ||
          product.tags?.some((tag) => tag.toLowerCase().includes(term)),
      );
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
  }, [products, selectedCategory, priceRange, sortBy, sortOrder, searchTerm]);

  // Filter and sort products when dependencies change
  useEffect(() => {
    filterAndSortProducts();
  }, [filterAndSortProducts]);


  const toggleWishlist = (productId) => {
    setWishlist((prev) => {
      if (prev.includes(productId)) {
        toast.error("Removed from wishlist");
        return prev.filter((id) => id !== productId);
      } else {
        toast.success("Added to wishlist! ❤️");
        return [...prev, productId];
      }
    });
  };

  const handleQuickAdd = (product) => {
    // If product has variants, open quick view to select options
    if (product.variants && product.variants.length > 0) {
      openQuickView(product);
    } else {
      // Add to cart directly
      addToCart({
        ...product,
        selectedVariant: null,
        quantity: 1,
      });
      toast.success(`${product.name} added to cart!`, {
        icon: "🛒",
      });
    }
  };

  const openQuickView = (product) => {
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
  };

  const closeQuickView = () => {
    setIsQuickViewOpen(false);
    setTimeout(() => setSelectedProduct(null), 300);
  };

  const getProductStock = (product) => {
    if (product.variants && product.variants.length > 0) {
      return product.totalStock || 0;
    }
    return product.stock || 0;
  };

  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) {
      return typeof product.images[0] === "object"
        ? product.images[0].url
        : product.images[0];
    }
    // Return placeholder instead of external URL
    return `/api/placeholder/400/400?text=${encodeURIComponent(product.name || 'Product')}`;
  };

  const ProductCard = ({ product }) => {
    const stock = getProductStock(product);
    const isOutOfStock = product.stockStatus === 'out_of_stock' || (product.trackInventory && stock === 0);
    const isLowStock = stock > 0 && stock <= 5;
    const imageUrl = getProductImage(product);

    const handleCardClick = (e) => {
      // Don't navigate if clicking on buttons
      if (e.target.closest('button')) {
        return;
      }
      navigate(`/products/${product.id}`);
    };

    return (
      <motion.div
        className="group h-full"
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div
          onClick={handleCardClick}
          className={`relative rounded-2xl overflow-hidden h-full cursor-pointer ${isDark ? "bg-gray-800" : "bg-white"
            } shadow-lg hover:shadow-2xl transition-shadow duration-300`}
        >
          {/* Product Image */}
          <div className="relative aspect-square overflow-hidden">
            <LazyImage
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col space-y-2">
              {product.badge && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${product.badge === "Sale"
                    ? "bg-red-500 text-white"
                    : product.badge === "New"
                      ? "bg-green-500 text-white"
                      : product.badge === "Hot"
                        ? "bg-orange-500 text-white"
                        : "bg-blue-500 text-white"
                    }`}
                >
                  {product.badge}
                </span>
              )}
              {isOutOfStock && (
                <span className="bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  Out of Stock
                </span>
              )}
              {isLowStock && !isOutOfStock && (
                <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  Low Stock
                </span>
              )}
            </div>

            {/* Quick Actions */}
            <div className="absolute top-4 right-4 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`p-2 rounded-full backdrop-blur-sm transition-colors ${wishlist.includes(product.id)
                  ? "bg-red-500 text-white"
                  : "bg-white/80 text-gray-700 hover:bg-red-500 hover:text-white"
                  }`}
              >
                <Heart
                  className={`w-4 h-4 ${wishlist.includes(product.id) ? "fill-current" : ""}`}
                />
              </button>
              <button
                onClick={() => openQuickView(product)}
                className="p-2 rounded-full bg-white/80 text-gray-700 hover:bg-blue-500 hover:text-white backdrop-blur-sm transition-colors"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>

            {/* Overlay for out of stock */}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
                <span className="text-white font-semibold">Out of Stock</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-2">
              <h3
                className={`font-semibold text-lg line-clamp-2 ${isDark ? "text-white" : "text-gray-900"
                  }`}
              >
                {product.name}
              </h3>
              {product.isFeatured && (
                <Star className="w-5 h-5 text-yellow-500 fill-current flex-shrink-0 ml-2" />
              )}
            </div>

            <p
              className={`text-sm mb-4 line-clamp-2 ${isDark ? "text-gray-300" : "text-gray-600"
                }`}
            >
              {product.shortDescription || product.description}
            </p>

            {/* Rating */}
            {product.rating > 0 && product.reviewCount > 0 && (
              <div className="flex items-center mb-3">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.floor(product.rating)
                        ? "text-yellow-500 fill-current"
                        : "text-gray-300"
                        }`}
                    />
                  ))}
                </div>
                <span
                  className={`text-sm ml-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  ({product.reviewCount})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <span
                  className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"
                    }`}
                >
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice &&
                  Number(product.originalPrice) > Number(product.price) && (
                    <span
                      className={`text-sm ml-2 line-through ${isDark ? "text-gray-500" : "text-gray-400"
                        }`}
                    >
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
              </div>
              <span
                className={`font-medium ${isOutOfStock ? "text-red-500" : "text-green-500"
                  }`}
              >
                {isOutOfStock ? "Out of Stock" : "In Stock"}
              </span>
            </div>

            {/* Variants Preview */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Colors:
                  </span>
                  <div className="flex space-x-1">
                    {[
                      ...new Set(
                        product.variants.map((v) => v.color).filter(Boolean)
                      ),
                    ]
                      .slice(0, 4)
                      .map((color, index) => (
                        <div
                          key={index}
                          className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    {[...new Set(product.variants.map((v) => v.color).filter(Boolean))].length > 4 && (
                      <span
                        className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      >
                        +{[...new Set(product.variants.map((v) => v.color).filter(Boolean))].length - 4}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <button
              onClick={() => handleQuickAdd(product)}
              disabled={isOutOfStock}
              className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${isOutOfStock
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : isDark
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-900 hover:bg-blue-600 text-white"
                }`}
            >
              <ShoppingCart className="w-5 h-5" />
              <span>{isOutOfStock ? "Out of Stock" : "Add to Cart"}</span>
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      <Navbar />
      <div
        className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"} pt-20`}
      >
        {/* Hero Section */}
        <section
          className={`py-16 ${isDark ? "bg-gray-800" : "bg-white"} border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}
        >
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1
                className={`text-4xl md:text-6xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"
                  }`}
              >
                Our Products
              </h1>
              <p
                className={`text-xl mb-8 max-w-2xl mx-auto ${isDark ? "text-gray-300" : "text-gray-600"
                  }`}
              >
                Discover our curated collection of premium clothing designed for
                comfort, style, and durability.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Filters Section */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div
              className={`rounded-2xl p-6 mb-8 ${isDark ? "bg-gray-800" : "bg-white"
                } shadow-lg`}
            >
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Filter
                    className={`w-5 h-5 ${isDark ? "text-gray-300" : "text-gray-600"}`}
                  />
                  <span
                    className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    Filters:
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 ${isDark
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                  />
                </div>

                {/* Category Filter */}
                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 ${isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                      }`}
                  >
                    <option value="All">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <select
                    onChange={(e) => {
                      const [min, max] = e.target.value.split("-").map(Number);
                      setPriceRange({ min, max });
                    }}
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 ${isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                      }`}
                  >
                    <option value="0-1000000">All Prices</option>
                    <option value="0-1000">Under Rs. 1,000</option>
                    <option value="1000-2500">Rs. 1,000 - 2,500</option>
                    <option value="2500-5000">Rs. 2,500 - 5,000</option>
                    <option value="5000-1000000">Above Rs. 5,000</option>
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
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 ${isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                      }`}
                  >
                    <option value="createdAt-desc">Newest First</option>
                    <option value="createdAt-asc">Oldest First</option>
                    <option value="name-asc">Name A-Z</option>
                    <option value="name-desc">Name Z-A</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="views-desc">Most Popular</option>
                  </select>
                </div>
              </div>

              {/* Results Summary */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p
                  className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}
                >
                  Showing {filteredProducts.length} of {products.length}{" "}
                  products
                </p>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <LoadingSpinner size="large" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <div
                  className={`text-6xl mb-4 ${isDark ? "text-gray-600" : "text-gray-300"}`}
                >
                  🛍️
                </div>
                <h3
                  className={`text-2xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"
                    }`}
                >
                  No products found
                </h3>
                <p
                  className={`mb-6 ${isDark ? "text-gray-300" : "text-gray-600"}`}
                >
                  Try adjusting your filters or search terms to find what you're
                  looking for.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory("All");
                    setPriceRange({ min: 0, max: 1000000 });
                    setSearchTerm("");
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <motion.div
                layout
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.08
                    }
                  }
                }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
              >
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    variants={{
                      hidden: { opacity: 0, y: 30 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </section>

        {/* Product Quick View Modal */}
        <ProductQuickView
          product={selectedProduct}
          isOpen={isQuickViewOpen}
          onClose={closeQuickView}
        />
      </div>
      <Footer />
    </>
  );
};

export default Products;
