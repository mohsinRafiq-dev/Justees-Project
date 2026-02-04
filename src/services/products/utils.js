import { serverTimestamp, increment } from "firebase/firestore";

/** Generate URL-friendly slug from product name */
export const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
};

/** Generate SKU for product variant */
export const generateSKU = (productName, size, color) => {
  const nameCode = (productName || "").substring(0, 3).toUpperCase();
  const sizeCode = (size || "").toUpperCase();
  const colorCode = (color || "").substring(0, 2).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);

  return `${nameCode}-${sizeCode}-${colorCode}-${timestamp}`;
};

/** Validate product data */
export const validateProductData = (productData) => {
  const errors = [];

  if (!productData.name || productData.name.trim().length < 3) {
    errors.push(
      "Product name is required and must be at least 3 characters long",
    );
  }

  if (!productData.price || productData.price <= 0) {
    errors.push("Price is required and must be greater than 0");
  }

  if (!productData.category) {
    errors.push("Category is required");
  }

  if (!productData.description || productData.description.trim().length < 10) {
    errors.push(
      "Description is required and must be at least 10 characters long",
    );
  }

  if (productData.variants && productData.variants.length > 0) {
    productData.variants.forEach((variant, index) => {
      if (!variant.size) {
        errors.push(`Variant ${index + 1}: Size is required`);
      }
      if (!variant.color) {
        errors.push(`Variant ${index + 1}: Color is required`);
      }
      if (variant.stock < 0) {
        errors.push(`Variant ${index + 1}: Stock cannot be negative`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export { serverTimestamp, increment };
