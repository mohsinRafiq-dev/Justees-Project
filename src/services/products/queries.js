import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";

const PRODUCTS_COLLECTION = "products";

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

    let q = query(productsRef, orderBy(orderByField, orderDirection));

    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const querySnapshot = await getDocs(q);

    let products = [];
    querySnapshot.forEach((d) => {
      const data = d.data();
      products.push({
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || null,
        updatedAt: data.updatedAt?.toDate?.() || null,
      });
    });

    // Client-side filters to avoid index requirements
    if (status) {
      products = products.filter((p) => p.status === status);
    }

    if (typeof isVisible === "boolean") {
      products = products.filter((p) => p.isVisible === isVisible);
    }

    if (category && category !== "All") {
      products = products.filter((p) => p.category === category);
    }

    if (typeof featured === "boolean") {
      products = products.filter((p) => p.isFeatured === featured);
    }

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

export const getProductsByCategory = async (categoryName, options = {}) => {
  return getAllProducts({
    ...options,
    category: categoryName,
  });
};

export const searchProducts = async (searchTerm, options = {}) => {
  return getAllProducts({
    ...options,
    searchTerm,
  });
};

export const getFeaturedProducts = async (limitCount = 8) => {
  return getAllProducts({
    featured: true,
    limitCount,
  });
};

export const getProductAnalytics = async (productId = null) => {
  try {
    if (productId) {
      // delegate to CRUD getProductById if needed (imported in index)
      return { success: false, error: 'Use getProductById for specific product analytics' };
    } else {
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
