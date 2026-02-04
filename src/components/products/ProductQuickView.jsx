import { useState, useEffect } from 'react';
import { X, ShoppingCart, Heart } from 'lucide-react';
import { openWhatsAppOrder } from '../../utils/whatsapp';

const ProductQuickView = ({ product, isOpen, onClose }) => {
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Get unique sizes and colors from product variants
  const availableSizes = product?.variants ? [...new Set(product.variants.map(v => v.size))] : [];
  const availableColors = product?.variants ? [...new Set(product.variants.map(v => v.color))] : [];
  
  // Helper function to get product image based on selected color
  const getProductImage = () => {
    if (product?.images && product.images.length > 0) {
      // First try to find an image for the selected color
      if (selectedColor) {
        const colorImage = product.images.find(img => 
          img.color && img.color.toLowerCase() === selectedColor.toLowerCase()
        );
        if (colorImage) {
          return typeof colorImage === "object" ? colorImage.url : colorImage;
        }
      }
      
      // Fallback to first image if no color-specific image found
      const firstImage = product.images[0];
      return typeof firstImage === "object" ? firstImage.url : firstImage;
    }
    return `/api/placeholder/400/400?text=${encodeURIComponent(product?.name || 'Product')}`;
  };

  // Helper function to get all images for selected color (for potential image gallery)
  const getColorImages = () => {
    if (!product?.images || !selectedColor) return [];
    return product.images
      .filter(img => img.color && img.color.toLowerCase() === selectedColor.toLowerCase())
      .map(img => typeof img === "object" ? img.url : img);
  };

  // Helper function to get stock for selected variant
  const getSelectedVariantStock = () => {
    if (!selectedSize || !selectedColor || !product?.variants) return 0;
    const variant = product.variants.find(v => v.size === selectedSize && v.color === selectedColor);
    return variant?.stock || 0;
  };

  // Helper function to get total stock
  const getTotalStock = () => {
    if (!product?.variants) return product?.stock || 0;
    return product.variants.reduce((total, variant) => total + (variant.stock || 0), 0);
  };

  // Initialize selected options when product changes
  useEffect(() => {
    if (product && isOpen) {
      setSelectedSize(availableSizes[0] || '');
      setSelectedColor(availableColors[0] || '');
      setQuantity(1);
    }
  }, [product, isOpen]);

  const formatPrice = (price) => {
    return `Rs. ${price.toLocaleString('en-IN')}`;
  };

  const handleOrder = () => {
    openWhatsAppOrder(product, {
      size: selectedSize,
      color: selectedColor,
      quantity
    });
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid md:grid-cols-2 gap-8 p-8">
          {/* Product Image */}
          <div className="relative">
            <img
              src={getProductImage()}
              alt={`${product.name} - ${selectedColor || 'Default'}`}
              className="w-full h-[400px] object-cover rounded-lg transition-all duration-300"
              key={`${selectedColor}-main`} // Force re-render when color changes
            />
            
            {/* Image Gallery Indicators */}
            {getColorImages().length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {getColorImages().slice(0, 5).map((_, index) => (
                  <div
                    key={index}
                    className="w-2 h-2 rounded-full bg-white/60 backdrop-blur-sm"
                  />
                ))}
                {getColorImages().length > 5 && (
                  <span className="text-white text-xs bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">
                    +{getColorImages().length - 5}
                  </span>
                )}
              </div>
            )}
            
            {product.badge && (
              <span className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold z-10">
                {product.badge}
              </span>
            )}
            <button className="absolute top-4 right-4 bg-white/90 hover:bg-white text-red-500 p-2 rounded-full transition-colors z-10">
              <Heart className="w-5 h-5" />
            </button>
            
            {/* Color-specific badge */}
            {selectedColor && getColorImages().length > 0 && (
              <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                {selectedColor}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col">
            <div className="mb-6">
              <p className="text-gray-400 text-sm mb-2">{product.category}</p>
              <h2 className="text-3xl font-bold text-white mb-3">{product.name}</h2>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-3xl font-bold text-white">{formatPrice(product.price)}</span>
                {product.originalPrice && (
                  <span className="text-xl text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
                )}
              </div>
              <p className="text-gray-300 leading-relaxed">
                {product.shortDescription || product.description || 'Premium quality clothing made with the finest materials. Comfortable, stylish, and built to last.'}
              </p>
            </div>

            {/* Size Selection */}
            {availableSizes.length > 0 && (
              <div className="mb-6">
                <label className="text-white font-semibold mb-3 block">Select Size</label>
                <div className="grid grid-cols-6 gap-2">
                  {availableSizes.map((size) => {
                    // Check if this size has any stock across all colors
                    const hasStock = product.variants.some(v => v.size === size && v.stock > 0);
                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        disabled={!hasStock}
                        className={`py-2 px-4 rounded-lg border-2 transition-all ${
                          selectedSize === size
                            ? 'border-white bg-white text-gray-900 font-semibold'
                            : hasStock
                              ? 'border-gray-600 text-gray-300 hover:border-gray-400'
                              : 'border-gray-700 text-gray-500 cursor-not-allowed line-through'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {availableColors.length > 0 && (
              <div className="mb-6">
                <label className="text-white font-semibold mb-3 block">Select Color</label>
                <div className="flex gap-3 flex-wrap">
                  {availableColors.map((color) => {
                    // Check if this color has any stock in the selected size
                    const hasStock = selectedSize ? 
                      product.variants.some(v => v.color === color && v.size === selectedSize && v.stock > 0) :
                      product.variants.some(v => v.color === color && v.stock > 0);
                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        disabled={!hasStock}
                        className={`py-2 px-4 rounded-lg border-2 transition-all ${
                          selectedColor === color
                            ? 'border-white bg-white text-gray-900 font-semibold'
                            : hasStock
                              ? 'border-gray-600 text-gray-300 hover:border-gray-400'
                              : 'border-gray-700 text-gray-500 cursor-not-allowed line-through'
                        }`}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <label className="text-white font-semibold mb-3 block">Quantity</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="bg-gray-700 hover:bg-gray-600 text-white w-10 h-10 rounded-lg font-bold transition-colors"
                >
                  -
                </button>
                <span className="text-white text-xl font-semibold w-12 text-center">{quantity}</span>
                <button
                  onClick={() => {
                    const maxStock = getSelectedVariantStock();
                    setQuantity(Math.min(maxStock || 10, quantity + 1));
                  }}
                  className="bg-gray-700 hover:bg-gray-600 text-white w-10 h-10 rounded-lg font-bold transition-colors"
                >
                  +
                </button>
              </div>
              {selectedSize && selectedColor && (
                <p className="text-gray-400 text-sm mt-2">
                  Available: {getSelectedVariantStock()} units
                </p>
              )}
            </div>

            {/* Stock Info */}
            {(() => {
              const totalStock = getTotalStock();
              const selectedStock = getSelectedVariantStock();
              const showWarning = selectedSize && selectedColor ? 
                selectedStock <= 10 && selectedStock > 0 : 
                totalStock <= 10 && totalStock > 0;
              const stockCount = selectedSize && selectedColor ? selectedStock : totalStock;
              
              return showWarning ? (
                <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 text-sm font-semibold">
                    ⚡ Only {stockCount} left in stock - Order soon!
                  </p>
                </div>
              ) : null;
            })()}

            {/* Action Buttons */}
            <div className="flex gap-4 mt-auto">
              {(() => {
                const canOrder = selectedSize && selectedColor && getSelectedVariantStock() > 0;
                return (
                  <button
                    onClick={handleOrder}
                    disabled={!canOrder}
                    className={`flex-1 py-4 rounded-full font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-2 ${
                      canOrder
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {!selectedSize || !selectedColor ? 'Select Options' : 
                     getSelectedVariantStock() === 0 ? 'Out of Stock' : 'Order on WhatsApp'}
                  </button>
                );
              })()}
            </div>

            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t border-gray-700 space-y-2 text-sm text-gray-400">
              <p>✓ Free shipping on orders over Rs. 1,999</p>
              <p>✓ 30-day easy returns</p>
              <p>✓ 100% authentic products</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductQuickView;
