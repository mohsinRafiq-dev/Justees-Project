import { useState } from 'react';
import { X, ShoppingCart, Heart } from 'lucide-react';
import { openWhatsAppOrder } from '../../utils/whatsapp';

const ProductQuickView = ({ product, isOpen, onClose }) => {
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('Black');
  const [quantity, setQuantity] = useState(1);

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const colors = ['Black', 'White', 'Gray', 'Navy', 'Red'];

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
              src={product.image}
              alt={product.name}
              className="w-full h-[400px] object-cover rounded-lg"
            />
            {product.badge && (
              <span className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                {product.badge}
              </span>
            )}
            <button className="absolute top-4 right-4 bg-white/90 hover:bg-white text-red-500 p-2 rounded-full transition-colors">
              <Heart className="w-5 h-5" />
            </button>
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
                {product.description || 'Premium quality clothing made with the finest materials. Comfortable, stylish, and built to last.'}
              </p>
            </div>

            {/* Size Selection */}
            <div className="mb-6">
              <label className="text-white font-semibold mb-3 block">Select Size</label>
              <div className="grid grid-cols-6 gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-2 px-4 rounded-lg border-2 transition-all ${
                      selectedSize === size
                        ? 'border-white bg-white text-gray-900 font-semibold'
                        : 'border-gray-600 text-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div className="mb-6">
              <label className="text-white font-semibold mb-3 block">Select Color</label>
              <div className="flex gap-3">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`py-2 px-4 rounded-lg border-2 transition-all ${
                      selectedColor === color
                        ? 'border-white bg-white text-gray-900 font-semibold'
                        : 'border-gray-600 text-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

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
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  className="bg-gray-700 hover:bg-gray-600 text-white w-10 h-10 rounded-lg font-bold transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Stock Info */}
            {product.stock && product.stock <= 10 && (
              <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm font-semibold">
                  ⚡ Only {product.stock} left in stock - Order soon!
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 mt-auto">
              <button
                onClick={handleOrder}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-4 rounded-full font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Order on WhatsApp
              </button>
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
