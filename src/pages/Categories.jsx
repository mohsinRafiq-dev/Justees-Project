import { motion } from 'framer-motion'; // eslint-disable-line
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import LazyImage from '../components/common/LazyImage';
import Navbar from '../components/common/Navbar';

const Categories = () => {
  const { isDark } = useTheme();

  const categories = [
    {
      name: 'T-Shirts',
      image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80',
      count: '50+ Items',
      description: 'Comfortable and stylish t-shirts for everyday wear',
    },
    {
      name: 'Hoodies',
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80',
      count: '30+ Items',
      description: 'Cozy hoodies perfect for any season',
    },
    {
      name: 'Jackets',
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80',
      count: '25+ Items',
      description: 'Premium jackets for style and comfort',
    },
    {
      name: 'Pants',
      image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80',
      count: '35+ Items',
      description: 'From jeans to chinos, find your perfect fit',
    },
    {
      name: 'Accessories',
      image: 'https://images.unsplash.com/photo-1523359346063-d879354c0ea5?w=800&q=80',
      count: '40+ Items',
      description: 'Complete your look with our accessories',
    },
    {
      name: 'Sportswear',
      image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
      count: '20+ Items',
      description: 'Performance wear for active lifestyles',
    },
  ];

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
              >
                <Link
                  to="/products"
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
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                      {category.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-blue-600 font-semibold group-hover:text-cyan-600 transition-colors">
                        Shop Now
                      </span>
                      <ShoppingBag className="w-5 h-5 text-blue-600 group-hover:text-cyan-600 transition-colors" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
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
              className="inline-block bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-2xl hover:shadow-cyan-500/50 transition-all transform hover:scale-105"
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
