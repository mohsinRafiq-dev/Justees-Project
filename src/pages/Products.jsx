import { useState } from 'react';
import { motion } from 'framer-motion'; // eslint-disable-line
import { Heart, ShoppingCart, Eye, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';
import { useCart } from '../contexts/CartContext';
import LazyImage from '../components/common/LazyImage';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import TiltCard from '../components/common/TiltCard';
import ProductQuickView from '../components/products/ProductQuickView';

const Products = () => {
  const { isDark } = useTheme();
  const { addToCart } = useCart();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const formatPrice = (price) => {
    return `Rs. ${price.toLocaleString('en-IN')}`;
  };

  const products = [
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
    {
      id: 5,
      name: 'White Cotton Shirt',
      price: 1999,
      image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&q=80',
      category: 'T-Shirts',
      stock: 12,
      description: 'Classic white shirt perfect for any occasion.',
    },
    {
      id: 6,
      name: 'Leather Jacket',
      price: 8999,
      originalPrice: 11999,
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&q=80',
      category: 'Jackets',
      badge: 'Sale',
      stock: 4,
      description: 'Genuine leather jacket with premium finish.',
    },
    {
      id: 7,
      name: 'Zip Hoodie',
      price: 2799,
      image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500&q=80',
      category: 'Hoodies',
      badge: 'New',
      stock: 10,
      description: 'Comfortable zip hoodie with side pockets.',
    },
    {
      id: 8,
      name: 'Cargo Pants',
      price: 3999,
      image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=500&q=80',
      category: 'Pants',
      stock: 7,
      description: 'Utility cargo pants with multiple pockets.',
    },
  ];

  const categories = ['All', 'T-Shirts', 'Hoodies', 'Jackets', 'Pants'];

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const toggleWishlist = (productId) => {
    setWishlist(prev => {
      if (prev.includes(productId)) {
        toast.error('Removed from wishlist');
        return prev.filter(id => id !== productId);
      } else {
        toast.success('Added to wishlist! ❤️');
        return [...prev, productId];
      }
    });
  };

  const handleQuickAdd = (product) => {
    addToCart(product);
    toast.success(`${product.name} added to cart!`, {
      icon: '🛒',
    });
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
    <>
      <Navbar />
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} pt-20`}>
        {/* Hero Section */}
        <section className={`py-16 ${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent">
                Our Products
              </h1>
              <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Discover our collection of premium quality clothing
              </p>
            </motion.div>
          </div>
        </section>

        {/* Filter Section */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Filter className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Filter by:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-6 py-2 rounded-full font-medium transition-all ${
                      selectedCategory === category
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                        : isDark
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredProducts.map((product, index) => (
                <TiltCard
                  key={product.id}
                  className={`group ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg overflow-hidden hover:shadow-2xl transition-all`}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="relative overflow-hidden aspect-square">
                      <LazyImage
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      
                      {product.badge && (
                        <motion.span 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold text-white ${
                            product.badge === 'Sale' ? 'bg-red-500' :
                            product.badge === 'New' ? 'bg-blue-500' :
                            product.badge === 'Limited' ? 'bg-purple-500' :
                            'bg-yellow-500'
                          }`}
                        >
                          {product.badge}
                        </motion.span>
                      )}

                      <motion.button
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.8 }}
                        onClick={() => toggleWishlist(product.id)}
                        className={`absolute top-4 right-4 p-2 rounded-full ${isDark ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-sm transition-all`}
                      >
                        <Heart 
                          className={`w-5 h-5 ${wishlist.includes(product.id) ? 'fill-red-500 text-red-500' : isDark ? 'text-white' : 'text-gray-700'}`} 
                        />
                      </motion.button>
                      
                      <div className="absolute inset-0 bg-gray-900/0 group-hover:bg-gray-900/60 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => openQuickView(product)}
                          className="bg-white text-gray-900 px-4 py-2 rounded-full font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleQuickAdd(product)}
                          className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-full font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Add
                        </motion.button>
                      </div>
                    </div>
                    <div className="p-6">
                      <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm mb-1`}>{product.category}</p>
                      <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{product.name}</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatPrice(product.price)}</span>
                          {product.originalPrice && (
                            <span className={`text-sm line-through ml-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{formatPrice(product.originalPrice)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </TiltCard>
              ))}
            </div>
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
