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

  const addToCart = (product, options = {}) => {
    const { size = 'M', color = 'Black', quantity = 1 } = options;

    // Determine the correct image based on selected color
    let selectedImage = product.image;
    if (product.images && product.images.length > 0) {
      const colorImage = product.images.find(
        (img) => img.color && img.color.toLowerCase() === color.toLowerCase()
      );
      // Use color-specific image if found, otherwise use first image
      const imageObj = colorImage || product.images[0];
      selectedImage = typeof imageObj === "object" ? imageObj.url : imageObj;
    }

    const cartItem = {
      id: `${product.id}-${size}-${color}`,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: selectedImage || '/api/placeholder/400/400',
      size,
      color,
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
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartProvider;
