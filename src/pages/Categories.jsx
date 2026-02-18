import { useState, useEffect } from 'react';
import { motion } from 'framer-motion'; // eslint-disable-line
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import LazyImage from '../components/common/LazyImage';
import Navbar from '../components/common/Navbar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getCategories, getAllProducts } from '../services/products.service';

const Categories = () => {
  const { isDark } = useTheme();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch categories and products to calculate counts
    const fetchData = async () => {
      setLoading(true);
      try {
        const [categoriesRes, productsRes] = await Promise.all([
          getCategories(),
          getAllProducts({ limitCount: 1000, status: 'active' }) // Get all active products for counting
        ]);

        if (categoriesRes.success && productsRes.success) {
          const dbCategories = categoriesRes.categories || [];
          const products = productsRes.products || [];

          // Calculate counts map
          const counts = {};
          products.forEach(p => {
            if (p.category) {
              counts[p.category] = (counts[p.category] || 0) + 1;
            }
          });

          // Enhance categories with counts
          const enhancedCategories = dbCategories.map(cat => ({
            ...cat,
            count: `${counts[cat.name] || 0} Items`,
            // Default image fallback if none provided
            image: cat.image || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80'
          }));

          setCategories(enhancedCategories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
              <h1 className="text-5xl md:text-6xl font-bold mb-6" style={{ color: '#d3d1ce' }}>
                Explore Our Categories
              </h1>
              <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-8`}>
                Discover premium clothing across all our carefully curated categories
              </p>
            </motion.div>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="flex justify-center py-20">
                <LoadingSpinner size="large" />
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-20">
                <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  No categories found. Check back soon!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {categories.map((category, index) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -10 }}
                  >
                    <Link
                      to={`/products?category=${encodeURIComponent(category.name)}#products-grid`}
                      className={`block ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all group`}
                    >
                      <div className="relative h-64 overflow-hidden">
                        <LazyImage
                          src={category.image}
                          alt={category.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                          <h3 className="text-2xl font-bold mb-2">{category.name}</h3>
                          <p className="text-gray-300 text-sm">{category.count}</p>
                        </div>
                      </div>
                      <div className={`p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4 line-clamp-2 min-h-[3rem]`}>
                          {category.description || `Explore our collection of ${category.name}`}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold transition-colors" style={{ color: '#d3d1ce' }}>
                            Shop Now
                          </span>
                          <ShoppingBag className="w-5 h-5 transition-colors" style={{ color: '#d3d1ce' }} />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className={`py-20 ${isDark ? 'bg-gray-800' : 'bg-white'} border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className={`text-4xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Can't Find What You're Looking For?
              </h2>
              <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-8`}>
                Browse all our products or contact us for assistance
              </p>
              <Link
                to="/products"
                style={{ backgroundColor: '#d3d1ce' }}
                className="inline-block text-gray-900 px-8 py-4 rounded-full font-semibold hover:shadow-2xl transition-all transform hover:scale-105"
              >
                View All Products
              </Link>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Categories;
