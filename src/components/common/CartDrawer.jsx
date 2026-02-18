import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';
import { formatPrice } from '../../utils/validation';
import { WHATSAPP_NUMBER } from '../../utils/constants';

const CartDrawer = () => {
    const { 
        cartItems, 
        updateQuantity, 
        removeFromCart, 
        getCartTotal, 
        isCartOpen, 
        closeCart 
    } = useCart();
    const { isDark } = useTheme();

    // WhatsApp Order Handler
    const handleWhatsAppCheckout = () => {
        if (cartItems.length === 0) return;

        let message = "*Order Confirmation*\n";
        message += "------------------\n";

        cartItems.forEach((item, index) => {
            message += `${index + 1}. ${item.name}\n`;
            message += `   Size: ${item.size} | Color: ${item.color}\n`;
            message += `   Qty: ${item.quantity} | Price: ${formatPrice(item.price)}\n\n`;
        });

        message += "------------------\n";
        message += `*Total: ${formatPrice(getCartTotal())}*\n\n`;
        message += "Please confirm my order.";

        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    return (
        <AnimatePresence>
            {isCartOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeCart}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className={`fixed inset-y-0 right-0 w-full max-w-md z-[70] shadow-2xl flex flex-col ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
                            }`}
                    >
                        {/* Header */}
                        <div className={`p-4 flex items-center justify-between border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5" />
                                <h2 className="text-lg font-bold">Your Cart ({cartItems.length})</h2>
                            </div>
                            <button
                                onClick={closeCart}
                                className={`p-2 rounded-full hover:bg-gray-100 ${isDark ? 'hover:bg-gray-800' : ''}`}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {cartItems.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-4xl">
                                        🛒
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Your cart is empty</h3>
                                    <p className="text-gray-500 mb-6">Looks like you haven't added anything yet.</p>
                                    <button
                                        onClick={closeCart}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-700 transition-colors"
                                    >
                                        Start Shopping
                                    </button>
                                </div>
                            ) : (
                                cartItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`flex gap-4 p-3 rounded-xl border ${isDark ? 'border-gray-800 bg-gray-800/50' : 'border-gray-100 bg-gray-50'
                                            }`}
                                    >
                                        {/* Image */}
                                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                                            <img
                                                src={item.image || '/api/placeholder/150/150?text=No+Image'}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = '/api/placeholder/150/150?text=Error';
                                                }}
                                            />
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-semibold truncate pr-2">{item.name}</h3>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="text-sm text-gray-500 mt-1 flex gap-2">
                                                <span className="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-xs font-medium">
                                                    {item.size}
                                                </span>
                                                <span className="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-xs font-medium flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-full block" style={{ backgroundColor: item.color }}></span>
                                                    {item.color}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between mt-3">
                                                <div className="font-bold text-blue-600 dark:text-blue-400">
                                                    {formatPrice(item.price * item.quantity)}
                                                </div>

                                                {/* Quantity Controls */}
                                                <div className="flex items-center gap-3 bg-white dark:bg-gray-700 rounded-lg px-2 py-1 shadow-sm">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="p-1 hover:text-blue-600 disabled:opacity-30"
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="p-1 hover:text-blue-600"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {cartItems.length > 0 && (
                            <div className={`p-4 border-t ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-white'}`}>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-gray-500">Total</span>
                                    <span className="text-2xl font-bold">{formatPrice(getCartTotal())}</span>
                                </div>

                                <button
                                    onClick={handleWhatsAppCheckout}
                                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-green-500/30 transition-all flex items-center justify-center gap-2"
                                >
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                    </svg>
                                    Checkout on WhatsApp
                                </button>
                                <p className="text-center text-xs text-gray-500 mt-3 flex items-center justify-center gap-1">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    Fast & Secure Checkout via WhatsApp
                                </p>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CartDrawer;
