import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line
import { ShoppingCart, Sun, Moon, Menu, X, Instagram, Heart } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useWishlist } from '../../contexts/WishlistContext';

const Navbar = () => {
  const { getCartCount, openCart } = useCart();
  const { isDark, toggleTheme } = useTheme();
  const { wishlist, toggleWishlistDrawer } = useWishlist();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 ${isDark ? 'bg-gray-900/95 backdrop-blur-md' : 'bg-white/95 backdrop-blur-md'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} overflow-visible shadow-lg`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 overflow-visible">
            <Link to="/" className="flex items-center">
              <img 
                src="/justees_logo.png" 
                alt="Justees" 
                className="h-40 w-auto object-contain"
              />
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              {[
                { name: 'Home', path: '/' },
                { name: 'Products', path: '/products' },
                { name: 'Categories', path: '/categories' },
                { name: 'About', path: '/about' },
              ].map((item) => (
                <NavLink
                  key={item.path}
                   to={item.path}
                   end={item.path === '/'}
                  className={({ isActive }) => 
                    `relative transition-all duration-300 font-medium pb-1 ${
                      isActive 
                        ? 'text-blue-500 after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-500 after:rounded-full' 
                        : isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </div>

            <div className="flex items-center space-x-1">
              {/* Social Media Links - Hidden on smaller screens to save space */}
              <div className="hidden lg:flex items-center space-x-1">
                <motion.a
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  href="https://wa.me/923291526285"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2 rounded-full ${isDark ? 'text-gray-300 hover:text-green-400' : 'text-gray-700 hover:text-green-600'} transition-colors`}
                  aria-label="WhatsApp"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  href="https://instagram.com/justees.official"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2 rounded-full ${isDark ? 'text-gray-300 hover:text-pink-400' : 'text-gray-700 hover:text-pink-600'} transition-colors`}
                  aria-label="Instagram"
                >
                  <Instagram className="w-6 h-6" />
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  href="https://www.tiktok.com/@justees"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2 rounded-full ${isDark ? 'text-gray-300 hover:text-cyan-400' : 'text-gray-700 hover:text-cyan-600'} transition-colors`}
                  aria-label="TikTok"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </motion.a>
              </div>

              {/* Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className={`p-2 rounded-full ${isDark ? 'bg-gray-700 text-yellow-400' : 'bg-gray-200 text-gray-700'} transition-all`}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.button>

              {/* Wishlist Icon */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleWishlistDrawer}
                className={`relative p-2 rounded-full ${isDark ? 'text-gray-300 hover:text-red-400' : 'text-gray-700 hover:text-red-500'} transition-colors`}
              >
                <Heart className="w-6 h-6" />
                {wishlist.length > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-0 right-0 bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    {wishlist.length}
                  </motion.span>
                )}
              </motion.button>

              {/* Cart Icon */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={openCart}
                className={`relative p-2 rounded-full ${isDark ? 'text-white hover:text-gray-300' : 'text-gray-700 hover:text-gray-900'} transition-colors`}
              >
                <ShoppingCart className="w-6 h-6" />
                {getCartCount() > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-0 right-0 bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    {getCartCount()}
                  </motion.span>
                )}
              </motion.button>

              <Link
                to="/products"
                style={{ backgroundColor: '#d3d1ce' }}
                className="hidden md:inline-block text-gray-900 px-6 py-2 rounded-full font-semibold hover:shadow-lg transition-all transform hover:scale-105"
              >
                Shop Now
              </Link>

              {/* Mobile Menu Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`md:hidden p-2 ${isDark ? 'text-white' : 'text-gray-700'}`}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`md:hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t max-h-[calc(100vh-64px)] overflow-y-auto`}>
            <div className="px-4 py-4 space-y-4">
              {[
                { name: 'Home', path: '/' },
                { name: 'Products', path: '/products' },
                { name: 'Categories', path: '/categories' },
                { name: 'About', path: '/about' },
              ].map((item) => (
                <NavLink
                  key={item.path}
                   to={item.path}
                   end={item.path === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => 
                    `block py-2 transition-all duration-300 font-medium ${
                      isActive 
                        ? 'text-blue-500 pl-4 border-l-4 border-blue-500 bg-blue-500/10' 
                        : isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}

              {/* Mobile Social Links */}
              <div className={`flex items-center justify-center space-x-6 py-4 border-t border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <a href="https://wa.me/923291526285" target="_blank" rel="noopener noreferrer" className={`flex items-center justify-center ${isDark ? 'text-gray-300 hover:text-green-400' : 'text-gray-700 hover:text-green-600'}`} aria-label="WhatsApp">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                </a>
                <a href="https://instagram.com/justees.official" target="_blank" rel="noopener noreferrer" className={`flex items-center justify-center ${isDark ? 'text-gray-300 hover:text-pink-400' : 'text-gray-700 hover:text-pink-600'}`} aria-label="Instagram">
                  <Instagram className="w-6 h-6" />
                </a>
                <a href="https://www.tiktok.com/@justees" target="_blank" rel="noopener noreferrer" className={`flex items-center justify-center ${isDark ? 'text-gray-300 hover:text-cyan-400' : 'text-gray-700 hover:text-cyan-600'}`} aria-label="TikTok">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                </a>
              </div>

              <Link to="/products" style={{ backgroundColor: '#d3d1ce' }} className="block text-gray-900 px-6 py-3 rounded-full font-semibold text-center hover:shadow-lg transition-all" onClick={() => setMobileMenuOpen(false)}>Shop Now</Link>
            </div>
          </div>
        )}
      </motion.nav>
    </>
  );
};

export default Navbar;
