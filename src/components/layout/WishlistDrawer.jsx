import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Trash2, Heart } from 'lucide-react';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCart } from '../../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import LazyImage from '../common/LazyImage';

const WishlistDrawer = () => {
  const { 
    wishlist, 
    isWishlistOpen, 
    closeWishlist, 
    removeFromWishlist 
  } = useWishlist();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = (product) => {
    // If product has variants, we redirect to product page
    if (product.variants && product.variants.length > 0) {
      navigate(`/products/${product.id}`);
      closeWishlist();
    } else {
      // Direct add to cart for simple products
      addToCart(product, { quantity: 1 });
    }
  };

  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) {
      return typeof product.images[0] === "object"
        ? product.images[0].url
        : product.images[0];
    }
    return `https://placehold.co/400x400?text=${encodeURIComponent(product.name || 'Product')}`;
  };

  // Helper to get stock status
  const getProductStock = (product) => {
    if (product.variants && product.variants.length > 0) {
      // Sum variant stock if totalStock is not set
      const totalVariantStock = product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
      return totalVariantStock;
    }
    return product.stock || 0;
  };

  return (
    <AnimatePresence>
      {isWishlistOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeWishlist}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl z-[60] flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Wishlist ({wishlist.length})
                </h2>
              </div>
              <button
                onClick={closeWishlist}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {wishlist.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Heart className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Your wishlist is empty
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                      Save items you love to view them here later.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      closeWishlist();
                      navigate('/products');
                    }}
                    className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-medium hover:opacity-90 transition-opacity"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                wishlist.map((item) => {
                   const stock = getProductStock(item);
                   const isOutOfStock = item.stockStatus === 'out_of_stock' || stock === 0;

                   return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="flex gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl group relative"
                    >
                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromWishlist(item.id)}
                        className="absolute top-2 right-2 p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
  
                      {/* Image */}
                      <div 
                        className="w-24 h-24 flex-shrink-0 cursor-pointer rounded-lg overflow-hidden"
                        onClick={() => {
                          navigate(`/products/${item.id}`);
                          closeWishlist();
                        }}
                      >
                        <LazyImage
                          src={getProductImage(item)}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
  
                      {/* Details */}
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <h3 
                            className="font-semibold text-gray-900 dark:text-white line-clamp-1 cursor-pointer hover:text-blue-500 transition-colors"
                            onClick={() => {
                              navigate(`/products/${item.id}`);
                              closeWishlist();
                            }}
                          >
                            {item.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {item.category}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="font-bold text-gray-900 dark:text-white">
                              Rs. {item.price.toLocaleString('en-IN')}
                            </span>
                            {item.originalPrice && Number(item.originalPrice) > Number(item.price) && (
                              <span className="text-sm text-gray-400 line-through">
                                Rs. {Number(item.originalPrice).toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                        </div>
  
                        <div className="mt-3">
                            {isOutOfStock ? (
                                <span className="text-red-500 text-sm font-medium bg-red-500/10 px-2 py-1 rounded inline-block">
                                    Out of Stock
                                </span>
                            ) : (
                                <button
                                    onClick={() => handleAddToCart(item)}
                                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 transition-colors"
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                    {item.variants && item.variants.length > 0 ? 'Select Options' : 'Add to Cart'}
                                </button>
                            )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WishlistDrawer;
