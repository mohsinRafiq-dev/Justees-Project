import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

const PRODUCT_PHOTOS_COLLECTION = "product_photos";

export const addProductPhoto = async (photoData) => {
  try {
    const docData = {
      ...photoData,
      isVisible: photoData.isVisible ?? true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, PRODUCT_PHOTOS_COLLECTION), docData);
    return { success: true, id: docRef.id, photo: { id: docRef.id, ...docData } };
  } catch (error) {
    console.error("Error adding product photo:", error);
    return { success: false, error: error.message };
  }
};

export const updateProductPhoto = async (photoId, photoData) => {
  try {
    const ref = doc(db, PRODUCT_PHOTOS_COLLECTION, photoId);
    const updateData = {
      ...photoData,
      updatedAt: Timestamp.now(),
    };
    await updateDoc(ref, updateData);
    return { success: true, photo: { id: photoId, ...updateData } };
  } catch (error) {
    console.error("Error updating product photo:", error);
    return { success: false, error: error.message };
  }
};

export const deleteProductPhoto = async (photoId) => {
  try {
    const ref = doc(db, PRODUCT_PHOTOS_COLLECTION, photoId);
    await deleteDoc(ref);
    return { success: true };
  } catch (error) {
    console.error("Error deleting product photo:", error);
    return { success: false, error: error.message };
  }
};

export const getProductPhoto = async (photoId) => {
  try {
    const ref = doc(db, PRODUCT_PHOTOS_COLLECTION, photoId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return { success: true, photo: { id: snap.id, ...snap.data() } };
    }
    return { success: false, error: 'Photo not found' };
  } catch (error) {
    console.error('Error getting product photo:', error);
    return { success: false, error: error.message };
  }
};

export const getProductPhotos = async (options = {}) => {
  try {
    const { isVisible = null, orderByField = 'order', orderDirection = 'asc', limitCount = 50 } = options;
    let q = query(collection(db, PRODUCT_PHOTOS_COLLECTION));

    try {
      q = query(q, orderBy(orderByField, orderDirection), limit(limitCount));
    } catch (err) {
      // fallback
      q = query(q, limit(limitCount));
    }

    const querySnapshot = await getDocs(q);
    const photos = [];
    querySnapshot.forEach((docSnap) => {
      const data = { id: docSnap.id, ...docSnap.data() };
      if (isVisible === null || data.isVisible !== false) {
        photos.push(data);
      }
    });

    // ensure ordered by 'order' if present
    photos.sort((a, b) => (a.order || 0) - (b.order || 0));

    return { success: true, photos };
  } catch (error) {
    console.error('Error getting product photos:', error);
    return { success: false, error: error.message, photos: [] };
  }
};
