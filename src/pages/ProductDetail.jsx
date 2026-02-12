import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion"; // eslint-disable-line
import {
  ShoppingCart,
  Heart,
  Share2,
  Truck,
  Shield,
  RefreshCw,
  Star,
  ChevronLeft,
  ChevronRight,
  Check,
  Minus,
  Plus,
  Package,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useTheme } from "../contexts/ThemeContext";
import { useCart } from "../contexts/CartContext";
import { getAllProducts } from "../services/products.service";
import { getProductReviews, addReview } from "../services/reviews.service";
import { formatPrice } from "../utils/validation";
import { generateWhatsAppInquiryLink } from "../utils/whatsapp";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import LoadingSpinner from "../components/common/LoadingSpinner";
import LazyImage from "../components/common/LazyImage";
import TiltCard from "../components/common/TiltCard";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [productReviews, setProductReviews] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [isWishlist, setIsWishlist] = useState(false);
  const [activeTab, setActiveTab] = useState("description");

  // Review form state
  const [reviewForm, setReviewForm] = useState({
    customerName: "",
    email: "",
    rating: 5,
    review: "",
  });

  const [currentReviewSlide, setCurrentReviewSlide] = useState(0);
  const REVIEWS_PER_PAGE = 3;
  const totalSlides = Math.ceil(productReviews.length / REVIEWS_PER_PAGE);

  // Auto-slide reviews
  useEffect(() => {
    if (productReviews.length <= REVIEWS_PER_PAGE) return;

    const timer = setInterval(() => {
      setCurrentReviewSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);

    return () => clearInterval(timer);
  }, [productReviews.length, totalSlides]);

  const averageRating = useCallback(() => {
    if (productReviews.length > 0) {
      return (
        productReviews.reduce((acc, rev) => acc + Number(rev.rating), 0) /
        productReviews.length
      );
    }
    return product?.rating || 0;
  }, [productReviews, product])();

  const reviewCount = useCallback(() => {
    return productReviews.length > 0
      ? productReviews.length
      : product?.reviewCount || 0;
  }, [productReviews, product])();

  const loadProduct = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getAllProducts({
        status: "active",
        isVisible: true,
        limitCount: 100,
      });

      if (result.success) {
        const foundProduct = result.products.find((p) => p.id === id);
        if (foundProduct) {
          setProduct(foundProduct);
          // Set default selections if variants exist
          if (foundProduct.variants && foundProduct.variants.length > 0) {
            const availableSizes = [
              ...new Set(foundProduct.variants.map((v) => v.size)),
            ];
            const availableColors = [
              ...new Set(foundProduct.variants.map((v) => v.color)),
            ];
            if (availableSizes.length > 0) setSelectedSize(availableSizes[0]);
            if (availableColors.length > 0)
              setSelectedColor(availableColors[0]);
          }
        } else {
          toast.error("Product not found");
          navigate("/products");
        }
      } else {
        toast.error("Failed to load product");
      }
    } catch (error) {
      console.error("Error loading product:", error);
      toast.error("Error loading product");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const loadProductReviews = useCallback(async () => {
    if (!id) return;
    try {
      console.log("Fetching reviews for product ID:", id);
      const result = await getProductReviews(id, 50);
      if (result.success) {
        console.log(`Successfully fetched ${result.reviews.length} reviews`);
        setProductReviews(result.reviews);
      } else {
        console.error("Failed to fetch reviews:", result.error);
        toast.error("Low-level error loading reviews. Please check console.");
      }
    } catch (error) {
      console.error("Error loading product reviews:", error);
    }
  }, [id]);

  useEffect(() => {
    loadProductReviews();
  }, [loadProductReviews]);

  const loadRelatedProducts = useCallback(async () => {
    if (!product) return;

    try {
      const result = await getAllProducts({
        category: product.category,
        status: "active",
        isVisible: true,
        limitCount: 4,
      });

      if (result.success) {
        // Filter out current product
        const related = result.products.filter((p) => p.id !== product.id);
        setRelatedProducts(related.slice(0, 4));
      }
    } catch (error) {
      console.error("Error loading related products:", error);
    }
  }, [product]);

  useEffect(() => {
    loadRelatedProducts();
  }, [loadRelatedProducts]);

  const getAvailableSizes = () => {
    if (!product?.variants) return [];
    return [...new Set(product.variants.map((v) => v.size))];
  };

  const getAvailableColors = () => {
    if (!product?.variants) return [];
    return [...new Set(product.variants.map((v) => v.color))];
  };

  const getSelectedVariant = () => {
    if (!product?.variants || !selectedSize || !selectedColor) return null;
    return product.variants.find(
      (v) => v.size === selectedSize && v.color === selectedColor
    );
  };

  const getAvailableStock = () => {
    const variant = getSelectedVariant();
    if (variant) return variant.stock || 0;
    return product?.stock || 0;
  };

  const isOutOfStock = () => {
    const stock = getAvailableStock();
    return (
      product?.stockStatus === "out_of_stock" ||
      (product?.trackInventory && stock === 0)
    );
  };

  const handleAddToCart = () => {
    if (!product) return;

    // Check if variants are required but not selected
    if (product.variants && product.variants.length > 0) {
      if (!selectedSize || !selectedColor) {
        toast.error("Please select size and color");
        return;
      }

      const variant = getSelectedVariant();
      if (!variant || variant.stock < quantity) {
        toast.error("Selected variant is not available");
        return;
      }
    }

    addToCart({
      ...product,
      selectedVariant: getSelectedVariant(),
      selectedSize,
      selectedColor,
      quantity,
    });

    toast.success(`${product.name} added to cart!`, {
      icon: "🛒",
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/");
    // The cart drawer will open automatically from the cart context
    setTimeout(() => {
      const cartButton = document.querySelector('[data-cart-button]');
      if (cartButton) cartButton.click();
    }, 100);
  };

  const handleWhatsAppInquiry = () => {
    const message = `Hi, I'm interested in ${product.name}${selectedSize ? ` (Size: ${selectedSize})` : ""
      }${selectedColor ? ` (Color: ${selectedColor})` : ""}. Price: ${formatPrice(product.price)}`;

    const whatsappLink = generateWhatsAppInquiryLink(message);
    window.open(whatsappLink, "_blank");
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator
        .share({
          title: product.name,
          text: product.shortDescription || product.description,
          url: shareUrl,
        })
        .catch(() => {
          // User cancelled or share failed
        });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    if (
      !reviewForm.customerName ||
      !reviewForm.email ||
      !reviewForm.review ||
      !reviewForm.rating
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (reviewForm.rating < 1 || reviewForm.rating > 5) {
      toast.error("Rating must be between 1 and 5");
      return;
    }

    setReviewSubmitting(true);

    try {
      const reviewData = {
        customerName: reviewForm.customerName.trim(),
        email: reviewForm.email.trim(),
        rating: Number(reviewForm.rating),
        review: reviewForm.review.trim(),
        productId: product.id,
        productName: product.name,
        isVisible: true, // Show immediately for better user feedback
        source: "visitor", // Mark as visitor-submitted
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          reviewForm.customerName
        )}&background=d3d1ce&color=000000&size=128`,
      };

      const result = await addReview(reviewData);

      if (result.success) {
        toast.success("Review submitted");
        // Reset form
        setReviewForm({
          customerName: "",
          email: "",
          rating: 5,
          review: "",
        });
        // Reload reviews to show the new one immediately
        loadProductReviews();
      } else {
        toast.error(
          result.error || "Failed to submit review. Please try again."
        );
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const getProductImages = () => {
    if (!product?.images || product.images.length === 0) {
      return [
        `/api/placeholder/800/800?text=${encodeURIComponent(product?.name || "Product")}`,
      ];
    }
    return product.images.map((img) =>
      typeof img === "object" ? img.url : img
    );
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="large" />
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Product not found</h2>
            <Link
              to="/products"
              className="hover:underline"
              style={{ color: '#d3d1ce' }}
            >
              Return to products
            </Link>
          </div>
        </div>
      </>
    );
  }

  const images = getProductImages();
  const availableSizes = getAvailableSizes();
  const availableColors = getAvailableColors();
  const stock = getAvailableStock();
  const outOfStock = isOutOfStock();

  return (
    <>
      <Navbar />
      <div
        className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"} pt-20`}
      >
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center space-x-2 text-sm">
            <Link
              to="/"
              className={`hover:text-blue-600 ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              Home
            </Link>
            <span className={isDark ? "text-gray-600" : "text-gray-400"}>/</span>
            <Link
              to="/products"
              className={`hover:text-blue-600 ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              Products
            </Link>
            <span className={isDark ? "text-gray-600" : "text-gray-400"}>/</span>
            <Link
              to={`/categories?category=${product.category}`}
              className={`hover:text-blue-600 ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              {product.category}
            </Link>
            <span className={isDark ? "text-gray-600" : "text-gray-400"}>/</span>
            <span className={isDark ? "text-gray-300" : "text-gray-900"}>
              {product.name}
            </span>
          </div>
        </div>

        {/* Product Details Section */}
        <div className="container mx-auto px-4 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <motion.div
                className={`relative rounded-2xl overflow-hidden aspect-square ${isDark ? "bg-gray-800" : "bg-white"} shadow-xl`}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full"
                  >
                    <LazyImage
                      src={images[selectedImage]}
                      alt={`${product.name} - Image ${selectedImage + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                </AnimatePresence>

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
                  {product.isFeatured && (
                    <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Featured
                    </span>
                  )}
                </div>

                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setSelectedImage((prev) =>
                          prev === 0 ? images.length - 1 : prev - 1
                        )
                      }
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 p-2 rounded-full shadow-lg transition-all"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() =>
                        setSelectedImage((prev) =>
                          prev === images.length - 1 ? 0 : prev + 1
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 p-2 rounded-full shadow-lg transition-all"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </motion.div>

              {/* Thumbnail Images */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {images.map((img, index) => (
                    <motion.button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative rounded-lg overflow-hidden aspect-square ${selectedImage === index
                        ? "ring-4 ring-blue-500"
                        : "ring-2 ring-transparent hover:ring-gray-300"
                        } transition-all`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <LazyImage
                        src={img}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {/* Product Title & Actions */}
              <div>
                <h1
                  className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  {product.name}
                </h1>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    {/* Rating */}
                    {(averageRating > 0 || reviewCount > 0) && (
                      <div className="flex items-center space-x-1">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < Math.floor(averageRating)
                                ? "text-yellow-500 fill-current"
                                : "text-gray-300"
                                }`}
                            />
                          ))}
                        </div>
                        <span
                          className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                        >
                          ({reviewCount} reviews)
                        </span>
                      </div>
                    )}

                    {/* Stock Status */}
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${outOfStock
                        ? "bg-red-100 text-red-800"
                        : stock <= 5
                          ? "bg-orange-100 text-orange-800"
                          : "bg-green-100 text-green-800"
                        }`}
                    >
                      {outOfStock
                        ? "Out of Stock"
                        : stock <= 5
                          ? `Only ${stock} left`
                          : "In Stock"}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsWishlist(!isWishlist)}
                      className={`p-2 rounded-full transition-colors ${isWishlist
                        ? "bg-red-500 text-white"
                        : isDark
                          ? "bg-gray-800 text-gray-300 hover:bg-red-500 hover:text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-red-500 hover:text-white"
                        }`}
                    >
                      <Heart
                        className={`w-5 h-5 ${isWishlist ? "fill-current" : ""}`}
                      />
                    </button>
                    <button
                      onClick={handleShare}
                      className={`p-2 rounded-full transition-colors ${isDark
                        ? "bg-gray-800 text-gray-300"
                        : "bg-gray-100 text-gray-600"
                        }
                      style={selectedVariant?.id === variant.id ? { ring: '4px solid #d3d1ce' } : {}}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#d3d1ce'; e.currentTarget.style.color = 'white'; }}
                      onMouseLeave={(e) => { 
                        if (selectedVariant?.id !== variant.id) {
                          e.currentTarget.style.backgroundColor = isDark ? '#1f2937' : '#f3f4f6';
                          e.currentTarget.style.color = isDark ? '#d1d5db' : '#4b5563';
                        }
                      }}`}
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="py-4 border-y border-gray-200 dark:border-gray-700">
                <div className="flex items-baseline space-x-3">
                  <span
                    className={`text-4xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice &&
                    Number(product.originalPrice) > Number(product.price) && (
                      <>
                        <span
                          className={`text-2xl line-through ${isDark ? "text-gray-500" : "text-gray-400"}`}
                        >
                          {formatPrice(product.originalPrice)}
                        </span>
                        <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-semibold">
                          Save{" "}
                          {Math.round(
                            ((Number(product.originalPrice) -
                              Number(product.price)) /
                              Number(product.originalPrice)) *
                            100
                          )}
                          %
                        </span>
                      </>
                    )}
                </div>
              </div>

              {/* Short Description */}
              {product.shortDescription && (
                <p
                  className={`text-lg ${isDark ? "text-gray-300" : "text-gray-600"}`}
                >
                  {product.shortDescription}
                </p>
              )}

              {/* Size Selection */}
              {availableSizes.length > 0 && (
                <div>
                  <label
                    className={`block text-sm font-medium mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Select Size
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {availableSizes.map((size) => {
                      const variant = product.variants.find(
                        (v) => v.size === size && v.color === selectedColor
                      );
                      const isAvailable = variant && variant.stock > 0;

                      return (
                        <button
                          key={size}
                          onClick={() => isAvailable && setSelectedSize(size)}
                          disabled={!isAvailable}
                          className={`px-6 py-3 rounded-lg font-medium border-2 transition-all ${selectedSize === size
                            ? "border-blue-500 bg-blue-500 text-white"
                            : isAvailable
                              ? isDark
                                ? "border-gray-600 text-gray-300 hover:border-blue-500"
                                : "border-gray-300 text-gray-700 hover:border-blue-500"
                              : "border-gray-300 text-gray-400 cursor-not-allowed opacity-50"
                            }`}
                        >
                          {size}
                          {!isAvailable && (
                            <span className="block text-xs mt-1">
                              Out of stock
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Color Selection */}
              {availableColors.length > 0 && (
                <div>
                  <label
                    className={`block text-sm font-medium mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Select Color
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {availableColors.map((color) => {
                      const variant = product.variants.find(
                        (v) => v.color === color && v.size === selectedSize
                      );
                      const isAvailable = variant && variant.stock > 0;

                      return (
                        <button
                          key={color}
                          onClick={() => isAvailable && setSelectedColor(color)}
                          disabled={!isAvailable}
                          className={`relative px-6 py-3 rounded-lg font-medium border-2 transition-all ${selectedColor === color
                            ? "border-blue-500 ring-2 ring-blue-500 ring-offset-2"
                            : isAvailable
                              ? isDark
                                ? "border-gray-600 hover:border-blue-500"
                                : "border-gray-300 hover:border-blue-500"
                              : "border-gray-300 cursor-not-allowed opacity-50"
                            } ${isDark ? "text-gray-300" : "text-gray-700"}`}
                          style={{
                            backgroundColor:
                              selectedColor === color
                                ? color
                                : "transparent",
                            color:
                              selectedColor === color
                                ? getContrastColor(color)
                                : undefined,
                          }}
                        >
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                              style={{ backgroundColor: color }}
                            />
                            <span>{color}</span>
                            {selectedColor === color && (
                              <Check className="w-4 h-4 ml-1" />
                            )}
                          </div>
                          {!isAvailable && (
                            <span className="block text-xs mt-1">
                              Out of stock
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Selection */}
              <div>
                <label
                  className={`block text-sm font-medium mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  Quantity
                </label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border-2 border-gray-300 dark:border-gray-600 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className={`p-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isDark ? "text-gray-300" : "text-gray-700"}`}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span
                      className={`px-6 py-2 min-w-[60px] text-center font-medium ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity(Math.min(stock, quantity + 1))
                      }
                      disabled={quantity >= stock}
                      className={`p-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isDark ? "text-gray-300" : "text-gray-700"} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {stock > 0 && (
                    <span
                      className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      {stock} available
                    </span>
                  )}
                </div>
              </div>

              {/* Add to Cart Buttons */}
              <div className="space-y-3 pt-4">
                <button
                  onClick={handleAddToCart}
                  disabled={outOfStock}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-2 ${outOfStock
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : ""
                    }
                  style={!isOutOfStock && !isAddingToCart ? { backgroundColor: '#d3d1ce', color: 'white' } : {}}`}
                >
                  <ShoppingCart className="w-6 h-6" />
                  <span>{outOfStock ? "Out of Stock" : "Add to Cart"}</span>
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={outOfStock}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${outOfStock
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : isDark
                      ? "bg-gray-800 hover:bg-gray-700 text-white"
                      : "bg-gray-900 hover:bg-gray-800 text-white"
                    }`}
                >
                  Buy Now
                </button>

                <button
                  onClick={handleWhatsAppInquiry}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 border-2 ${isDark
                    ? "border-gray-600 text-gray-300 hover:bg-green-600 hover:text-white hover:border-green-600"
                    : "border-gray-300 text-gray-700 hover:bg-green-600 hover:text-white hover:border-green-600"
                    }`}
                >
                  Inquire on WhatsApp
                </button>
              </div>

              {/* Features */}
              <div
                className={`grid grid-cols-1 md:grid-cols-3 gap-4 p-6 rounded-xl ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
              >
                <div className="flex items-center space-x-3">
                  <Truck
                    className={`w-8 h-8 ${isDark ? "text-blue-400" : "text-blue-600"}`}
                  />
                  <div>
                    <p
                      className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      Free Delivery
                    </p>
                    <p
                      className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      On orders above Rs. 4,000
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <RefreshCw
                    className={`w-8 h-8 ${isDark ? "text-blue-400" : "text-blue-600"}`}
                  />
                  <div>
                    <p
                      className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      Easy Returns
                    </p>
                    <p
                      className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      7-day return policy
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield
                    className={`w-8 h-8 ${isDark ? "text-blue-400" : "text-blue-600"}`}
                  />
                  <div>
                    <p
                      className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      Secure Payment
                    </p>
                    <p
                      className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      100% secure checkout
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Product Details Tabs */}
          <div className="mt-16">
            <div
              className={`rounded-2xl overflow-hidden ${isDark ? "bg-gray-800" : "bg-white"} shadow-lg`}
            >
              {/* Tab Headers */}
              <div
                className={`flex border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}
              >
                {["description", "specifications", "shipping"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-4 px-6 font-medium text-center transition-colors ${activeTab === tab
                      ? isDark
                        ? "bg-gray-700 text-blue-400 border-b-2 border-blue-400"
                        : "bg-gray-50 text-blue-600 border-b-2 border-blue-600"
                      : isDark
                        ? "text-gray-400 hover:text-gray-200"
                        : "text-gray-600 hover:text-gray-900"
                      }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-8">
                <AnimatePresence mode="wait">
                  {activeTab === "description" && (
                    <motion.div
                      key="description"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`prose max-w-none ${isDark ? "prose-invert" : ""}`}
                    >
                      <h3
                        className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        Product Description
                      </h3>
                      <p
                        className={`whitespace-pre-line ${isDark ? "text-gray-300" : "text-gray-600"}`}
                      >
                        {product.description}
                      </p>

                      {product.tags && product.tags.length > 0 && (
                        <div className="mt-6">
                          <h4
                            className={`text-lg font-semibold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}
                          >
                            Tags
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {product.tags.map((tag, index) => (
                              <span
                                key={index}
                                className={`px-3 py-1 rounded-full text-sm ${isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"}`}
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === "specifications" && (
                    <motion.div
                      key="specifications"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <h3
                        className={`text-xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        Specifications
                      </h3>
                      <div
                        className={`grid grid-cols-1 md:grid-cols-2 gap-4`}
                      >
                        <div
                          className={`p-4 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-50"}`}
                        >
                          <span
                            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                          >
                            Category
                          </span>
                          <p
                            className={`font-medium mt-1 ${isDark ? "text-white" : "text-gray-900"}`}
                          >
                            {product.category}
                          </p>
                        </div>
                        <div
                          className={`p-4 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-50"}`}
                        >
                          <span
                            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                          >
                            SKU
                          </span>
                          <p
                            className={`font-medium mt-1 ${isDark ? "text-white" : "text-gray-900"}`}
                          >
                            {product.sku || "N/A"}
                          </p>
                        </div>
                        <div
                          className={`p-4 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-50"}`}
                        >
                          <span
                            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                          >
                            Availability
                          </span>
                          <p
                            className={`font-medium mt-1 ${isDark ? "text-white" : "text-gray-900"}`}
                          >
                            {outOfStock ? "Out of Stock" : `In Stock (${stock})`}
                          </p>
                        </div>
                        {product.brand && (
                          <div
                            className={`p-4 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-50"}`}
                          >
                            <span
                              className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                            >
                              Brand
                            </span>
                            <p
                              className={`font-medium mt-1 ${isDark ? "text-white" : "text-gray-900"}`}
                            >
                              {product.brand}
                            </p>
                          </div>
                        )}
                        {availableSizes.length > 0 && (
                          <div
                            className={`p-4 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-50"}`}
                          >
                            <span
                              className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                            >
                              Available Sizes
                            </span>
                            <p
                              className={`font-medium mt-1 ${isDark ? "text-white" : "text-gray-900"}`}
                            >
                              {availableSizes.join(", ")}
                            </p>
                          </div>
                        )}
                        {availableColors.length > 0 && (
                          <div
                            className={`p-4 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-50"}`}
                          >
                            <span
                              className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                            >
                              Available Colors
                            </span>
                            <p
                              className={`font-medium mt-1 ${isDark ? "text-white" : "text-gray-900"}`}
                            >
                              {availableColors.join(", ")}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "shipping" && (
                    <motion.div
                      key="shipping"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <h3
                        className={`text-xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        Shipping & Returns
                      </h3>
                      <div className="space-y-6">
                        <div className="flex items-start space-x-4">
                          <Package
                            className={`w-6 h-6 mt-1 ${isDark ? "text-blue-400" : "text-blue-600"}`}
                          />
                          <div>
                            <h4
                              className={`font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
                            >
                              Shipping Information
                            </h4>
                            <p
                              className={`${isDark ? "text-gray-300" : "text-gray-600"}`}
                            >
                              We offer free shipping on orders above Rs. 4,000.
                              Standard delivery takes 3-5 business days. Express
                              delivery is available for an additional fee.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-4">
                          <RefreshCw
                            className={`w-6 h-6 mt-1 ${isDark ? "text-blue-400" : "text-blue-600"}`}
                          />
                          <div>
                            <h4
                              className={`font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
                            >
                              Return Policy
                            </h4>
                            <p
                              className={`${isDark ? "text-gray-300" : "text-gray-600"}`}
                            >
                              You can return any item within 7 days of delivery
                              for a full refund. Items must be unused and in
                              original packaging. Return shipping is free for
                              defective items.
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Product Reviews */}
          <div className="mt-16">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
              <div>
                <h2
                  className={`text-4xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  Customer Stories
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex">
                    {(() => {
                      const avgRating = productReviews.length > 0
                        ? productReviews.reduce((acc, rev) => acc + Number(rev.rating), 0) / productReviews.length
                        : product.rating || 0;
                      return [...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < Math.floor(avgRating)
                            ? "text-yellow-500 fill-current"
                            : "text-gray-300"
                            }`}
                        />
                      ));
                    })()}
                  </div>
                  <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    Based on {reviewCount} reviews
                  </span>
                </div>
              </div>
            </div>
            {productReviews.length > 0 ? (
              <div className="relative overflow-hidden px-4 py-8">
                <div className="max-w-7xl mx-auto">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentReviewSlide}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                      {productReviews
                        .slice(
                          currentReviewSlide * REVIEWS_PER_PAGE,
                          (currentReviewSlide + 1) * REVIEWS_PER_PAGE
                        )
                        .map((review, index) => (
                          <motion.div
                            key={review.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`p-1 rounded-2xl ${isDark ? "bg-gradient-to-br from-white/10 to-transparent" : "bg-gradient-to-br from-gray-100 to-transparent"}`}
                          >
                            <div
                              className={`h-full p-6 rounded-2xl ${isDark
                                ? "bg-gray-800/80 backdrop-blur-xl border-white/5"
                                : "bg-white border-gray-100 shadow-sm"
                                } border hover:shadow-2xl transition-all duration-300`}
                            >
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${i < Number(review.rating)
                                        ? "text-yellow-500 fill-current"
                                        : isDark
                                          ? "text-gray-600"
                                          : "text-gray-300"
                                        }`}
                                    />
                                  ))}
                                </div>
                                <div
                                  className={`text-[10px] uppercase font-bold tracking-widest ${isDark ? "text-gray-500" : "text-gray-400"}`}
                                >
                                  Customer
                                </div>
                              </div>
                              <p
                                className={`mb-6 italic leading-relaxed text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}
                              >
                                "{review.review}"
                              </p>
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isDark ? "bg-white/10 text-white" : "bg-gray-100 text-gray-900"}`}
                                >
                                  {review.customerName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <h4
                                    className={`font-bold text-sm ${isDark ? "text-white" : "text-gray-900"}`}
                                  >
                                    {review.customerName}
                                  </h4>
                                  <p
                                    className={`text-[10px] ${isDark ? "text-gray-500" : "text-gray-400"}`}
                                  >
                                    {review.createdAt?.toDate
                                      ? new Date(
                                        review.createdAt.toDate(),
                                      ).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })
                                      : ""}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                    </motion.div>
                  </AnimatePresence>

                  {/* Navigation Dots */}
                  {totalSlides > 1 && (
                    <div className="flex justify-center mt-12 gap-3">
                      {[...Array(totalSlides)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentReviewSlide(i)}
                          className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${currentReviewSlide === i
                            ? `w-8 ${isDark ? "bg-blue-400" : "bg-blue-600"}`
                            : `${isDark ? "bg-gray-700" : "bg-gray-200"}`
                            }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={`text-center py-16 p-8 rounded-[2rem] border ${isDark ? "bg-gray-800/50 border-white/5" : "bg-gray-50 border-gray-200"} border-dashed`}>
                <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center ${isDark ? "bg-gray-700" : "bg-white shadow-sm"}`}>
                  <Star className={`w-8 h-8 ${isDark ? "text-gray-500" : "text-gray-300"}`} />
                </div>
                <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                  No Stories Shared Yet
                </h3>
                <p className={`${isDark ? "text-gray-500" : "text-gray-500"}`}>
                  Be the first to tell us about your experience with this product.
                </p>
              </div>
            )}
          </div>

          {/* Visitor Review Submission */}
          <div className="mt-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              <h2
                className={`text-4xl font-extrabold mb-4 ${isDark ? "text-white" : "text-gray-900"
                  }`}
              >
                Share Your Story
              </h2>
              <p
                className={`${isDark ? "text-gray-400" : "text-gray-600"
                  } text-lg`}
              >
                How was your experience with {product.name}?
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="max-w-4xl"
            >
              <div className="relative pt-8">
                <form onSubmit={handleReviewSubmit} className="relative z-10 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        className={`block text-xs uppercase tracking-widest font-bold mb-3 ${isDark ? "text-gray-500" : "text-gray-400"
                          }`}
                      >
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={reviewForm.customerName}
                        onChange={(e) =>
                          setReviewForm({
                            ...reviewForm,
                            customerName: e.target.value,
                          })
                        }
                        className={`w-full px-5 py-4 rounded-xl border transition-all duration-300 outline-none ${isDark
                          ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500"
                          : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:shadow-lg"
                          }`}
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-xs uppercase tracking-widest font-bold mb-3 ${isDark ? "text-gray-500" : "text-gray-400"
                          }`}
                      >
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={reviewForm.email}
                        onChange={(e) =>
                          setReviewForm({
                            ...reviewForm,
                            email: e.target.value,
                          })
                        }
                        className={`w-full px-5 py-4 rounded-xl border transition-all duration-300 outline-none ${isDark
                          ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500"
                          : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:shadow-lg"
                          }`}
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-4 ${isDark ? "text-gray-300" : "text-gray-700"
                        }`}
                    >
                      Rate your experience
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.button
                          key={star}
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() =>
                            setReviewForm({ ...reviewForm, rating: star })
                          }
                          className="focus:outline-none p-1"
                        >
                          <Star
                            className={`w-10 h-10 transition-all duration-300 ${star <= reviewForm.rating
                              ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]"
                              : isDark
                                ? "text-white/10 hover:text-white/20"
                                : "text-gray-200 hover:text-gray-300"
                              }`}
                          />
                        </motion.button>
                      ))}
                      <span
                        className={`ml-4 px-4 py-1.5 rounded-full text-sm font-bold ${isDark ? "bg-white/5 text-blue-400" : "bg-blue-50 text-blue-600"
                          }`}
                      >
                        {reviewForm.rating} / 5 Quality
                      </span>
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-xs uppercase tracking-widest font-bold mb-3 ${isDark ? "text-gray-500" : "text-gray-400"
                        }`}
                    >
                      Your Story *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={reviewForm.review}
                      onChange={(e) =>
                        setReviewForm({ ...reviewForm, review: e.target.value })
                      }
                      className={`w-full px-5 py-4 rounded-xl border transition-all duration-300 outline-none resize-none ${isDark
                        ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500"
                        : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:shadow-lg"
                        }`}
                      placeholder={`Tell us about your experience with ${product.name}...`}
                    />
                  </div>

                  <div className="pt-4">
                    <motion.button
                      whileHover={{
                        scale: 1.02,
                        boxShadow: isDark ? "0 20px 40px -10px rgba(59, 130, 246, 0.2)" : "0 20px 40px -10px rgba(0, 0, 0, 0.1)"
                      }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={reviewSubmitting}
                      className={`w-full md:w-auto px-12 py-5 rounded-2xl font-bold transition-all transform disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center group ${isDark
                        ? "bg-white text-gray-900 hover:bg-gray-100"
                        : "bg-gray-900 text-white hover:bg-gray-800"
                        }`}
                    >
                      {reviewSubmitting ? (
                        <>
                          <div className={`w-5 h-5 border-2 ${isDark ? "border-gray-900" : "border-white"} border-t-transparent rounded-full animate-spin mr-3`} />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <span className="mr-2">Post Review</span>
                          <motion.div
                            animate={{ rotate: [0, 15, 0, -15, 0] }}
                            transition={{ repeat: Infinity, duration: 2.5 }}
                          >
                            <Star className="w-5 h-5 fill-current" />
                          </motion.div>
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-24 pt-16 border-t border-gray-100 dark:border-white/5">
              <div className="flex items-center justify-between mb-10">
                <h2
                  className={`text-4xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  Recommended for You
                </h2>
                <div className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                  Hand-picked based on your interests
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {relatedProducts.map((relatedProduct) => (
                  <RelatedProductCard
                    key={relatedProduct.id}
                    product={relatedProduct}
                    isDark={isDark}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

// Helper Component for Related Products
const RelatedProductCard = ({ product, isDark }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/products/${product.id}`);
    window.scrollTo(0, 0);
  };

  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) {
      return typeof product.images[0] === "object"
        ? product.images[0].url
        : product.images[0];
    }
    return `/api/placeholder/400/400?text=${encodeURIComponent(product.name || 'Product')}`;
  };

  return (
    <TiltCard className="group cursor-pointer" onClick={handleClick}>
      <div
        className={`rounded-xl overflow-hidden ${isDark ? "bg-gray-800" : "bg-white"} shadow-lg hover:shadow-2xl transition-all duration-300`}
      >
        <div className="relative aspect-square overflow-hidden">
          <LazyImage
            src={getProductImage(product)}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {product.badge && (
            <span
              className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-semibold ${product.badge === "Sale"
                ? "bg-red-500 text-white"
                : product.badge === "New"
                  ? "bg-green-500 text-white"
                  : "bg-blue-500 text-white"
                }`}
            >
              {product.badge}
            </span>
          )}
        </div>
        <div className="p-4">
          <h3
            className={`font-semibold mb-2 line-clamp-2 ${isDark ? "text-white" : "text-gray-900"}`}
          >
            {product.name}
          </h3>
          <div className="flex items-center justify-between">
            <span
              className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}
            >
              {formatPrice(product.price)}
            </span>
            {product.originalPrice &&
              Number(product.originalPrice) > Number(product.price) && (
                <span
                  className={`text-sm line-through ${isDark ? "text-gray-500" : "text-gray-400"}`}
                >
                  {formatPrice(product.originalPrice)}
                </span>
              )}
          </div>
        </div>
      </div>
    </TiltCard>
  );
};

// Helper function to determine text color based on background color
function getContrastColor(hexColor) {
  // Convert hex to RGB
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black or white based on luminance
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
}

export default ProductDetail;
