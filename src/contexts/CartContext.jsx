/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  // Initialize cart from localStorage
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('justees_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('justees_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Cart Drawer State
  const [isCartOpen, setIsCartOpen] = useState(false);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  const addToCart = (product, options = {}) => {
    const { size, color, quantity = 1 } = options;

    // Use selected values or fall back to product defaults if available
    const finalSize = size || (product.variants && product.variants.length > 0 ? product.variants[0].size : 'M');
    const finalColor = color || (product.variants && product.variants.length > 0 ? product.variants[0].color : 'Black');

    // Determine the correct image based on selected color
    let selectedImage = product.image;
    
    // Check product.images array (could be strings or objects {url, color})
    if (product.images && product.images.length > 0) {
      const colorImage = product.images.find(
        (img) => typeof img === 'object' && img.color && img.color.toLowerCase() === finalColor.toLowerCase()
      );
      
      const imageObj = colorImage || product.images[0];
      selectedImage = typeof imageObj === "object" ? imageObj.url : imageObj;
    }

    // Generate unique ID based on product and variant options
    const variantId = `${product.id}-${finalSize}-${finalColor}`;

    const cartItem = {
      id: variantId,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: selectedImage || 'https://placehold.co/400x400?text=No+Image',
      size: finalSize,
      color: finalColor,
      quantity,
    };

    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === cartItem.id);
      if (existingItem) {
        return prev.map((item) =>
          item.id === cartItem.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, cartItem];
    });

    // Automatically open cart drawer
    setIsCartOpen(true);
  };

  const removeFromCart = (itemId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    isCartOpen,
    openCart,
    closeCart,
    toggleCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartProvider;
