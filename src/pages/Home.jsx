import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ShoppingBag, Truck, Shield, Headphones, Star, Quote, TrendingUp, Award, CheckCircle, Menu, X, ArrowUp, MessageCircle, Lock, RefreshCw, Eye, ShoppingCart } from 'lucide-react';
import { openWhatsAppInquiry } from '../utils/whatsapp';
import ProductQuickView from '../components/products/ProductQuickView';
import LazyImage from '../components/common/LazyImage';
import { useCart } from '../contexts/CartContext';
import { subscribeToNewsletter } from '../services/newsletter.service';

const Home = () => {
  const { getCartCount } = useCart();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [email, setEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState(''); // 'loading', 'success', 'error'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // Hero slider images
  const heroSlides = [
    {
      id: 1,
      title: 'Premium Quality',
      subtitle: 'Elevate Your Style',
      description: 'Discover our exclusive collection of premium clothing',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80',
    },
    {
      id: 2,
      title: 'New Arrivals',
      subtitle: 'Fresh & Trendy',
      description: 'Stay ahead with our latest fashion trends',
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&q=80',
    },
    {
      id: 3,
      title: 'Limited Edition',
      subtitle: 'Exclusive Designs',
      description: 'Get your hands on our limited edition pieces',
      image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&q=80',
    },
  ];

  // Featured products
  // Helper function to format price in Indian format
  const formatPrice = (price) => {
    return `Rs. ${price.toLocaleString('en-IN')}`;
  };

  const featuredProducts = [
    {
      id: 1,
      name: 'Classic Black Tee',
      price: 1499,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80',
      category: 'T-Shirts',
      badge: 'Bestseller',
      stock: 8,
      description: 'Premium cotton t-shirt with a comfortable fit. Perfect for everyday wear.',
    },
    {
      id: 2,
      name: 'Denim Jacket',
      price: 4999,
      originalPrice: 6999,
      image: 'https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?w=500&q=80',
      category: 'Jackets',
      badge: 'Sale',
      stock: 5,
      description: 'Classic denim jacket with modern fit. Durable and stylish for any season.',
    },
    {
      id: 3,
      name: 'Casual Hoodie',
      price: 2499,
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&q=80',
      category: 'Hoodies',
      badge: 'New',
      stock: 15,
      description: 'Soft fleece hoodie with adjustable drawstrings. Cozy and warm.',
    },
    {
      id: 4,
      name: 'Slim Fit Jeans',
      price: 3499,
      image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&q=80',
      category: 'Pants',
      badge: 'Limited',
      stock: 3,
      description: 'Premium quality jeans with perfect fit. Comfortable stretch fabric.',
    },
  ];

  // Categories
  const categories = [
    {
      name: 'T-Shirts',
      image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&q=80',
      count: '50+ Items',
    },
    {
      name: 'Hoodies',
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&q=80',
      count: '30+ Items',
    },
    {
      name: 'Jackets',
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&q=80',
      count: '25+ Items',
    },
    {
      name: 'Accessories',
      image: 'https://images.unsplash.com/photo-1523359346063-d879354c0ea5?w=500&q=80',
      count: '40+ Items',
    },
  ];

  // Customer reviews
  const reviews = [
    {
      id: 1,
      name: 'Sarah Johnson',
      rating: 5,
      comment: 'Absolutely love the quality! The fabric feels premium and the fit is perfect. Will definitely order again.',
      image: 'https://i.pravatar.cc/150?img=1',
      product: 'Classic Black Tee',
    },
    {
      id: 2,
      name: 'Michael Chen',
      rating: 5,
      comment: 'Best clothing brand I have found online. Fast shipping, great customer service, and amazing products!',
      image: 'https://i.pravatar.cc/150?img=12',
      product: 'Denim Jacket',
    },
    {
      id: 3,
      name: 'Emma Davis',
      rating: 5,
      comment: 'The hoodie exceeded my expectations. Super comfortable and stylish. Worth every penny!',
      image: 'https://i.pravatar.cc/150?img=5',
      product: 'Casual Hoodie',
    },
    {
      id: 4,
      name: 'James Wilson',
      rating: 5,
      comment: 'Outstanding quality and design. These guys know what they are doing. Highly recommended!',
      image: 'https://i.pravatar.cc/150?img=13',
      product: 'Slim Fit Jeans',
    },
  ];

  // Stats
  const stats = [
    { icon: TrendingUp, value: '10K+', label: 'Happy Customers' },
    { icon: Award, value: '500+', label: 'Products Sold' },
    { icon: Star, value: '4.9', label: 'Average Rating' },
    { icon: CheckCircle, value: '100%', label: 'Satisfaction' },
  ];

  // Auto-slide effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  // Fade-in animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Scroll detection for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mobile menu is closed by default, no need for effect

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setNewsletterStatus('loading');
    
    // Save to Firebase
    const result = await subscribeToNewsletter(email);
    
    if (result.success) {
      setNewsletterStatus('success');
      setEmail('');
      setTimeout(() => setNewsletterStatus(''), 5000);
    } else {
      setNewsletterStatus('error');
      setTimeout(() => setNewsletterStatus(''), 5000);
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

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navbar */}
      <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-2xl font-bold text-white">
              Justees
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-300 hover:text-white transition-colors">
                Home
              </Link>
              <Link to="/products" className="text-gray-300 hover:text-white transition-colors">
                Products
              </Link>
              <Link to="/admin/login" className="text-gray-300 hover:text-white transition-colors">
                Admin
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {/* Cart Icon */}
              <button className="relative text-white hover:text-gray-300 transition-colors">
                <ShoppingCart className="w-6 h-6" />
                {getCartCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {getCartCount()}
                  </span>
                )}
              </button>
              
              <Link
                to="/products"
                className="hidden md:inline-block bg-white text-gray-900 px-6 py-2 rounded-full font-semibold hover:bg-gray-200 transition-all transform hover:scale-105"
              >
                Shop Now
              </Link>
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-white p-2"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden bg-gray-800 border-t border-gray-700 transition-all duration-300 overflow-hidden ${
            mobileMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="container mx-auto px-4 py-4 space-y-4">
            <Link
              to="/"
              className="block text-gray-300 hover:text-white transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/products"
              className="block text-gray-300 hover:text-white transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Products
            </Link>
            <Link
              to="/admin/login"
              className="block text-gray-300 hover:text-white transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Admin
            </Link>
            <Link
              to="/products"
              className="block bg-white text-gray-900 px-6 py-3 rounded-full font-semibold text-center hover:bg-gray-200 transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              Shop Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden mt-16">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-1000 ${
              index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 to-gray-900/50" />
            </div>
            <div className="relative h-full flex items-center">
              <div className="container mx-auto px-4">
                <div
                  className={`max-w-2xl transform transition-all duration-1000 delay-300 ${
                    index === currentSlide ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
                  }`}
                >
                  <p className="text-gray-300 text-lg mb-2 animate-fade-in">{slide.subtitle}</p>
                  <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 leading-tight">
                    {slide.title}
                  </h1>
                  <p className="text-xl text-gray-300 mb-8">{slide.description}</p>
                  <Link
                    to="/products"
                    className="inline-block bg-white text-gray-900 px-8 py-4 rounded-full font-semibold hover:bg-gray-200 transition-all transform hover:scale-105 hover:shadow-2xl"
                  >
                    Explore Collection
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Slider Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm p-3 rounded-full hover:bg-white/30 transition-all z-10"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm p-3 rounded-full hover:bg-white/30 transition-all z-10"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>

        {/* Slider Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-800 border-t border-gray-700">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: Truck, title: 'Free Shipping', desc: 'On orders over $50' },
              { icon: Shield, title: 'Secure Payment', desc: '100% secure checkout' },
              { icon: RefreshCw, title: 'Easy Returns', desc: '30-day return policy' },
              { icon: Headphones, title: '24/7 Support', desc: 'Dedicated support team' },
            ].map((feature, index) => (
              <div
                key={index}
                className={`text-center p-6 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-all transform hover:-translate-y-2 ${
                  isVisible ? 'animate-fade-in-up' : 'opacity-0'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <feature.icon className="w-12 h-12 mx-auto mb-4 text-white" />
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-8 pt-8 border-t border-gray-700">
            <div className="flex items-center space-x-2 text-gray-400">
              <Lock className="w-5 h-5" />
              <span className="text-sm">SSL Secured</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <Shield className="w-5 h-5" />
              <span className="text-sm">Verified Business</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm">Money Back Guarantee</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <Award className="w-5 h-5" />
              <span className="text-sm">Premium Quality</span>
            </div>
          </div>
        </div>
      </section>


      {/* Categories */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Shop by Category</h2>
            <p className="text-gray-400 text-lg">Discover your perfect style</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <Link
                key={index}
                to="/products"
                className="group relative overflow-hidden rounded-lg aspect-square hover:shadow-2xl transition-all transform hover:scale-105"
              >
                <LazyImage
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform">
                  <h3 className="text-2xl font-bold mb-1">{category.name}</h3>
                  <p className="text-gray-300">{category.count}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Featured Products</h2>
            <p className="text-gray-400 text-lg">Our best-selling items</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product, index) => (
              <div
                key={product.id}
                className={`group bg-gray-700 rounded-lg overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-2 ${
                  isVisible ? 'animate-fade-in-up' : 'opacity-0'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative overflow-hidden aspect-square">
                  <LazyImage
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  
                  {/* Badge */}
                  {product.badge && (
                    <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold text-white ${
                      product.badge === 'Sale' ? 'bg-red-500' :
                      product.badge === 'New' ? 'bg-blue-500' :
                      product.badge === 'Limited' ? 'bg-purple-500' :
                      'bg-yellow-500'
                    }`}>
                      {product.badge}
                    </span>
                  )}
                  
                  {/* Quick View Button */}
                  <button
                    onClick={() => openQuickView(product)}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-gray-900 px-6 py-3 rounded-full font-semibold opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Quick View
                  </button>
                  
                  <div className="absolute inset-0 bg-gray-900/0 group-hover:bg-gray-900/40 transition-all" />
                  
                  {/* Stock Warning */}
                  {product.stock && product.stock <= 5 && (
                    <div className="absolute bottom-4 left-4 right-4 bg-red-500/90 text-white text-xs font-semibold px-3 py-2 rounded-lg">
                      ⚡ Only {product.stock} left!
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <p className="text-gray-400 text-sm mb-1">{product.category}</p>
                  <h3 className="text-xl font-semibold text-white mb-2">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-white">{formatPrice(product.price)}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-400 line-through ml-2">{formatPrice(product.originalPrice)}</span>
                      )}
                    </div>
                    <button
                      onClick={() => openQuickView(product)}
                      className="bg-white text-gray-900 px-4 py-2 rounded-full font-semibold hover:bg-gray-200 transition-all transform hover:scale-105"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              to="/products"
              className="inline-block bg-white text-gray-900 px-8 py-4 rounded-full font-semibold hover:bg-gray-200 transition-all transform hover:scale-105"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-900 border-t border-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`text-center transform transition-all hover:scale-105 ${
                  isVisible ? 'animate-fade-in-up' : 'opacity-0'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <stat.icon className="w-12 h-12 mx-auto mb-4 text-white" />
                <h3 className="text-4xl font-bold text-white mb-2">{stat.value}</h3>
                <p className="text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-20 bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">What Our Customers Say</h2>
            <p className="text-gray-400 text-lg">Real reviews from real customers</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {reviews.map((review, index) => (
              <div
                key={review.id}
                className={`bg-gray-700 p-6 rounded-lg hover:bg-gray-600 transition-all transform hover:-translate-y-2 ${
                  isVisible ? 'animate-fade-in-up' : 'opacity-0'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex mb-3">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 italic">&quot;{review.comment}&quot;</p>
                <div className="flex items-center">
                  <img
                    src={review.image}
                    alt={review.name}
                    className="w-12 h-12 rounded-full mr-4 border-2 border-gray-600"
                  />
                  <div>
                    <h4 className="text-white font-semibold">{review.name}</h4>
                    <p className="text-gray-400 text-sm">{review.product}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp Floating Button */}
      <button
        onClick={() => openWhatsAppInquiry()}
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 z-50 animate-bounce"
        aria-label="Chat on WhatsApp"
      >
        <svg
          className="w-6 h-6"
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      </button>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-full shadow-lg transition-all transform hover:scale-110 z-50 animate-fade-in"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Why Choose Us Section */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Why Choose Justees?</h2>
            <p className="text-gray-400 text-lg">Experience the difference</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-8 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all transform hover:-translate-y-2">
              <Award className="w-16 h-16 mx-auto mb-4 text-white" />
              <h3 className="text-xl font-bold text-white mb-3">Premium Quality</h3>
              <p className="text-gray-400">
                We use only the finest materials to ensure durability and comfort in every piece.
              </p>
            </div>
            <div className="text-center p-8 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all transform hover:-translate-y-2">
              <Truck className="w-16 h-16 mx-auto mb-4 text-white" />
              <h3 className="text-xl font-bold text-white mb-3">Fast Delivery</h3>
              <p className="text-gray-400">
                Quick and reliable shipping to get your orders to you as fast as possible.
              </p>
            </div>
            <div className="text-center p-8 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all transform hover:-translate-y-2">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-white" />
              <h3 className="text-xl font-bold text-white mb-3">100% Satisfaction</h3>
              <p className="text-gray-400">
                Not happy? We offer easy returns and exchanges within 30 days.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Instagram Feed Section */}
      <section className="py-20 bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Follow Us on Instagram</h2>
            <p className="text-gray-400 text-lg mb-6">@justees_official - Tag us in your photos!</p>
            <a
              href="https://instagram.com/justees_official"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-all transform hover:scale-105"
            >
              Follow Us
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=400&q=80',
              'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80',
              'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=400&q=80',
              'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=80',
              'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&q=80',
              'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&q=80',
            ].map((image, index) => (
              <a
                key={index}
                href="https://instagram.com/justees_official"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square overflow-hidden rounded-lg hover:shadow-2xl transition-all"
              >
                <LazyImage
                  src={image}
                  alt={`Instagram post ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 border-t border-gray-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold text-white mb-6">Join the Justees Family</h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Get exclusive access to new arrivals, special offers, and style inspiration
          </p>
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col md:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={newsletterStatus === 'loading'}
              className="flex-1 px-6 py-4 rounded-full bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-white transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={newsletterStatus === 'loading'}
              className="bg-white text-gray-900 px-8 py-4 rounded-full font-semibold hover:bg-gray-200 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {newsletterStatus === 'loading' ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                  Subscribing...
                </>
              ) : (
                'Subscribe'
              )}
            </button>
          </form>
          {newsletterStatus === 'success' && (
            <p className="mt-4 text-green-400 animate-fade-in">✓ Successfully subscribed! Check your inbox.</p>
          )}
          {newsletterStatus === 'error' && (
            <p className="mt-4 text-red-400 animate-fade-in">✗ Please enter a valid email address.</p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-12 border-t border-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white text-xl font-bold mb-4">JUSTEES</h3>
              <p className="text-sm">Premium quality clothing for the modern lifestyle.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Shop</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/products" className="hover:text-white transition-colors">All Products</Link></li>
                <li><Link to="/products" className="hover:text-white transition-colors">New Arrivals</Link></li>
                <li><Link to="/products" className="hover:text-white transition-colors">Best Sellers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Shipping Info</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Returns</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                <a href="#" className="hover:text-white transition-colors">Instagram</a>
                <a href="#" className="hover:text-white transition-colors">Facebook</a>
                <a href="#" className="hover:text-white transition-colors">Twitter</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 Justees. All rights reserved.</p>
          </div>
        </div>
      </footer>

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
