import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

const Footer = () => {
  const { isDark } = useTheme();

  return (
    <footer className={`${isDark ? 'bg-gray-950 text-gray-400 border-gray-800' : 'bg-gray-100 text-gray-600 border-gray-200'} py-12 border-t`}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <Link to="/" className="inline-block mb-4">
              <img 
                src="/justees_logo.png" 
                alt="Justees" 
                className="h-48 w-auto object-contain"
              />
            </Link>
            <p className="text-sm">Premium quality clothing for the modern lifestyle.</p>
          </div>
          <div>
            <h4 className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold mb-4`}>Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/products" className={`${isDark ? 'hover:text-white' : 'hover:text-gray-900'} transition-colors`}>All Products</Link></li>
              <li><Link to="/categories" className={`${isDark ? 'hover:text-white' : 'hover:text-gray-900'} transition-colors`}>Categories</Link></li>
              <li><Link to="/products" className={`${isDark ? 'hover:text-white' : 'hover:text-gray-900'} transition-colors`}>New Arrivals</Link></li>
              <li><Link to="/products" className={`${isDark ? 'hover:text-white' : 'hover:text-gray-900'} transition-colors`}>Best Sellers</Link></li>
            </ul>
          </div>
          <div>
            <h4 className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold mb-4`}>Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className={`${isDark ? 'hover:text-white' : 'hover:text-gray-900'} transition-colors`}>About Us</Link></li>
              <li><a href="#" className={`${isDark ? 'hover:text-white' : 'hover:text-gray-900'} transition-colors`}>Contact Us</a></li>
              <li><a href="#" className={`${isDark ? 'hover:text-white' : 'hover:text-gray-900'} transition-colors`}>Shipping Info</a></li>
              <li><a href="#" className={`${isDark ? 'hover:text-white' : 'hover:text-gray-900'} transition-colors`}>Returns</a></li>
            </ul>
          </div>
          <div>
            <h4 className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold mb-4`}>Follow Us</h4>
            <div className="flex space-x-4">
              <a href="#" className={`${isDark ? 'hover:text-white' : 'hover:text-gray-900'} transition-colors`}>Instagram</a>
              <a href="#" className={`${isDark ? 'hover:text-white' : 'hover:text-gray-900'} transition-colors`}>Facebook</a>
              <a href="#" className={`${isDark ? 'hover:text-white' : 'hover:text-gray-900'} transition-colors`}>Twitter</a>
            </div>
          </div>
        </div>
        <div className={`border-t ${isDark ? 'border-gray-800' : 'border-gray-200'} pt-8 text-center text-sm`}>
          <p>&copy; 2026 Justees. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
