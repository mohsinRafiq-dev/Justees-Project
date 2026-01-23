import { CATEGORIES, SIZES, COLORS, VALIDATION } from './constants';

/**
 * Validate product form data
 * @param {Object} formData - Form data to validate
 * @returns {Object} Validation result with errors
 */
export const validateProductForm = (formData) => {
  const errors = {};

  // Name validation
  if (!formData.name) {
    errors.name = 'Product name is required';
  } else if (formData.name.length < VALIDATION.MIN_PRODUCT_NAME_LENGTH) {
    errors.name = `Product name must be at least ${VALIDATION.MIN_PRODUCT_NAME_LENGTH} characters`;
  } else if (formData.name.length > VALIDATION.MAX_PRODUCT_NAME_LENGTH) {
    errors.name = `Product name must be less than ${VALIDATION.MAX_PRODUCT_NAME_LENGTH} characters`;
  }

  // Price validation
  if (!formData.price) {
    errors.price = 'Price is required';
  } else if (isNaN(formData.price) || parseFloat(formData.price) <= VALIDATION.MIN_PRICE) {
    errors.price = 'Price must be a valid number greater than 0';
  } else if (parseFloat(formData.price) > VALIDATION.MAX_PRICE) {
    errors.price = `Price cannot exceed ${VALIDATION.MAX_PRICE.toLocaleString()}`;
  }

  // Original price validation (optional)
  if (formData.originalPrice && (isNaN(formData.originalPrice) || parseFloat(formData.originalPrice) <= VALIDATION.MIN_PRICE)) {
    errors.originalPrice = 'Original price must be a valid number greater than 0';
  }

  // Category validation
  if (!formData.category) {
    errors.category = 'Category is required';
  } else if (!CATEGORIES.includes(formData.category)) {
    errors.category = 'Invalid category selected';
  }

  // Description validation
  if (!formData.description) {
    errors.description = 'Description is required';
  } else if (formData.description.length < 10) {
    errors.description = 'Description must be at least 10 characters';
  }

  // Short description validation (optional)
  if (formData.shortDescription && formData.shortDescription.length > 200) {
    errors.shortDescription = 'Short description must be less than 200 characters';
  }

  // Stock validation
  if (formData.stock !== undefined && formData.stock !== null) {
    if (isNaN(formData.stock) || parseInt(formData.stock) < 0) {
      errors.stock = 'Stock must be a non-negative number';
    }
  }

  // Weight validation (optional)
  if (formData.weight && (isNaN(formData.weight) || parseFloat(formData.weight) <= 0)) {
    errors.weight = 'Weight must be a positive number';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate product variant data
 * @param {Object} variant - Variant data to validate
 * @param {number} index - Variant index for error reporting
 * @returns {Object} Validation result
 */
export const validateVariant = (variant, index = 0) => {
  const errors = {};

  // Size validation
  if (!variant.size) {
    errors.size = 'Size is required';
  } else if (!SIZES.includes(variant.size)) {
    errors.size = 'Invalid size selected';
  }

  // Color validation
  if (!variant.color) {
    errors.color = 'Color is required';
  } else if (!COLORS.includes(variant.color)) {
    errors.color = 'Invalid color selected';
  }

  // Stock validation
  if (variant.stock === undefined || variant.stock === null) {
    errors.stock = 'Stock is required';
  } else if (isNaN(variant.stock) || parseInt(variant.stock) < 0) {
    errors.stock = 'Stock must be a non-negative number';
  }

  // Price validation (optional for variants)
  if (variant.price && (isNaN(variant.price) || parseFloat(variant.price) <= 0)) {
    errors.price = 'Variant price must be a positive number';
  }

  // Weight validation (optional)
  if (variant.weight && (isNaN(variant.weight) || parseFloat(variant.weight) <= 0)) {
    errors.weight = 'Weight must be a positive number';
  }

  // Material validation (optional)
  if (variant.material && variant.material.length > 50) {
    errors.material = 'Material description must be less than 50 characters';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).reduce((acc, key) => {
      acc[key] = `Variant ${index + 1}: ${errors[key]}`;
      return acc;
    }, {})
  };
};

/**
 * Validate multiple variants
 * @param {Array} variants - Array of variants to validate
 * @returns {Object} Validation result
 */
export const validateVariants = (variants) => {
  const allErrors = {};
  let isValid = true;

  if (!variants || variants.length === 0) {
    return { valid: true, errors: {} };
  }

  variants.forEach((variant, index) => {
    const validation = validateVariant(variant, index);
    if (!validation.valid) {
      isValid = false;
      Object.assign(allErrors, validation.errors);
    }
  });

  // Check for duplicate size-color combinations
  const combinations = new Set();
  variants.forEach((variant, index) => {
    const combination = `${variant.size}-${variant.color}`;
    if (combinations.has(combination)) {
      isValid = false;
      allErrors[`duplicate_${index}`] = `Variant ${index + 1}: Duplicate size-color combination`;
    }
    combinations.add(combination);
  });

  return {
    valid: isValid,
    errors: allErrors
  };
};

/**
 * Validate image files
 * @param {FileList|Array} files - Files to validate
 * @returns {Object} Validation result
 */
export const validateImages = (files) => {
  const errors = [];
  
  if (!files || files.length === 0) {
    return { valid: true, errors: [] };
  }

  const fileArray = Array.from(files);
  
  fileArray.forEach((file, index) => {
    // Check file type
    if (!VALIDATION.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      errors.push(`Image ${index + 1}: Invalid file type. Only JPEG, PNG, and WebP are allowed.`);
    }

    // Check file size
    if (file.size > VALIDATION.MAX_IMAGE_SIZE) {
      const maxSizeMB = VALIDATION.MAX_IMAGE_SIZE / (1024 * 1024);
      errors.push(`Image ${index + 1}: File too large. Maximum size is ${maxSizeMB}MB.`);
    }

    // Check filename length
    if (file.name.length > 100) {
      errors.push(`Image ${index + 1}: Filename too long. Maximum 100 characters.`);
    }
  });

  // Check total number of images
  if (fileArray.length > 10) {
    errors.push('Maximum 10 images allowed per product.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate category data
 * @param {Object} categoryData - Category data to validate
 * @returns {Object} Validation result
 */
export const validateCategory = (categoryData) => {
  const errors = {};

  // Name validation
  if (!categoryData.name) {
    errors.name = 'Category name is required';
  } else if (categoryData.name.length < 2) {
    errors.name = 'Category name must be at least 2 characters';
  } else if (categoryData.name.length > 50) {
    errors.name = 'Category name must be less than 50 characters';
  }

  // Description validation (optional)
  if (categoryData.description && categoryData.description.length > 500) {
    errors.description = 'Category description must be less than 500 characters';
  }

  // Order validation (optional)
  if (categoryData.order !== undefined && categoryData.order !== null) {
    if (isNaN(categoryData.order) || parseInt(categoryData.order) < 0) {
      errors.order = 'Order must be a non-negative number';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Sanitize HTML content to prevent XSS
 * @param {string} content - Content to sanitize
 * @returns {string} Sanitized content
 */
export const sanitizeContent = (content) => {
  if (typeof content !== 'string') return '';
  
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Format price for display
 * @param {number} price - Price to format
 * @returns {string} Formatted price
 */
export const formatPrice = (price) => {
  if (typeof price !== 'number' || isNaN(price)) {
    return 'Rs. 0';
  }
  
  return `Rs. ${price.toLocaleString('en-IN')}`;
};

/**
 * Generate product slug from name
 * @param {string} name - Product name
 * @returns {string} URL-friendly slug
 */
export const generateSlug = (name) => {
  if (typeof name !== 'string') return '';
  
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Is valid phone number
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone);
};

/**
 * Check if user has admin permissions
 * @param {Object} user - User object
 * @returns {boolean} Is admin user
 */
export const isAdminUser = (user) => {
  if (!user || !user.email) return false;
  
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn('VITE_ADMIN_EMAIL not configured');
    return false;
  }
  
  return user.email.toLowerCase() === adminEmail.toLowerCase();
};

export default {
  validateProductForm,
  validateVariant,
  validateVariants,
  validateImages,
  validateCategory,
  sanitizeContent,
  formatPrice,
  generateSlug,
  isValidEmail,
  isValidPhone,
  isAdminUser
};