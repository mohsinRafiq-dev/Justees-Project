import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  ShoppingCart,
  Eye,
  Filter,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import { getAllProducts, getCategories } from "../services/products.service";
import { getProductPhotos } from "../services/productPhotos.service";
import LazyImage from "../components/common/LazyImage";
import Navbar from "../components/common/Navbar";
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
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const selectedCategory = searchParams.get("category") || "All";
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [searchTerm, setSearchTerm] = useState("");

  // Load products and categories once on mount
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
          getCategories(),
        ]);

        if (productsRes.success) {
          setProducts(productsRes.products);
        }

        if (categoriesRes.success) {
          setCategories(categoriesRes.categories || []);
        }
      } catch (error) {
        console.error("Error loading products/categories:", error);
        toast.error("Error loading data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Product page hero/photos (editable from admin)
  const [productPhotos, setProductPhotos] = useState([]);
  const [currentPhoto, setCurrentPhoto] = useState(0);

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const res = await getProductPhotos({ isVisible: true, limitCount: 10 });
        if (res.success) setProductPhotos(res.photos || []);
      } catch (err) {
        console.error("Error loading product page photos", err);
      }
    };

    loadPhotos();
  }, []);

  // autoplay
  useEffect(() => {
    if (!productPhotos || productPhotos.length <= 1) return;
    const id = setInterval(
      () => setCurrentPhoto((p) => (p + 1) % productPhotos.length),
      5000,
    );
    return () => clearInterval(id);
  }, [productPhotos]);

  const handleCategoryChange = (category) => {
    const newParams = new URLSearchParams(searchParams);
    if (category === "All") {
      newParams.delete("category");
    } else {
      newParams.set("category", category);
    }
    navigate(`/products?${newParams.toString()}`, { replace: true });
  };

  const filteredProducts = useMemo(() => {
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

    return filtered;
  }, [products, selectedCategory, priceRange, sortBy, sortOrder, searchTerm]);

  const { isInWishlist, toggleWishlist } = useWishlist();

  const handleQuickAdd = (product) => {
    const stock = Number(getProductStock(product));
    const isOutOfStock = product.stockStatus === "out_of_stock" || stock === 0;

    if (isOutOfStock) {
      toast.error("This product is out of stock");
      return;
    }

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
      if (typeof product.totalStock === "number") return product.totalStock;
      return product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
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
    return `https://placehold.co/400x400?text=${encodeURIComponent(product.name || "Product")}`;
  };

  const ProductCard = ({ product }) => {
    const stock = getProductStock(product);
    const isOutOfStock = product.stockStatus === "out_of_stock" || stock === 0;
    const isLowStock = stock > 0 && stock <= 5;
    const imageUrl = getProductImage(product);

    const handleCardClick = (e) => {
      // Don't navigate if clicking on buttons
      if (e.target.closest("button")) {
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
          className={`relative rounded-2xl overflow-hidden h-full cursor-pointer ${
            isDark ? "bg-gray-800" : "bg-white"
          } shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col`}
        >
          {/* Product Image */}
          <div className="relative aspect-square overflow-hidden shrink-0">
            <LazyImage
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col space-y-2">
              {product.badge && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    product.badge === "Sale"
                      ? "bg-red-500 text-white"
                      : product.badge === "New"
                        ? "bg-green-500 text-white"
                        : product.badge === "Hot"
                          ? "bg-orange-500 text-white"
                          : "text-gray-900"
                  }`}
                  style={
                    product.badge !== "Sale" &&
                    product.badge !== "New" &&
                    product.badge !== "Hot"
                      ? { backgroundColor: "#d3d1ce" }
                      : {}
                  }
                >
                  {product.badge}
                </span>
              )}
              {isLowStock && !isOutOfStock && (
                <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  Low Stock
                </span>
              )}
            </div>

            <div className="absolute top-4 right-4 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">
              <button
                onClick={() => toggleWishlist(product)}
                className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
                  isInWishlist(product.id)
                    ? "bg-red-500 text-white"
                    : "bg-white/80 text-gray-700 hover:bg-red-500 hover:text-white"
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${isInWishlist(product.id) ? "fill-current" : ""}`}
                />
              </button>
              <button
                onClick={() => openQuickView(product)}
                className="p-2 rounded-full bg-white/80 text-gray-700 hover:text-white backdrop-blur-sm transition-colors"
                style={{ hover: { backgroundColor: "#d3d1ce" } }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#d3d1ce")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.8)")
                }
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>

            {/* Overlay for out of stock */}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center z-20 pointer-events-none">
                <span className="text-white font-bold text-xl uppercase tracking-widest border-2 border-white px-4 py-2 rounded-lg transform -rotate-12 shadow-2xl">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="p-6 flex flex-col flex-grow">
            <div className="flex items-start justify-between mb-2">
              <h3
                className={`font-semibold text-lg line-clamp-2 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {product.name}
              </h3>
              {product.isFeatured && (
                <Star className="w-5 h-5 text-yellow-500 fill-current flex-shrink-0 ml-2" />
              )}
            </div>

            <p
              className={`text-sm mb-4 line-clamp-2 ${
                isDark ? "text-gray-300" : "text-gray-600"
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
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating)
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
                  className={`text-2xl font-bold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice &&
                  Number(product.originalPrice) > Number(product.price) && (
                    <span
                      className={`text-sm ml-2 line-through ${
                        isDark ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
              </div>
              <span
                className={`font-medium ${
                  isOutOfStock ? "text-red-500" : "text-green-500"
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
                        product.variants.map((v) => v.color).filter(Boolean),
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
                    {[
                      ...new Set(
                        product.variants.map((v) => v.color).filter(Boolean),
                      ),
                    ].length > 4 && (
                      <span
                        className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      >
                        +
                        {[
                          ...new Set(
                            product.variants
                              .map((v) => v.color)
                              .filter(Boolean),
                          ),
                        ].length - 4}
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
              className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 mt-auto ${
                isOutOfStock
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "text-gray-900"
              }`}
              style={!isOutOfStock ? { backgroundColor: "#d3d1ce" } : {}}
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
        <section className="relative overflow-hidden">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }} 
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              {/* Product page images managed from Admin (Product page photos tab) */}
              {productPhotos.length > 0 ? (
                <div className="mb-8 relative">
                  {/* full-bleed, full-viewport height image (show full image without cropping) */}
                  <div className="relative left-1/2 -translate-x-1/2 w-screen max-w-none">
                    <div className="w-full overflow-hidden">
                      <img
                        src={productPhotos[currentPhoto].url}
                        alt={productPhotos[currentPhoto].title || "Products"}
                        className="w-full h-screen object-cover object-center"
                      />
                    </div>
                  </div>

                  {/* controls remain centered inside the container */}
                  {productPhotos.length > 1 && (
                    <div className="container mx-auto px-4 flex items-center justify-center gap-3 mt-3">
                      <button
                        onClick={() =>
                          setCurrentPhoto(
                            (i) =>
                              (i - 1 + productPhotos.length) %
                              productPhotos.length,
                          )
                        }
                        className="px-3 py-2 rounded-full bg-white/90 shadow-sm text-sm"
                        aria-label="Previous photo"
                      >
                        ‹
                      </button>
                      <div
                        className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}
                      >
                        {productPhotos[currentPhoto].title || ""}
                      </div>
                      <button
                        onClick={() =>
                          setCurrentPhoto((i) => (i + 1) % productPhotos.length)
                        }
                        className="px-3 py-2 rounded-full bg-white/90 shadow-sm text-sm"
                        aria-label="Next photo"
                      >
                        ›
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </motion.div>
          </div>
        </section>

        {/* Filters Section */}
        <section id="products-grid" className="py-8 scroll-mt-24">
          <div className="container mx-auto px-4">
            <div
              className={`rounded-2xl p-6 mb-8 ${
                isDark ? "bg-gray-800" : "bg-white"
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
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    }`}
                    style={{ focusRing: "#d3d1ce" }}
                    onFocus={(e) =>
                      (e.currentTarget.style.outlineColor = "#d3d1ce")
                    }
                  />
                </div>

                {/* Category Filter */}
                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                    onFocus={(e) =>
                      (e.currentTarget.style.outlineColor = "#d3d1ce")
                    }
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
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                    onFocus={(e) =>
                      (e.currentTarget.style.outlineColor = "#d3d1ce")
                    }
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
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                    onFocus={(e) =>
                      (e.currentTarget.style.outlineColor = "#d3d1ce")
                    }
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
              <div
                key="loading"
                className="flex items-center justify-center py-20"
              >
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
                  className={`text-2xl font-bold mb-4 ${
                    isDark ? "text-white" : "text-gray-900"
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
                    handleCategoryChange("All");
                    setPriceRange({ min: 0, max: 1000000 });
                    setSearchTerm("");
                  }}
                  style={{ backgroundColor: "#d3d1ce" }}
                  className="text-gray-900 px-6 py-2 rounded-lg font-semibold transition-colors hover:opacity-90"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
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
    </>
  );
};

export default Products;
