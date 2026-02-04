import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { generateSlug } from "./utils";
import { getAllProducts } from "./queries";

const CATEGORIES_COLLECTION = "categories";
const SIZES_COLLECTION = "sizes";
const COLORS_COLLECTION = "colors";

export const getCategories = async () => {
  try {
    const q = collection(db, CATEGORIES_COLLECTION);
    const snap = await getDocs(q);
    const categories = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return { success: true, categories };
  } catch (error) {
    console.error("Error getting categories:", error);
    return { success: false, error: error.message || "Failed to get categories" };
  }
};

export const createCategory = async (name) => {
  try {
    const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), { name, createdAt: new Date() });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error creating category:", error);
    return { success: false, error: error.message || "Failed to create category" };
  }
};

export const updateCategory = async (id, data) => {
  try {
    const ref = doc(db, CATEGORIES_COLLECTION, id);
    await updateDoc(ref, { ...data, updatedAt: new Date() });
    return { success: true };
  } catch (error) {
    console.error("Error updating category:", error);
    return { success: false, error: error.message || "Failed to update category" };
  }
};

export const deleteCategory = async (id) => {
  try {
    await deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    return { success: false, error: error.message || "Failed to delete category" };
  }
};

export const getSizes = async () => {
  try {
    const snap = await getDocs(collection(db, SIZES_COLLECTION));
    const sizes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return { success: true, sizes };
  } catch (error) {
    console.error("Error getting sizes:", error);
    return { success: false, error: error.message || "Failed to get sizes" };
  }
};

export const createSize = async (name) => {
  try {
    const slug = generateSlug(name);
    const docRef = await addDoc(collection(db, SIZES_COLLECTION), { name, slug, createdAt: new Date() });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error creating size:", error);
    return { success: false, error: error.message || "Failed to create size" };
  }
};

export const updateSize = async (id, data) => {
  try {
    const ref = doc(db, SIZES_COLLECTION, id);
    await updateDoc(ref, { ...data, updatedAt: new Date() });
    return { success: true };
  } catch (error) {
    console.error("Error updating size:", error);
    return { success: false, error: error.message || "Failed to update size" };
  }
};

export const getProductsUsingSize = async (sizeName) => {
  try {
    // Only check active products to allow deleting sizes used by deleted/inactive products
    const res = await getAllProducts({ limitCount: 1000, status: 'active' });
    if (!res.success) return { success: false, error: res.error };

    const products = (res.products || []).filter(p => (p.variants || []).some(v => v.size === sizeName));
    return { success: true, products };
  } catch (error) {
    console.error('Error checking products for size:', error);
    return { success: false, error: error.message || 'Failed to check products' };
  }
};

export const deleteSize = async (id) => {
  try {
    const sizeDoc = (await getDoc(doc(db, SIZES_COLLECTION, id))).data();
    const sizeName = sizeDoc?.name;
    if (sizeName) {
      const check = await getProductsUsingSize(sizeName);
      if (check.success && check.products && check.products.length > 0) {
        const blocking = check.products.map(p => ({ id: p.id, name: p.name }));
        return { success: false, error: 'Size in use by products', blockingProducts: blocking };
      }
    }

    await deleteDoc(doc(db, SIZES_COLLECTION, id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting size:", error);
    return { success: false, error: error.message || "Failed to delete size" };
  }
};

export const getColors = async () => {
  try {
    const snap = await getDocs(collection(db, COLORS_COLLECTION));
    const colors = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return { success: true, colors };
  } catch (error) {
    console.error("Error getting colors:", error);
    return { success: false, error: error.message || "Failed to get colors" };
  }
};

export const createColor = async (name) => {
  try {
    const slug = generateSlug(name);
    // Removed hex, order, isActive
    const docRef = await addDoc(collection(db, COLORS_COLLECTION), { name, slug, createdAt: new Date() });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error creating color:", error);
    return { success: false, error: error.message || "Failed to create color" };
  }
};

export const updateColor = async (id, data) => {
  try {
    const ref = doc(db, COLORS_COLLECTION, id);
    await updateDoc(ref, { ...data, updatedAt: new Date() });
    return { success: true };
  } catch (error) {
    console.error("Error updating color:", error);
    return { success: false, error: error.message || "Failed to update color" };
  }
};

export const getProductsUsingColor = async (colorName) => {
  try {
    // Only check active products
    const res = await getAllProducts({ limitCount: 1000, status: 'active' });
    if (!res.success) return { success: false, error: res.error };

    const products = (res.products || []).filter(p => (p.variants || []).some(v => v.color === colorName));
    return { success: true, products };
  } catch (error) {
    console.error('Error checking products for color:', error);
    return { success: false, error: error.message || 'Failed to check products' };
  }
};

export const deleteColor = async (id) => {
  try {
    const colorDoc = (await getDoc(doc(db, COLORS_COLLECTION, id))).data();
    const colorName = colorDoc?.name;
    if (colorName) {
      const check = await getProductsUsingColor(colorName);
      if (check.success && check.products && check.products.length > 0) {
        const blocking = check.products.map(p => ({ id: p.id, name: p.name }));
        return { success: false, error: 'Color in use by products', blockingProducts: blocking };
      }
    }

    await deleteDoc(doc(db, COLORS_COLLECTION, id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting color:", error);
    return { success: false, error: error.message || "Failed to delete color" };
  }
};
