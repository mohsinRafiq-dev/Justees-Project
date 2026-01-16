import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const PRODUCTS_COLLECTION = 'products';

/**
 * Get all products from Firestore
 * @returns {Promise<Array>} Array of products
 */
export const getAllProducts = async () => {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const q = query(productsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const products = [];
    querySnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Error('Failed to load products.');
  }
};

/**
 * Get a single product by ID
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Product data
 */
export const getProductById = async (productId) => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    const productSnap = await getDoc(productRef);
    
    if (productSnap.exists()) {
      return {
        id: productSnap.id,
        ...productSnap.data(),
      };
    } else {
      throw new Error('Product not found.');
    }
  } catch (error) {
    console.error('Error fetching product:', error);
    throw new Error('Failed to load product.');
  }
};

/**
 * Create a new product
 * @param {Object} productData - Product data
 * @returns {Promise<string>} New product ID
 */
export const createProduct = async (productData) => {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const docRef = await addDoc(productsRef, {
      ...productData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating product:', error);
    throw new Error('Failed to create product.');
  }
};

/**
 * Update an existing product
 * @param {string} productId - Product ID
 * @param {Object} productData - Updated product data
 * @returns {Promise<void>}
 */
export const updateProduct = async (productId, productData) => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    await updateDoc(productRef, {
      ...productData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating product:', error);
    throw new Error('Failed to update product.');
  }
};

/**
 * Delete a product
 * @param {string} productId - Product ID
 * @returns {Promise<void>}
 */
export const deleteProduct = async (productId) => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    await deleteDoc(productRef);
  } catch (error) {
    console.error('Error deleting product:', error);
    throw new Error('Failed to delete product.');
  }
};

/**
 * Search products by name or category
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Filtered products
 */
export const searchProducts = async (searchTerm) => {
  try {
    const allProducts = await getAllProducts();
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return allProducts.filter((product) => {
      const nameMatch = product.name?.toLowerCase().includes(lowerSearchTerm);
      const categoryMatch = product.category?.toLowerCase().includes(lowerSearchTerm);
      const descriptionMatch = product.description?.toLowerCase().includes(lowerSearchTerm);
      
      return nameMatch || categoryMatch || descriptionMatch;
    });
  } catch (error) {
    console.error('Error searching products:', error);
    throw new Error('Failed to search products.');
  }
};
