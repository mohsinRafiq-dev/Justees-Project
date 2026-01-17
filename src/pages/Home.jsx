import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ShoppingBag, Truck, Shield, Headphones, Star, Quote, TrendingUp, Award, CheckCircle } from 'lucide-react';

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

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
  const featuredProducts = [
    {
      id: 1,
      name: 'Classic Black Tee',
      price: 29.99,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80',
      category: 'T-Shirts',
    },
    {
      id: 2,
      name: 'Denim Jacket',
      price: 89.99,
      image: 'https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?w=500&q=80',
      category: 'Jackets',
    },
    {
      id: 3,
      name: 'Casual Hoodie',
      price: 49.99,
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&q=80',
      category: 'Hoodies',
    },
    {
      id: 4,
      name: 'Slim Fit Jeans',
      price: 59.99,
      image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&q=80',
      category: 'Pants',
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

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  return (
    <div className="bg-gray-900 min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-gray-900/95 backdrop-blur-sm z-50 border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-white hover:text-gray-300 transition-colors">
              JUSTEES
            </Link>
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
            <Link
              to="/products"
              className="bg-white text-gray-900 px-6 py-2 rounded-full font-semibold hover:bg-gray-200 transition-all transform hover:scale-105"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Slider */}
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
              { icon: ShoppingBag, title: 'Easy Returns', desc: '30-day return policy' },
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
                <img
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
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gray-900/0 group-hover:bg-gray-900/20 transition-all" />
                </div>
                <div className="p-6">
                  <p className="text-gray-400 text-sm mb-1">{product.category}</p>
                  <h3 className="text-xl font-semibold text-white mb-2">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-white">${product.price}</span>
                    <Link
                      to="/products"
                      className="bg-white text-gray-900 px-4 py-2 rounded-full font-semibold hover:bg-gray-200 transition-all transform hover:scale-105"
                    >
                      View
                    </Link>
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
                className={`bg-gray-700 rounded-lg p-6 hover:bg-gray-600 transition-all transform hover:-translate-y-2 ${
                  isVisible ? 'animate-fade-in-up' : 'opacity-0'
                }`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <Quote className="w-10 h-10 text-gray-500 mb-4" />
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

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 border-t border-gray-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold text-white mb-6">Join the Justees Family</h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Get exclusive access to new arrivals, special offers, and style inspiration
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 rounded-full bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-white transition-colors"
            />
            <button className="bg-white text-gray-900 px-8 py-4 rounded-full font-semibold hover:bg-gray-200 transition-all transform hover:scale-105">
              Subscribe
            </button>
          </div>
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
    </div>
  );
};

export default Home;
