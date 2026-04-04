import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion"; // eslint-disable-line
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Truck,
  Shield,
  Headphones,
  Star,
  Quote,
  TrendingUp,
  Award,
  CheckCircle,
  Menu,
  X,
  ArrowUp,
  MessageCircle,
  Lock,
  RefreshCw,
  Eye,
  ShoppingCart,
  Sun,
  Moon,
  Heart,
  Zap,
  Instagram,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { openWhatsAppInquiry } from "../utils/whatsapp";
import ProductQuickView from "../components/products/ProductQuickView";
import LazyImage from "../components/common/LazyImage";
import { useCart } from "../contexts/CartContext";
import { useTheme } from "../contexts/ThemeContext";
import { useWishlist } from "../contexts/WishlistContext";
import { subscribeToNewsletter } from "../services/newsletter.service";
import { getAllProducts, getCategories } from "../services/products.service";
import { getRecentReviews } from "../services/reviews.service";
import {
  getInstagramPosts,
  getInstagramProfileUrl,
  getInstagramHandle,
} from "../services/instagram.service";
import {
  getSlidesForHome,
  subscribeSlidesForHome,
} from "../services/slides.service";
import {
  getSiteSettings,
  subscribeSiteSettings,
} from "../services/settings.service";
import { MarkdownRenderer } from "../utils/markdown.jsx";
import Navbar from "../components/common/Navbar";
import AnimatedBackground from "../components/common/AnimatedBackground";
import AnimatedCounter from "../components/common/AnimatedCounter";
import TiltCard from "../components/common/TiltCard";

const Home = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentCategorySlide, setCurrentCategorySlide] = useState(0);
  const [categoriesPerView, setCategoriesPerView] = useState(1); // 1 on mobile, 2 on tablet, 3 on desktop
  const [showScrollTop, setShowScrollTop] = useState(false);
  const videoRefs = useRef({});
  const [videoErrors, setVideoErrors] = useState({});
  const [videoStates, setVideoStates] = useState({}); // Track play/pause states
  const [email, setEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState(""); // 'loading', 'success', 'error'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [currentReviewSlide, setCurrentReviewSlide] = useState(0);
  const REVIEWS_PER_PAGE = 1; // Show 1 review per slide on mobile
  const totalSlides = Math.ceil(reviews.length / REVIEWS_PER_PAGE);
  const [volumeTexts, setVolumeTexts] = useState(() => {
    // Quick localStorage check for instant display, then backend loads immediately
    try {
      const cached = localStorage.getItem("justees_ticker_texts");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].trim()) {
          return parsed;
        }
      }
    } catch (error) {
      // Ignore cache errors
    }
    // Minimal fallback - backend loads immediately anyway
    return ["Justees Collection"];
  }); // Ticker texts with instant backend loading

  // Instagram Posts State
  const [instagramPosts, setInstagramPosts] = useState([]);
  const [instagramLoading, setInstagramLoading] = useState(true);
  const [isRealTimeFeed, setIsRealTimeFeed] = useState(false);

  // Hero slides (loaded from Firestore or use default fallback slides)
  // default slides shown only if loading from backend fails
  const DEFAULT_SLIDES = [
    {
      id: "default-1",
      title: "Welcome to Justees",
      subtitle: "Premium Quality Clothing",
      description: "Discover style that defines you",
      url: "/JUSTEES_1920x1080.png",
      type: "image",
      order: 0,
    },
    {
      id: "default-2",
      title: "Stylish Hoodies",
      subtitle: "Winter Essentials",
      description: "Stay warm and fashionable",
      url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1920&q=80",
      type: "image",
      order: 1,
    },
    {
      id: "default-3",
      title: "Classic Designs",
      subtitle: "Timeless Style",
      description: "Quality that lasts",
      url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1920&q=80",
      type: "image",
      order: 2,
    },
  ];

  const [heroSlides, setHeroSlides] = useState([]);

  // Helper function to format price in Indian format
  const formatPrice = (price) => {
    return `Rs. ${price.toLocaleString("en-IN")}`;
  };

  // Helper function to get product image
  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) {
      return typeof product.images[0] === "object"
        ? product.images[0].url
        : product.images[0];
    }
    // Return placeholder for products without images instead of external URL
    return `https://placehold.co/400x400?text=${encodeURIComponent(product.name || "Product")}`;
  };

  // Helper function to get product stock
  const getProductStock = (product) => {
    if (product.variants && product.variants.length > 0) {
      if (typeof product.totalStock === "number") return product.totalStock;
      return product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    }
    return product.stock || 0;
  };

  // Handle responsive categories display
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCategoriesPerView(1); // Mobile: 1 category
      } else if (window.innerWidth < 1024) {
        setCategoriesPerView(2); // Tablet: 2 categories
      } else {
        setCategoriesPerView(3); // Desktop: 3 categories
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load featured products from database
  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        const result = await getAllProducts({
          status: "active",
          isVisible: true,
          featured: true,
          orderByField: "createdAt",
          orderDirection: "desc",
          limitCount: 4,
        });

        if (result.success && result.products.length > 0) {
          setFeaturedProducts(result.products);
        } else {
          // Fallback: get any 4 active products if no featured ones
          const fallbackResult = await getAllProducts({
            status: "active",
            isVisible: true,
            orderByField: "createdAt",
            orderDirection: "desc",
            limitCount: 4,
          });
          if (fallbackResult.success) {
            setFeaturedProducts(fallbackResult.products);
          }
        }
      } catch (error) {
        console.error("Error loading featured products:", error);
      }
    };

    loadFeaturedProducts();
    loadReviews();
    // also fetch settings once immediately as a fallback in case the
    // real-time listener fails (e.g. due to rules not yet deployed)
    loadSiteSettings();
  }, []);

  // Load recent reviews
  const loadReviews = async () => {
    try {
      const result = await getRecentReviews(18); // Fetch more to support multiple slides of 6
      if (result.success) {
        setReviews(result.reviews);
      }
    } catch (error) {
      console.error("Error loading reviews:", error);
    }
  };

  // Set up real-time listener for slides
  useEffect(() => {
    const unsubscribe = subscribeSlidesForHome((res) => {
      if (res.success && res.slides.length > 0) {
        // Normalize slides to expected props
        const sorted = res.slides.sort(
          (a, b) => (a.order || 0) - (b.order || 0),
        );
        const normalized = sorted.map((s, idx) => ({
          id: s.id || idx,
          title: s.title || "",
          subtitle: s.subtitle || "",
          description: s.description || "",
          url: s.url || "",
          type: s.type || "image",
          order: s.order || idx,
        }));
        setHeroSlides(normalized);
      } else {
        setHeroSlides(DEFAULT_SLIDES);
      }
    }, 10);

    // Cleanup listener on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  // Load site settings immediately for fast ticker display
  const loadSiteSettings = async () => {
    try {
      // Use cache-first approach for speed, then server for accuracy
      const result = await getSiteSettings();
      if (result.success && result.settings) {
        // Support both new array format and old single text format
        if (
          result.settings.volumeTexts &&
          Array.isArray(result.settings.volumeTexts) &&
          result.settings.volumeTexts.length > 0
        ) {
          setVolumeTexts(result.settings.volumeTexts);
          // Cache for next page load
          localStorage.setItem(
            "justees_ticker_texts",
            JSON.stringify(result.settings.volumeTexts),
          );
        } else if (result.settings.volumeText) {
          // Fallback to old single text format
          const textArray = [result.settings.volumeText];
          setVolumeTexts(textArray);
          // Cache for next page load
          localStorage.setItem(
            "justees_ticker_texts",
            JSON.stringify(textArray),
          );
        }
      }
    } catch (error) {
      console.error("Error loading site settings:", error);
      // Keep cached/default fallback value on error
    }
  };

  // Set up real-time listener for site settings
  useEffect(() => {
    // Load settings immediately for fast initial display
    loadSiteSettings();
    
    const unsubscribe = subscribeSiteSettings((result) => {
      if (result.success && result.settings) {
        // Support both new array format and old single text format
        if (
          result.settings.volumeTexts &&
          Array.isArray(result.settings.volumeTexts) &&
          result.settings.volumeTexts.length > 0
        ) {
          setVolumeTexts(result.settings.volumeTexts);
          // Cache for next page load
          localStorage.setItem(
            "justees_ticker_texts",
            JSON.stringify(result.settings.volumeTexts),
          );
        } else if (result.settings.volumeText) {
          // Fallback to old single text format
          const textArray = [result.settings.volumeText];
          setVolumeTexts(textArray);
          // Cache for next page load
          localStorage.setItem(
            "justees_ticker_texts",
            JSON.stringify(textArray),
          );
        }
      }
      // Remove fallback call since we already load immediately above
    });

    // Cleanup listener on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  // Categories
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const [categoriesRes, productsRes] = await Promise.all([
          getCategories(),
          getAllProducts({ limitCount: 1000, status: "active" }),
        ]);

        if (categoriesRes.success && productsRes.success) {
          const dbCategories = categoriesRes.categories || [];
          const products = productsRes.products || [];

          // Calculate counts
          const counts = {};
          products.forEach((p) => {
            if (p.category) counts[p.category] = (counts[p.category] || 0) + 1;
          });

          // Map to display format - Limit to 4 for Home Page if needed, or show all
          const displayCategories = dbCategories.slice(0, 4).map((cat) => ({
            ...cat,
            count: `${counts[cat.name] || 0} Items`,
            image:
              cat.image ||
              "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500&q=80",
          }));

          setCategories(displayCategories);
        }
      } catch (err) {
        console.error("Error loading categories:", err);
      }
    };

    loadCategories();
  }, []);

  // Stats
  const stats = [
    { icon: TrendingUp, value: "1000", label: "Happy Customers", suffix: "+" },
    { icon: Award, value: "1500", label: "Products Sold", suffix: "+" },
    { icon: Star, value: "4.9", label: "Average Rating", suffix: "" },
    { icon: CheckCircle, value: "100", label: "Satisfaction", suffix: "%" },
  ];

  // Auto-slide effect for slideshow functionality
  useEffect(() => {
    if (heroSlides.length <= 1) {
      setCurrentSlide(0);
      return;
    }

    // Only set timer for non-video slides (images)
    const currentSlideData = heroSlides[currentSlide];

    if (currentSlideData?.type === "video") {
      // For videos, don't set timer - let them play full duration
      // The onEnded event will handle advancing to next slide
      return;
    }

    // For images, show for 5 seconds
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [heroSlides, currentSlide]);

  // Video lifecycle management
  useEffect(() => {
    const currentSlideData = heroSlides[currentSlide];

    // Start all videos and keep them playing
    heroSlides.forEach((slide) => {
      if (slide.type === "video") {
        const videoElement = videoRefs.current[slide.id];
        if (videoElement) {
          // Add event listeners for video state tracking
          const handlePlay = () =>
            setVideoStates((prev) => ({ ...prev, [slide.id]: "playing" }));
          const handlePause = () =>
            setVideoStates((prev) => ({ ...prev, [slide.id]: "paused" }));

          videoElement.addEventListener("play", handlePlay);
          videoElement.addEventListener("pause", handlePause);

          // Only attempt to play if the video is currently paused
          if (videoElement.paused) {
            const playPromise = videoElement.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  // Video started successfully
                  setVideoErrors((prev) => ({ ...prev, [slide.id]: false }));
                  setVideoStates((prev) => ({
                    ...prev,
                    [slide.id]: "playing",
                  }));
                })
                .catch((error) => {
                  console.warn("Video autoplay failed:", error);
                  setVideoErrors((prev) => ({ ...prev, [slide.id]: true }));
                  setVideoStates((prev) => ({ ...prev, [slide.id]: "paused" }));
                });
            }
          }
        }
      }
    });

    // Keep all videos playing - don't pause any of them
    // This ensures continuous playback even when not visible
  }, [currentSlide, heroSlides]);

  // Cleanup videos on unmount (only when leaving the page entirely)
  useEffect(() => {
    return () => {
      // Only pause videos when component unmounts (navigating away from home page)
      // This preserves resources when leaving the page
      Object.values(videoRefs.current).forEach((video) => {
        if (video) {
          video.pause();
        }
      });
    };
  }, []);

  // Auto-slide reviews
  useEffect(() => {
    if (reviews.length <= REVIEWS_PER_PAGE) return;

    const timer = setInterval(() => {
      setCurrentReviewSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);

    return () => clearInterval(timer);
  }, [reviews.length, totalSlides]);

  // Keep currentSlide valid when slides change
  useEffect(() => {
    if (heroSlides.length === 0) {
      setCurrentSlide(0);
    } else if (currentSlide >= heroSlides.length) {
      setCurrentSlide(0);
    }
  }, [heroSlides.length, currentSlide]);

  // Scroll detection for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Load Instagram Posts
  useEffect(() => {
    const loadInstagramPosts = async () => {
      try {
        setInstagramLoading(true);
        const result = await getInstagramPosts(6); // Load 6 posts
        setInstagramPosts(result.posts || []);
        setIsRealTimeFeed(result.isRealTime || false);
      } catch (error) {
        console.error("Failed to load Instagram posts:", error);
        setInstagramPosts([]);
      } finally {
        setInstagramLoading(false);
      }
    };

    loadInstagramPosts();
  }, []);

  // Mobile menu is closed by default, no need for effect

  const [videoKey, setVideoKey] = useState(0); // used to remount video when only one slide

  const nextSlide = () => {
    if (heroSlides.length === 0) return;

    // Always advance to next slide, even for single video (for consistency)
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);

    // If only one slide and it's a video, ensure it keeps playing
    if (heroSlides.length === 1 && heroSlides[0].type === "video") {
      const videoElement = videoRefs.current[heroSlides[0].id];
      if (videoElement && videoElement.paused) {
        videoElement.play().catch(() => {
          setVideoErrors((prev) => ({ ...prev, [heroSlides[0].id]: true }));
        });
      }
    }
  };

  const handleVideoError = (slideId) => {
    console.error("Video failed to load for slide:", slideId);
    setVideoErrors((prev) => ({ ...prev, [slideId]: true }));
  };

  const handleVideoClick = (slideId) => {
    const videoElement = videoRefs.current[slideId];
    if (videoElement) {
      if (videoElement.paused) {
        const playPromise = videoElement.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setVideoStates((prev) => ({ ...prev, [slideId]: "playing" }));
            })
            .catch((error) => {
              console.warn("Manual video play failed:", error);
              setVideoErrors((prev) => ({ ...prev, [slideId]: true }));
              setVideoStates((prev) => ({ ...prev, [slideId]: "paused" }));
            });
        }
      } else {
        videoElement.pause();
        setVideoStates((prev) => ({ ...prev, [slideId]: "paused" }));
      }
    }
  };

  const prevSlide = () => {
    if (heroSlides.length === 0) return;
    setCurrentSlide(
      (prev) => (prev - 1 + heroSlides.length) % heroSlides.length,
    );
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setNewsletterStatus("loading");

    // Save to Firebase
    const result = await subscribeToNewsletter(email);

    if (result.success) {
      setNewsletterStatus("success");
      setEmail("");
      setTimeout(() => setNewsletterStatus(""), 5000);
    } else {
      setNewsletterStatus("error");
      setTimeout(() => setNewsletterStatus(""), 5000);
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

  const { isInWishlist, toggleWishlist } = useWishlist();

  const handleQuickAdd = (product) => {
    const stock = Number(getProductStock(product));
    const isOutOfStock = product.stockStatus === "out_of_stock" || stock === 0;

    if (isOutOfStock) {
      toast.error("This product is out of stock");
      return;
    }
    openQuickView(product);
  };

  // Generate ticker items
  const tickerItems = [];
  for (let i = 0; i < 24; i++) {
    const block = Math.floor(i / 12);
    const repeatIndex = i % 12;
    volumeTexts
      .filter((text) => text.trim())
      .forEach((text, textIndex) => {
        tickerItems.push(
          <span
            key={`${block}-${repeatIndex}-${textIndex}`}
            className="text-gray-900 text-3xl font-bold mx-6 whitespace-nowrap"
            style={{ fontFamily: "Cookie, cursive" }}
          >
            {text}
          </span>
        );
      });
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}
    >
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Navbar */}
      <Navbar />

      {/* Hero Section - Video/Image Carousel */}
      <section className="relative h-[60vh] md:h-screen overflow-hidden bg-black">
        <AnimatePresence mode="wait">
          {heroSlides.length > 0 && (
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              {heroSlides[currentSlide]?.type === "video" ? (
                <video
                  ref={(el) => (videoRefs.current[currentSlide] = el)}
                  src={heroSlides[currentSlide]?.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  onError={() => {
                    setVideoErrors((prev) => ({
                      ...prev,
                      [currentSlide]: true,
                    }));
                  }}
                />
              ) : (
                <img
                  src={heroSlides[currentSlide]?.url}
                  alt={heroSlides[currentSlide]?.title}
                  className="w-full h-full object-cover"
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/70 via-gray-800/40 to-gray-900/60" />

        {/* Content */}
        <div className="relative h-full flex items-end pb-6 md:pb-12">
          <div className="pl-8 md:pl-16 pr-8">
            <motion.div
              key={`content-${currentSlide}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-xl"
            >
              {heroSlides.length > 0 && (
                <>
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 md:mb-6 leading-tight"
                  >
                    {(() => {
                      const title = heroSlides[currentSlide]?.title || "Welcome to Justees";
                      const parts = title.split("Justees");
                      return parts.map((part, index) => (
                        <React.Fragment key={index}>
                          {part}
                          {index < parts.length - 1 && (
                            <span style={{ color: "#d3d1ce", fontFamily: "Cookie, cursive" }}>
                              Justees
                            </span>
                          )}
                        </React.Fragment>
                      ));
                    })()}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="text-base sm:text-lg md:text-2xl lg:text-3xl text-white mb-6 md:mb-8 font-light"
                  >
                    {heroSlides[currentSlide]?.subtitle ||
                      "Discover Premium Quality Clothing"}
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="flex flex-wrap gap-4"
                  >
                    <Link
                      to="/products#products-grid"
                      style={{ backgroundColor: "#d3d1ce" }}
                      className="text-gray-900 px-8 py-4 rounded-full text-lg font-semibold hover:shadow-2xl transition-all transform hover:scale-105"
                    >
                      Shop Now
                    </Link>
                  </motion.div>
                </>
              )}
            </motion.div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {heroSlides.length > 1 && (
          <>
            <button
              onClick={() =>
                setCurrentSlide(
                  (prev) =>
                    (prev - 1 + heroSlides.length) % heroSlides.length,
                )
              }
              className="absolute left-4 md:left-8 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition-all group"
            >
              <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
            </button>
            <button
              onClick={() =>
                setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
              }
              className="absolute right-4 md:right-8 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition-all group"
            >
              <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
            </button>
          </>
        )}

        {/* Slide Indicators */}
        {heroSlides.length > 1 && (
          <div className="absolute bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? "w-8 bg-white"
                    : "w-2 bg-white/50 hover:bg-white/75"
                }`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Moving Volume Name Ticker */}
      <div
        className="relative overflow-hidden py-3"
        style={{ backgroundColor: "#FFFFE3" }}
      >
        <div className="animate-marquee whitespace-nowrap">
          {tickerItems}
        </div>
      </div>

      {/* Categories */}
      <section
        id="categories-section"
        className={`py-8 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}
      >
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2
              className="text-2xl md:text-3xl font-bold mb-2"
              style={{ color: isDark ? "white" : "#000000" }}
            >
              Shop by Category
            </h2>
          </motion.div>

          {/* Responsive Category Carousel */}
          <div className="relative">
            {/* Categories Grid/Carousel */}
            <div className="overflow-hidden">
              <motion.div
                animate={{ x: `${-(currentCategorySlide * 100) / categoriesPerView}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="flex gap-4"
              >
                {categories.map((category, index) => (
                  <motion.div
                    key={`category-${index}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    style={{ width: `${100 / categoriesPerView}%` }}
                    className="flex-shrink-0"
                  >
                    <Link
                      to={`/products?category=${encodeURIComponent(category.name)}#products-grid`}
                      className="group relative overflow-hidden rounded-xl aspect-square hover:shadow-2xl transition-all block w-full text-left mx-auto md:mr-4"
                    >
                      <LazyImage
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/30 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <h3 className="text-lg md:text-2xl font-bold">{category.name}</h3>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-6 md:absolute md:mt-0 md:inset-y-0 md:inset-x-0 md:px-0 gap-4 md:gap-0">
              {/* Left Button */}
              <button
                onClick={() => setCurrentCategorySlide((prev) => Math.max(0, prev - 1))}
                disabled={currentCategorySlide === 0}
                className={`flex-shrink-0 p-2 md:p-3 rounded-full transition-all shadow-lg ${
                  currentCategorySlide === 0
                    ? "opacity-50 cursor-not-allowed bg-gray-400 dark:bg-gray-600"
                    : "bg-white/80 hover:bg-white dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white hover:shadow-xl"
                }`}
              >
                <ChevronLeft className="w-6 h-6 md:w-7 md:h-7" />
              </button>

              {/* Indicators */}
              {categories.length > categoriesPerView && (
                <div className="flex justify-center gap-2">
                  {[...Array(Math.ceil(categories.length / categoriesPerView))].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentCategorySlide(Math.min(index * categoriesPerView, categories.length - categoriesPerView))}
                      className={`h-2 rounded-full transition-all ${
                        index === Math.floor(currentCategorySlide / categoriesPerView)
                          ? "w-8 bg-gray-600 dark:bg-gray-400"
                          : "w-2 bg-gray-400 dark:bg-gray-600 hover:bg-gray-500 dark:hover:bg-gray-500"
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Right Button */}
              <button
                onClick={() => setCurrentCategorySlide((prev) => Math.min(categories.length - categoriesPerView, prev + 1))}
                disabled={currentCategorySlide >= categories.length - categoriesPerView}
                className={`flex-shrink-0 p-2 md:p-3 rounded-full transition-all shadow-lg ${
                  currentCategorySlide >= categories.length - categoriesPerView
                    ? "opacity-50 cursor-not-allowed bg-gray-400 dark:bg-gray-600"
                    : "bg-white/80 hover:bg-white dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white hover:shadow-xl"
                }`}
              >
                <ChevronRight className="w-6 h-6 md:w-7 md:h-7" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Smart Choice Ticker */}
      <div
        className="relative overflow-hidden py-3"
        style={{ backgroundColor: "#FFFFE3" }}
      >
        <div className="animate-marquee-slow whitespace-nowrap">
          {[...Array(12)].map((_, index) => (
            <span
              key={index}
              className="text-gray-900 text-3xl font-bold mx-6 whitespace-nowrap"
            >
              Smart Choice: PKR 500 Advance, FREE Delivery
            </span>
          ))}
        </div>
      </div>

      {/* Featured Products */}
      <section
        id="products-section"
        className={`py-20 ${isDark ? "bg-gray-800" : "bg-white"}`}
      >
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2
              className="text-4xl font-bold mb-4"
              style={{ color: isDark ? "white" : "#000000" }}
            >
              Featured Products
            </h2>
            <p
              className={`${isDark ? "text-gray-400" : "text-black"} text-lg`}
            >
              Our best-selling items
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product, index) => (
              <TiltCard
                key={product.id}
                className={`group cursor-pointer ${isDark ? "bg-gray-700" : "bg-gray-50"} rounded-lg overflow-hidden hover:shadow-2xl transition-all`}
                onClick={(e) => {
                  // Don't navigate if clicking on buttons
                  if (e.target.closest("button")) {
                    return;
                  }
                  navigate(`/products/${product.id}`);
                }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="relative overflow-hidden aspect-square">
                    <LazyImage
                      src={getProductImage(product)}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />

                    {/* Badge */}
                    {product.badge && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={
                          product.badge === "New"
                            ? { backgroundColor: "#d3d1ce", color: "#1f2937" }
                            : {}
                        }
                        className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold text-white z-10 ${
                          product.badge === "Sale"
                            ? "bg-red-500"
                            : product.badge === "New"
                              ? ""
                              : product.badge === "Limited"
                                ? "bg-purple-500"
                                : product.badge === "Hot"
                                  ? "bg-orange-500"
                                  : product.badge === "Featured"
                                    ? "bg-yellow-500"
                                    : "bg-gray-500"
                        } animate-pulse-glow`}
                      >
                        {product.badge}
                      </motion.span>
                    )}

                    {/* Wishlist Button */}
                    <button
                      onClick={() => toggleWishlist(product)}
                      className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-sm transition-colors z-30 ${
                        isInWishlist(product.id)
                          ? "bg-red-500 text-white"
                          : "bg-white/80 text-gray-700 hover:bg-red-500 hover:text-white"
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 ${isInWishlist(product.id) ? "fill-current" : ""}`}
                      />
                    </button>

                    {/* Hover Actions - Only show if in stock */}
                    {getProductStock(product) > 0 && (
                      <div className="absolute inset-0 bg-gray-900/0 group-hover:bg-gray-900/60 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => openQuickView(product)}
                          style={{ backgroundColor: "#d3d1ce" }}
                          className="text-gray-900 px-4 py-2 rounded-full font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Quick View
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleQuickAdd(product)}
                          className={`h-10 px-4 rounded-full font-semibold hover:shadow-lg transition-all flex items-center gap-2 whitespace-nowrap text-gray-900 bg-[#d3d1ce]`}
                        >
                          <ShoppingCart className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm">Add</span>
                        </motion.button>
                      </div>
                    )}

                    {/* Overlay for out of stock */}
                    {getProductStock(product) === 0 && (
                      <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center z-20 pointer-events-none">
                        <span className="text-white font-bold text-xl uppercase tracking-widest border-2 border-white px-4 py-2 rounded-lg transform -rotate-12 shadow-2xl">
                          Out of Stock
                        </span>
                      </div>
                    )}

                    {/* Stock Warning */}
                    {getProductStock(product) > 0 &&
                      getProductStock(product) <= 5 && (
                        <motion.div
                          initial={{ x: -100 }}
                          animate={{ x: 0 }}
                          className="absolute bottom-4 left-4 right-4 bg-red-500/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-2"
                        >
                          <Zap className="w-4 h-4" />
                          Only {getProductStock(product)} left!
                        </motion.div>
                      )}
                  </div>
                  <div className="p-6">
                    <p
                      className={`${isDark ? "text-gray-400" : "text-black"} text-sm mb-1`}
                    >
                      {product.category}
                    </p>
                    <h3
                      className={`text-xl font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      {product.name}
                    </h3>
                    {(product.shortDescription || product.description) && (
                      <MarkdownRenderer
                        content={
                          product.shortDescription || product.description
                        }
                        className={`text-sm mb-3 line-clamp-2 ${isDark ? "text-gray-300" : "text-black"}`}
                      />
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <span
                          className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                        >
                          {formatPrice(product.price)}
                        </span>
                        {product.originalPrice &&
                          product.originalPrice !== product.price && (
                            <span
                              className={`text-sm line-through ml-2 ${isDark ? "text-gray-400" : "text-black"}`}
                            >
                              {formatPrice(product.originalPrice)}
                            </span>
                          )}
                      </div>
                      <span
                        className={`text-sm ${isDark ? "text-gray-400" : "text-black"}`}
                      >
                        Stock: {getProductStock(product)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </TiltCard>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link
              to="/products"
              style={{ backgroundColor: "#d3d1ce" }}
              className="inline-block text-gray-900 px-8 py-4 rounded-full font-semibold hover:shadow-2xl transition-all transform hover:scale-105"
            >
              View All Products
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      {reviews.length > 0 && (
        <section className={`py-20 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2
                className={`text-4xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}
              >
                What Our Customers Say
              </h2>
              <p
                className={`${isDark ? "text-gray-400" : "text-black"} text-lg`}
              >
                Real reviews from real customers
              </p>
            </div>
            <div className="relative overflow-hidden px-4 py-8">
              <div className="max-w-7xl mx-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentReviewSlide}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="flex justify-center"
                  >
                    {reviews
                      .slice(
                        currentReviewSlide * REVIEWS_PER_PAGE,
                        (currentReviewSlide + 1) * REVIEWS_PER_PAGE,
                      )
                      .map((review, index) => (
                        <motion.div
                          key={review.id}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`w-full max-w-2xl p-8 rounded-2xl ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border shadow-lg hover:shadow-xl transition-all`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-5 h-5 ${
                                    i < Number(review.rating)
                                      ? "text-yellow-500 fill-current"
                                      : isDark
                                        ? "text-gray-600"
                                        : "text-gray-400"
                                  }`}
                                />
                              ))}
                            </div>
                            <Quote
                              className={`w-8 h-8 ${isDark ? "text-gray-700" : "text-gray-700"}`}
                            />
                          </div>
                          <p
                            className={`mb-6 ${isDark ? "text-gray-300" : "text-gray-700"} leading-relaxed`}
                          >
                            "{review.review}"
                          </p>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4
                                className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                              >
                                {review.customerName}
                              </h4>
                              {review.productName ? (
                                <button
                                  onClick={() =>
                                    navigate(`/products/${review.productId}`)
                                  }
                                  className={`text-sm font-medium ${isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"} transition-colors`}
                                >
                                  Product: {review.productName}
                                </button>
                              ) : (
                                <p
                                  className={`text-sm ${isDark ? "text-gray-400" : "text-black"}`}
                                >
                                  General Review
                                </p>
                              )}
                            </div>
                            <div
                              className={`text-xs ${isDark ? "text-gray-500" : "text-black"}`}
                            >
                              {review.createdAt?.toDate
                                ? new Date(
                                    review.createdAt.toDate(),
                                  ).toLocaleDateString()
                                : ""}
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
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                          currentReviewSlide === i
                            ? `w-8 ${isDark ? "bg-blue-400" : "bg-blue-600"}`
                            : `${isDark ? "bg-gray-700" : "bg-gray-200"}`
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section
        className={`py-16 ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-200"} border-t`}
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                icon: Truck,
                title: "Free Shipping",
                desc: "On orders over Rs. 5,000",
              },
              {
                icon: Shield,
                title: "Secure Payment",
                desc: "100% secure checkout",
              },
              {
                icon: RefreshCw,
                title: "Easy Returns",
                desc: "7-day return policy",
              },
              {
                icon: Headphones,
                title: "24/7 Support",
                desc: "Dedicated support team",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.05 }}
                className={`text-center p-6 rounded-lg ${isDark ? "bg-gray-700/50 hover:bg-gray-700" : "bg-white hover:shadow-lg"} transition-all cursor-pointer`}
              >
                <feature.icon
                  className="w-12 h-12 mx-auto mb-4"
                  style={{ color: isDark ? "white" : "#000000" }}
                />
                <h3
                  className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  {feature.title}
                </h3>
                <p className={isDark ? "text-gray-400" : "text-black"}>
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Trust Badges */}
          <div
            className={`mt-12 flex flex-wrap justify-center items-center gap-8 pt-8 border-t ${isDark ? "border-gray-700" : "border-gray-200"}`}
          >
            {[
              { icon: Lock, text: "SSL Secured" },
              { icon: Shield, text: "Verified Business" },
              { icon: CheckCircle, text: "Money Back Guarantee" },
              { icon: Award, text: "Premium Quality" },
            ].map((badge, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`flex items-center space-x-2 ${isDark ? "text-gray-400" : "text-black"}`}
              >
                <badge.icon className="w-5 h-5" />
                <span className="text-sm">{badge.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section
        className={`py-16 ${isDark ? "bg-gray-900 border-gray-800" : "bg-gray-100 border-gray-200"} border-t`}
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, type: "spring" }}
                whileHover={{ scale: 1.05 }}
                className="text-center"
              >
                <stat.icon
                  className="w-12 h-12 mx-auto mb-4"
                  style={{ color: isDark ? "white" : "#000000" }}
                />
                <h3
                  className="text-4xl font-bold mb-2"
                  style={{ color: isDark ? "white" : "#000000" }}
                >
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </h3>
                <p className={isDark ? "text-gray-400" : "text-black"}>
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() =>
          openWhatsAppInquiry(
            "Hello Justees,I have a question about your brand.\nLooking forward to hearing from you.",
          )
        }
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 z-50 animate-bounce"
        aria-label="Chat on WhatsApp"
      >
        <svg
          className="w-6 h-6"
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      </motion.button>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            style={{ backgroundColor: isDark ? "#374151" : "#d3d1ce" }}
            className="fixed bottom-24 right-6 text-gray-900 p-3 rounded-full shadow-lg transition-all z-50 hover:opacity-90"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Why Choose Us Section */}
      <section className={`py-20 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2
              className={`text-4xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Why Choose Justees?
            </h2>
            <p
              className={`${isDark ? "text-gray-400" : "text-black"} text-lg`}
            >
              Experience the difference
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div
              className={`text-center p-8 ${isDark ? "bg-gray-800 hover:bg-gray-700" : "bg-white hover:shadow-lg"} rounded-lg transition-all transform hover:-translate-y-2`}
            >
              <Award
                className="w-16 h-16 mx-auto mb-4"
                style={{ color: isDark ? "white" : "#000000" }}
              />
              <h3
                className={`text-xl font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Premium Quality
              </h3>
              <p className={isDark ? "text-gray-400" : "text-black"}>
                We use only the finest materials to ensure durability and
                comfort in every piece.
              </p>
            </div>
            <div
              className={`text-center p-8 ${isDark ? "bg-gray-800 hover:bg-gray-700" : "bg-white hover:shadow-lg"} rounded-lg transition-all transform hover:-translate-y-2`}
            >
              <Truck
                className="w-16 h-16 mx-auto mb-4"
                style={{ color: isDark ? "white" : "#000000" }}
              />
              <h3
                className={`text-xl font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Fast Delivery
              </h3>
              <p className={isDark ? "text-gray-400" : "text-black"}>
                Quick and reliable shipping to get your orders to you as fast as
                possible.
              </p>
            </div>
            <div
              className={`text-center p-8 ${isDark ? "bg-gray-800 hover:bg-gray-700" : "bg-white hover:shadow-lg"} rounded-lg transition-all transform hover:-translate-y-2`}
            >
              <CheckCircle
                className="w-16 h-16 mx-auto mb-4"
                style={{ color: isDark ? "white" : "#000000" }}
              />
              <h3
                className={`text-xl font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}
              >
                100% Satisfaction
              </h3>
              <p className={isDark ? "text-gray-400" : "text-black"}>
                Not happy? We offer easy returns and exchanges within 7 days.
              </p>
            </div>
          </div>
        </div>
      </section>



      {/* Instagram Feed Section */}
      <section className={`py-20 ${isDark ? "bg-gray-800" : "bg-white"}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2
              className={`text-4xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Follow Us on Instagram
            </h2>
            <p
              className={`${isDark ? "text-gray-400" : "text-black"} text-lg mb-6`}
            >
              {getInstagramHandle()} - Tag us in your photos!
            </p>
            <a
              href={getInstagramProfileUrl()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow us on Instagram"
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-full font-semibold w-max transition-transform transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 ${isDark ? "bg-pink-600 text-white hover:bg-pink-500" : "bg-pink-50 text-pink-700 hover:bg-pink-100"}`}
            >
              <Instagram className="w-5 h-5" />
              <span>Follow Us</span>
              {isRealTimeFeed && (
                <span className="ml-2 flex items-center gap-1 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Live Feed
                </span>
              )}
            </a>
          </div>

          {/* Instagram Images */}
          {/* Mobile View - Single Image */}
          <div className="md:hidden">
            <motion.a
              href={getInstagramProfileUrl()}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
              className="block relative rounded-lg overflow-hidden group cursor-pointer"
            >
              <LazyImage
                src="/Mobile res.jpeg"
                alt="Justees Instagram"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                <Instagram className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </motion.a>
          </div>

          {/* Desktop View - 7 Letter Images */}
          <div className="hidden md:grid grid-cols-4 lg:grid-cols-7 gap-2">
            {[
              { src: "/Justees Pics/J.jpeg", alt: "J" },
              { src: "/Justees Pics/U.jpeg", alt: "U" },
              { src: "/Justees Pics/S 1.jpeg", alt: "S1" },
              { src: "/Justees Pics/T.jpeg", alt: "T" },
              { src: "/Justees Pics/E 1.jpeg", alt: "E1" },
              { src: "/Justees Pics/E 2.jpeg", alt: "E2" },
              { src: "/Justees Pics/S 2.jpeg", alt: "S2" },
            ].map((image, index) => (
              <motion.a
                key={index}
                href={getInstagramProfileUrl()}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="relative aspect-square overflow-hidden rounded-lg group cursor-pointer"
              >
                <LazyImage
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                  <Instagram className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className={`py-20 ${isDark ? "bg-gray-900 border-gray-800" : "bg-gray-100 border-gray-200"} border-t`}
      >
        <div className="container mx-auto px-4 text-center">
          <h2
            className={`text-5xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Join the Justees League
          </h2>
          <p
            className={`text-xl ${isDark ? "text-gray-400" : "text-black"} mb-8 max-w-2xl mx-auto`}
          >
            Get exclusive access to new arrivals, special offers, and style
            inspiration
          </p>
          <form
            onSubmit={handleNewsletterSubmit}
            className="flex flex-col md:flex-row gap-4 justify-center max-w-md mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={newsletterStatus === "loading"}
              className={`flex-1 px-6 py-4 rounded-full ${isDark ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-900 border-gray-300"} border focus:outline-none transition-colors disabled:opacity-50`}
              style={{ focusBorderColor: "#d3d1ce" }}
            />
            <button
              type="submit"
              disabled={newsletterStatus === "loading"}
              style={{ backgroundColor: "#d3d1ce" }}
              className="text-gray-900 hover:opacity-90 px-8 py-4 rounded-full font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {newsletterStatus === "loading" ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                  Subscribing...
                </>
              ) : (
                "Subscribe"
              )}
            </button>
          </form>
          {newsletterStatus === "success" && (
            <p className="mt-4 text-green-400 animate-fade-in">
              ✓ Successfully subscribed! Check your inbox.
            </p>
          )}
          {newsletterStatus === "error" && (
            <p className="mt-4 text-red-400 animate-fade-in">
              ✗ Please enter a valid email address.
            </p>
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
  );
};

export default Home;
