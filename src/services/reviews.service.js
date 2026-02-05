import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

const REVIEWS_COLLECTION = "reviews";

/**
 * Add a new review
 */
export const addReview = async (reviewData) => {
  try {
    const reviewDoc = {
      ...reviewData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      isVisible: reviewData.isVisible ?? true,
    };

    const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), reviewDoc);
    return { success: true, id: docRef.id, review: { id: docRef.id, ...reviewDoc } };
  } catch (error) {
    console.error("Error adding review:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Update an existing review
 */
export const updateReview = async (reviewId, reviewData) => {
  try {
    const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
    const updateData = {
      ...reviewData,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(reviewRef, updateData);
    return { success: true, review: { id: reviewId, ...updateData } };
  } catch (error) {
    console.error("Error updating review:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a review
 */
export const deleteReview = async (reviewId) => {
  try {
    const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
    await deleteDoc(reviewRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting review:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get a single review by ID
 */
export const getReview = async (reviewId) => {
  try {
    const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
    const reviewSnap = await getDoc(reviewRef);

    if (reviewSnap.exists()) {
      return {
        success: true,
        review: { id: reviewSnap.id, ...reviewSnap.data() },
      };
    } else {
      return { success: false, error: "Review not found" };
    }
  } catch (error) {
    console.error("Error getting review:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all reviews with optional filters
 */
export const getAllReviews = async (options = {}) => {
  try {
    const {
      isVisible = null,
      productId = null,
      limitCount = 100,
      orderByField = "createdAt",
      orderDirection = "desc",
    } = options;

    let q = query(collection(db, REVIEWS_COLLECTION));

    // Apply filters
    if (isVisible !== null) {
      q = query(q, where("isVisible", "==", isVisible));
    }

    if (productId) {
      q = query(q, where("productId", "==", productId));
    }

    // Apply ordering and limit
    q = query(q, orderBy(orderByField, orderDirection), limit(limitCount));

    const querySnapshot = await getDocs(q);
    const reviews = [];

    querySnapshot.forEach((doc) => {
      reviews.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return { success: true, reviews };
  } catch (error) {
    console.error("Error getting reviews:", error);
    return { success: false, error: error.message, reviews: [] };
  }
};

/**
 * Get reviews for a specific product
 */
export const getProductReviews = async (productId, limitCount = 50) => {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where("productId", "==", productId),
      where("isVisible", "==", true),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const reviews = [];

    querySnapshot.forEach((doc) => {
      reviews.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return { success: true, reviews };
  } catch (error) {
    console.error("Error getting product reviews:", error);
    return { success: false, error: error.message, reviews: [] };
  }
};

/**
 * Get recent reviews for display on home page
 */
export const getRecentReviews = async (limitCount = 6) => {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where("isVisible", "==", true),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const reviews = [];

    querySnapshot.forEach((doc) => {
      reviews.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return { success: true, reviews };
  } catch (error) {
    console.error("Error getting recent reviews:", error);
    return { success: false, error: error.message, reviews: [] };
  }
};

/**
 * Toggle review visibility
 */
export const toggleReviewVisibility = async (reviewId, isVisible) => {
  try {
    const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
    await updateDoc(reviewRef, {
      isVisible,
      updatedAt: Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error toggling review visibility:", error);
    return { success: false, error: error.message };
  }
};
