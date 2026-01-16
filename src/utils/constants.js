// Application constants

// Business Information
export const BUSINESS_NAME = import.meta.env.VITE_BUSINESS_NAME || 'Justees';
export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '';

// Routes
export const ROUTES = {
  HOME: '/',
  PRODUCTS: '/products',
  ADMIN_LOGIN: '/admin/login',
  ADMIN_DASHBOARD: '/admin/dashboard',
};

// Product Categories
export const CATEGORIES = [
  'T-Shirts',
  'Hoodies',
  'Sweatshirts',
  'Jackets',
  'Pants',
  'Shorts',
  'Accessories',
  'Other',
];

// Product Sizes
export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

// Product Colors
export const COLORS = [
  'Black',
  'White',
  'Gray',
  'Navy',
  'Red',
  'Blue',
  'Green',
  'Yellow',
  'Pink',
  'Purple',
  'Brown',
  'Beige',
];

// Firebase Collection Names
export const COLLECTIONS = {
  PRODUCTS: 'products',
  ORDERS: 'orders',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  PRODUCT_CREATED: 'Product created successfully!',
  PRODUCT_UPDATED: 'Product updated successfully!',
  PRODUCT_DELETED: 'Product deleted successfully!',
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'Logout successful!',
};

// Validation Rules
export const VALIDATION = {
  MIN_PRODUCT_NAME_LENGTH: 3,
  MAX_PRODUCT_NAME_LENGTH: 100,
  MIN_PRICE: 0,
  MAX_PRICE: 1000000,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
};

// Pagination
export const ITEMS_PER_PAGE = 12;

export default {
  BUSINESS_NAME,
  WHATSAPP_NUMBER,
  ROUTES,
  CATEGORIES,
  SIZES,
  COLORS,
  COLLECTIONS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  VALIDATION,
  ITEMS_PER_PAGE,
};
