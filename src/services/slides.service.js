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
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

const SLIDES_COLLECTION = "slides";

export const addSlide = async (slideData) => {
  try {
    const docData = {
      ...slideData,
      isVisible: slideData.isVisible ?? true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, SLIDES_COLLECTION), docData);
    return { success: true, id: docRef.id, slide: { id: docRef.id, ...docData } };
  } catch (error) {
    console.error("Error adding slide:", error);
    return { success: false, error: error.message };
  }
};

export const updateSlide = async (slideId, slideData) => {
  try {
    const slideRef = doc(db, SLIDES_COLLECTION, slideId);
    const updateData = {
      ...slideData,
      updatedAt: Timestamp.now(),
    };
    await updateDoc(slideRef, updateData);
    return { success: true, slide: { id: slideId, ...updateData } };
  } catch (error) {
    console.error("Error updating slide:", error);
    return { success: false, error: error.message };
  }
};

export const deleteSlide = async (slideId) => {
  try {
    const slideRef = doc(db, SLIDES_COLLECTION, slideId);
    await deleteDoc(slideRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting slide:", error);
    return { success: false, error: error.message };
  }
};

export const getSlide = async (slideId) => {
  try {
    const slideRef = doc(db, SLIDES_COLLECTION, slideId);
    const slideSnap = await getDoc(slideRef);
    if (slideSnap.exists()) {
      return { success: true, slide: { id: slideSnap.id, ...slideSnap.data() } };
    }
    return { success: false, error: "Slide not found" };
  } catch (error) {
    console.error("Error getting slide:", error);
    return { success: false, error: error.message };
  }
};

export const getSlides = async (options = {}) => {
  try {
    const {
      isVisible = null,
      orderByField = "order",
      orderDirection = "asc",
      limitCount = 100,
    } = options;

    let q = query(collection(db, SLIDES_COLLECTION));

    if (isVisible !== null) {
      q = query(q, where("isVisible", "==", isVisible));
    }

    // If order field is present use it, otherwise order by createdAt desc
    try {
      q = query(q, orderBy(orderByField, orderDirection), limit(limitCount));
    } catch (err) {
      q = query(q, orderBy("createdAt", "desc"), limit(limitCount));
    }

    const querySnapshot = await getDocs(q);
    const slides = [];
    querySnapshot.forEach((docSnap) => {
      slides.push({ id: docSnap.id, ...docSnap.data() });
    });

    return { success: true, slides };
  } catch (error) {
    console.error("Error getting slides:", error);
    return { success: false, error: error.message, slides: [] };
  }
};

export const getSlidesForHome = async (limitCount = 10) => {
  try {

    
    // First try with composite index (isVisible + order)
    try {
      const q = query(
        collection(db, SLIDES_COLLECTION),
        where("isVisible", "==", true),
        orderBy("order", "asc"),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      const slides = [];
      querySnapshot.forEach((docSnap) => {
        slides.push({ id: docSnap.id, ...docSnap.data() });
      });

      return { success: true, slides };
    } catch (indexError) {

      
      // Fallback: get all slides and filter/sort in memory
      const basicQuery = query(collection(db, SLIDES_COLLECTION), limit(limitCount * 2));
      const querySnapshot = await getDocs(basicQuery);
      const allSlides = [];
      querySnapshot.forEach((docSnap) => {
        const slideData = { id: docSnap.id, ...docSnap.data() };
        // Filter visible slides in memory (allow null/undefined to default to true)
        if (slideData.isVisible !== false) {
          allSlides.push(slideData);
        }
      });
      
      // Sort by order and limit
      const sortedSlides = allSlides.sort((a, b) => (a.order || 0) - (b.order || 0)).slice(0, limitCount);

      return { success: true, slides: sortedSlides };
    }
  } catch (error) {
    console.error("Error getting slides for home:", error);
    return { success: false, error: error.message, slides: [] };
  }
};

/**
 * Subscribe to visible slides changes in real-time
 * @param {Function} callback - Callback function to receive updated slides
 * @param {number} limitCount - Maximum number of slides to retrieve
 * @returns {Function} Unsubscribe function to stop listening
 */
export const subscribeSlidesForHome = (callback, limitCount = 10) => {
  // Try with composite index first
  try {
    const q = query(
      collection(db, SLIDES_COLLECTION),
      where("isVisible", "==", true),
      orderBy("order", "asc"),
      limit(limitCount)
    );
    
    return onSnapshot(
      q,
      (querySnapshot) => {
        const slides = [];
        querySnapshot.forEach((docSnap) => {
          slides.push({ id: docSnap.id, ...docSnap.data() });
        });
        callback({ success: true, slides });
      },
      (error) => {
        console.error("Error listening to slides:", error);
        // Fallback to basic query without ordering
        const basicQuery = query(
          collection(db, SLIDES_COLLECTION),
          limit(limitCount * 2)
        );
        
        return onSnapshot(
          basicQuery,
          (querySnapshot) => {
            const allSlides = [];
            querySnapshot.forEach((docSnap) => {
              const slideData = { id: docSnap.id, ...docSnap.data() };
              if (slideData.isVisible !== false) {
                allSlides.push(slideData);
              }
            });
            const sortedSlides = allSlides
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .slice(0, limitCount);
            callback({ success: true, slides: sortedSlides });
          },
          (error) => {
            console.error("Error listening to slides (fallback):", error);
            callback({ success: false, error: error.message, slides: [] });
          }
        );
      }
    );
  } catch (error) {
    console.error("Error setting up slides listener:", error);
    // Return a no-op unsubscribe function
    return () => {};
  }
};
