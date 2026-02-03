import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  uploadMultipleProductImages,
  deleteAllProductImages,
  deleteProductImage,
} from "./storage.service";

const PRODUCTS_COLLECTION = "products";
const CATEGORIES_COLLECTION = "categories";
const INVENTORY_COLLECTION = "inventory";
const SIZES_COLLECTION = "sizes";
const COLORS_COLLECTION = "colors";  // separate collections for admin-managed colors


/**
 * Generate URL-friendly slug from product name
 * @param {string} name - Product name
 * @returns {string} URL slug
 */
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
};

/**
 * Generate SKU for product variant
 * @param {string} productName - Product name
 * @param {string} size - Variant size
 * @param {string} color - Variant color
 * @returns {string} Generated SKU
 */
const generateSKU = (productName, size, color) => {
  const nameCode = productName.substring(0, 3).toUpperCase();
  const sizeCode = size.toUpperCase();
  const colorCode = color.substring(0, 2).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);

  return `${nameCode}-${sizeCode}-${colorCode}-${timestamp}`;
};

/**
 * Validate product data
 * @param {Object} productData - Product data to validate
 * @returns {Object} Validation result
 */
export const validateProductData = (productData) => {
  const errors = [];

  // Required fields
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

  // Validate variants if provided
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

/**
 * Get all products from Firestore with optional filters and pagination
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Query result with products and pagination info
 */
export const getAllProducts = async (options = {}) => {
  try {
    const {
      category,
      status,
      isVisible,
      featured,
      orderByField = "createdAt",
      orderDirection = "desc",
      limitCount = 20,
      lastDoc = null,
      searchTerm,
    } = options;

    const productsRef = collection(db, PRODUCTS_COLLECTION);
    
    // Simple query with just ordering - no complex where clauses
    let q = query(productsRef, orderBy(orderByField, orderDirection));

    // Apply pagination
    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const querySnapshot = await getDocs(q);

    let products = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      products.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || null,
        updatedAt: data.updatedAt?.toDate?.() || null,
      });
    });

    // Apply filters client-side to avoid index requirements
    if (status) {
      products = products.filter(p => p.status === status);
    }

    if (typeof isVisible === "boolean") {
      products = products.filter(p => p.isVisible === isVisible);
    }

    if (category && category !== "All") {
      products = products.filter(p => p.category === category);
    }

    if (typeof featured === "boolean") {
      products = products.filter(p => p.isFeatured === featured);
    }

    // Apply search filter if provided (client-side)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      products = products.filter(
        (product) =>
          product.name.toLowerCase().includes(term) ||
          product.description.toLowerCase().includes(term) ||
          product.tags?.some((tag) => tag.toLowerCase().includes(term)),
      );
    }

    return {
      success: true,
      products,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
      hasMore: querySnapshot.docs.length === limitCount,
      total: products.length,
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      success: false,
      error: error.message || "Failed to load products",
      products: [],
    };
  }
};

/**
 * Get a single product by ID with full details
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Product data with additional details
 */
export const getProductById = async (productId) => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    const data = productSnap.data();
    const product = {
      id: productSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || null,
      updatedAt: data.updatedAt?.toDate?.() || null,
    };

    // Increment view count
    await updateDoc(productRef, {
      views: increment(1),
    });

    return {
      success: true,
      product,
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    return {
      success: false,
      error: error.message || "Failed to load product",
    };
  }
};

/**
 * Create a new product with variants and images
 * @param {Object} productData - Product data
 * @param {File[]} imageFiles - Array of image files
 * @param {string} userId - User ID creating the product
 * @returns {Promise<Object>} Creation result
 */
export const createProduct = async (
  productData,
  imageFiles = [],
  userId = null,
  imageColorMapping = []
) => {
  try {
    // Validate product data
    const validation = validateProductData(productData);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
      };
    }

    // Generate slug
    const slug = generateSlug(productData.name);

    // Check if slug already exists
    const existingProductQuery = query(
      collection(db, PRODUCTS_COLLECTION),
      where("slug", "==", slug),
      limit(1),
    );
    const existingSnapshot = await getDocs(existingProductQuery);

    if (!existingSnapshot.empty) {
      return {
        success: false,
        error: "A product with this name already exists",
      };
    }

    // Prepare product document
    const now = serverTimestamp();
    const productDoc = {
      ...productData,
      slug,
      status: productData.status || "active",
      isVisible: productData.isVisible !== false,
      isFeatured: productData.isFeatured || false,
      views: 0,
      sales: 0,
      rating: 0,
      reviewCount: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
    };

    // Process variants
    if (productData.variants && productData.variants.length > 0) {
      productDoc.variants = productData.variants.map((variant) => ({
        ...variant,
        id: generateSKU(productData.name, variant.size, variant.color),
        sku:
          variant.sku ||
          generateSKU(productData.name, variant.size, variant.color),
        stock: variant.stock || 0,
      }));

      // Calculate total stock
      productDoc.totalStock = productDoc.variants.reduce(
        (sum, variant) => sum + variant.stock,
        0,
      );
    }

    // Create product document
    const productRef = await addDoc(
      collection(db, PRODUCTS_COLLECTION),
      productDoc,
    );
    const productId = productRef.id;

    // Upload images if provided
    let uploadedImages = [];
    if (imageFiles && imageFiles.length > 0) {
      const imageUploadResult = await uploadMultipleProductImages(
        imageFiles,
        productId,
        imageColorMapping
      );
      if (imageUploadResult.success) {
        // Map uploaded images with color information
        uploadedImages = imageUploadResult.uploadedImages.map((imageData, index) => ({
          ...imageData,
          color: imageColorMapping[index] || 'default',
          isPrimary: index === 0
        }));

        // Update product with image URLs
        await updateDoc(productRef, {
          images: uploadedImages,
        });
      }
    }

    return {
      success: true,
      productId,
      product: {
        id: productId,
        ...productDoc,
        images: uploadedImages,
      },
      message: "Product created successfully",
    };
  } catch (error) {
    console.error("Error creating product:", error);
    return {
      success: false,
      error: error.message || "Failed to create product",
    };
  }
};

/**
 * Update an existing product
 * @param {string} productId - Product ID to update
 * @param {Object} updateData - Data to update
 * @param {File[]} newImageFiles - New image files to add
 * @param {string[]} imagesToRemove - Image URLs to remove
 * @param {string} userId - User ID updating the product
 * @returns {Promise<Object>} Update result
 */
export const updateProduct = async (
  productId,
  updateData,
  newImageFiles = [],
  imagesToRemove = [],
  userId = null,
  imageColorMapping = []
) => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);

    // Check if product exists
    const productSnap = await getDoc(productRef);
    if (!productSnap.exists()) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    const currentProduct = productSnap.data();

    // Validate update data
    const validation = validateProductData({
      ...currentProduct,
      ...updateData,
    });
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
      };
    }

    // Generate new slug if name changed
    let slug = currentProduct.slug;
    if (updateData.name && updateData.name !== currentProduct.name) {
      slug = generateSlug(updateData.name);

      // Check if new slug already exists
      const existingProductQuery = query(
        collection(db, PRODUCTS_COLLECTION),
        where("slug", "==", slug),
        where("__name__", "!=", productId),
        limit(1),
      );
      const existingSnapshot = await getDocs(existingProductQuery);

      if (!existingSnapshot.empty) {
        return {
          success: false,
          error: "A product with this name already exists",
        };
      }
    }

    // Process variants if updated
    if (updateData.variants) {
      updateData.variants = updateData.variants.map((variant) => ({
        ...variant,
        id:
          variant.id ||
          generateSKU(
            updateData.name || currentProduct.name,
            variant.size,
            variant.color,
          ),
        sku:
          variant.sku ||
          generateSKU(
            updateData.name || currentProduct.name,
            variant.size,
            variant.color,
          ),
        stock: variant.stock || 0,
      }));

      // Recalculate total stock
      updateData.totalStock = updateData.variants.reduce(
        (sum, variant) => sum + variant.stock,
        0,
      );
    }

    // Handle image updates
    let currentImages = currentProduct.images || [];

    // Remove specified images
    if (imagesToRemove.length > 0) {
      // Remove from storage (handled by existing function)
      await Promise.all(imagesToRemove.map((url) => deleteProductImage(url)));

      // Remove from current images array
      currentImages = currentImages.filter(
        (img) => !imagesToRemove.includes(img.url),
      );
    }

    // Upload new images
    if (newImageFiles.length > 0) {
      const imageUploadResult = await uploadMultipleProductImages(
        newImageFiles,
        productId,
        imageColorMapping
      );
      if (imageUploadResult.success) {
        // Add new images with color information
        const newImagesWithColor = imageUploadResult.uploadedImages.map((imageData, index) => ({
          ...imageData,
          color: imageColorMapping[index] || 'default',
          isPrimary: currentImages.length === 0 && index === 0
        }));
        
        currentImages = [...currentImages, ...newImagesWithColor];
      }
    }

    // Prepare update document
    const updateDocumentData = {
      ...updateData,
      slug,
      images: currentImages,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    };

    // Update product document
    await updateDoc(productRef, updateDocumentData);

    return {
      success: true,
      message: "Product updated successfully",
    };
  } catch (error) {
    console.error("Error updating product:", error);
    return {
      success: false,
      error: error.message || "Failed to update product",
    };
  }
};

/**
 * Delete a product and all associated data
 * @param {string} productId - Product ID to delete
 * @returns {Promise<Object>} Deletion result
 */
export const deleteProduct = async (productId) => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);

    // Check if product exists
    const productSnap = await getDoc(productRef);
    if (!productSnap.exists()) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    // Delete all product images from storage
    const deleteImagesResult = await deleteAllProductImages(productId);
    if (!deleteImagesResult.success) {
      console.warn(
        "Some images may not have been deleted:",
        deleteImagesResult.error,
      );
    }

    // Delete product document
    await deleteDoc(productRef);

    return {
      success: true,
      message: "Product deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting product:", error);
    return {
      success: false,
      error: error.message || "Failed to delete product",
    };
  }
};

/**
 * Get products by category
 * @param {string} categoryName - Category name
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Products in category
 */
export const getProductsByCategory = async (categoryName, options = {}) => {
  return getAllProducts({
    ...options,
    category: categoryName,
  });
};

/**
 * Search products by name, description, or tags
 * @param {string} searchTerm - Search term
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Search results
 */
export const searchProducts = async (searchTerm, options = {}) => {
  return getAllProducts({
    ...options,
    searchTerm,
  });
};

/**
 * Get featured products
 * @param {number} limitCount - Number of products to return
 * @returns {Promise<Object>} Featured products
 */
export const getFeaturedProducts = async (limitCount = 8) => {
  return getAllProducts({
    featured: true,
    limitCount,
  });
};

/**
 * Update product stock for a specific variant
 * @param {string} productId - Product ID
 * @param {string} variantId - Variant ID
 * @param {number} newStock - New stock amount
 * @returns {Promise<Object>} Update result
 */
export const updateProductStock = async (productId, variantId, newStock) => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    const product = productSnap.data();
    const variants = product.variants || [];

    // Find and update the specific variant
    const updatedVariants = variants.map((variant) => {
      if (variant.id === variantId) {
        return { ...variant, stock: newStock };
      }
      return variant;
    });

    // Recalculate total stock
    const totalStock = updatedVariants.reduce(
      (sum, variant) => sum + variant.stock,
      0,
    );

    // Update product
    await updateDoc(productRef, {
      variants: updatedVariants,
      totalStock,
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
      message: "Stock updated successfully",
    };
  } catch (error) {
    console.error("Error updating stock:", error);
    return {
      success: false,
      error: error.message || "Failed to update stock",
    };
  }
};

/**
 * Get product analytics/statistics
 * @param {string} productId - Product ID (optional, if not provided returns all products stats)
 * @returns {Promise<Object>} Analytics data
 */
export const getProductAnalytics = async (productId = null) => {
  try {
    if (productId) {
      // Get specific product analytics
      const result = await getProductById(productId);
      if (!result.success) {
        return result;
      }

      return {
        success: true,
        analytics: {
          views: result.product.views || 0,
          sales: result.product.sales || 0,
          rating: result.product.rating || 0,
          reviewCount: result.product.reviewCount || 0,
          totalStock: result.product.totalStock || 0,
        },
      };
    } else {
      // Get overall analytics
      const result = await getAllProducts({ limitCount: 1000 });
      if (!result.success) {
        return result;
      }

      const products = result.products;
      const analytics = {
        totalProducts: products.length,
        totalViews: products.reduce((sum, p) => sum + (p.views || 0), 0),
        totalSales: products.reduce((sum, p) => sum + (p.sales || 0), 0),
        totalStock: products.reduce((sum, p) => sum + (p.totalStock || 0), 0),
        averageRating:
          products.reduce((sum, p) => sum + (p.rating || 0), 0) /
            products.length || 0,
        outOfStock: products.filter((p) => (p.totalStock || 0) === 0).length,
        featuredProducts: products.filter((p) => p.isFeatured).length,
      };

      return {
        success: true,
        analytics,
      };
    }
  } catch (error) {
    console.error("Error getting analytics:", error);
    return {
      success: false,
      error: error.message || "Failed to get analytics",
    };
  }
};

/**
 * Categories management (admin)
 */
export const getCategories = async () => {
  try {
    const q = collection(db, CATEGORIES_COLLECTION);
    const snap = await getDocs(q);
    const categories = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return { success: true, categories };
  } catch (error) {
    console.error('Error getting categories:', error);
    return { success: false, error: error.message || 'Failed to get categories' };
  }
};

export const createCategory = async (name) => {
  try {
    const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), {
      name,
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating category:', error);
    return { success: false, error: error.message || 'Failed to create category' };
  }
};

export const updateCategory = async (id, data) => {
  try {
    const ref = doc(db, CATEGORIES_COLLECTION, id);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    console.error('Error updating category:', error);
    return { success: false, error: error.message || 'Failed to update category' };
  }
};

export const deleteCategory = async (id) => {
  try {
    await deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { success: false, error: error.message || 'Failed to delete category' };
  }
};

/**
 * Sizes & Colors management (admin)
 */
export const getSizes = async () => {
  try {
    const snap = await getDocs(collection(db, SIZES_COLLECTION));
    const sizes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return { success: true, sizes };
  } catch (error) {
    console.error('Error getting sizes:', error);
    return { success: false, error: error.message || 'Failed to get sizes' };
  }
};

export const createSize = async (name) => {
  try {
    const docRef = await addDoc(collection(db, SIZES_COLLECTION), {
      name,
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating size:', error);
    return { success: false, error: error.message || 'Failed to create size' };
  }
};

export const deleteSize = async (id) => {
  try {
    await deleteDoc(doc(db, SIZES_COLLECTION, id));
    return { success: true };
  } catch (error) {
    console.error('Error deleting size:', error);
    return { success: false, error: error.message || 'Failed to delete size' };
  }
};

export const getColors = async () => {
  try {
    const snap = await getDocs(collection(db, COLORS_COLLECTION));
    const colors = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return { success: true, colors };
  } catch (error) {
    console.error('Error getting colors:', error);
    return { success: false, error: error.message || 'Failed to get colors' };
  }
};

export const createColor = async (name) => {
  try {
    const docRef = await addDoc(collection(db, COLORS_COLLECTION), {
      name,
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating color:', error);
    return { success: false, error: error.message || 'Failed to create color' };
  }
};

export const deleteColor = async (id) => {
  try {
    await deleteDoc(doc(db, COLORS_COLLECTION, id));
    return { success: true };
  } catch (error) {
    console.error('Error deleting color:', error);
    return { success: false, error: error.message || 'Failed to delete color' };
  }
};

/**
 * Orders management (basic)
 */
export const getAllOrders = async () => {
  try {
    const snap = await getDocs(collection(db, 'orders'));
    const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return { success: true, orders };
  } catch (error) {
    console.error('Error getting orders:', error);
    return { success: false, error: error.message || 'Failed to get orders' };
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    const ref = doc(db, 'orders', orderId);
    await updateDoc(ref, { status, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    console.error('Error updating order:', error);
    return { success: false, error: error.message || 'Failed to update order' };
  }
};
