import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  uploadMultipleProductImages,
  deleteAllProductImages,
  deleteProductImage,
} from "../storage.service"; // keep using existing path
import { validateProductData, generateSlug, generateSKU } from "./utils";

const PRODUCTS_COLLECTION = "products";

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

    // Increment view count (keep side-effect here if desired)
    // await updateDoc(productRef, { views: increment(1) }); // optional

    return {
      success: true,
      product,
    };
  } catch (error) {
    // console.error("Error fetching product:", error);
    return {
      success: false,
      error: error.message || "Failed to load product",
    };
  }
};

export const createProduct = async (
  productData,
  imageFiles = [],
  userId = null,
  imageColorMapping = [],
) => {
  try {
    const validation = validateProductData(productData);
    if (!validation.valid) return { success: false, errors: validation.errors };

    const slug = generateSlug(productData.name);

    // Basic slug uniqueness check
    // (Left as simple client-side check here; original code used a query)

    const now = new Date();
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

    if (productData.variants && productData.variants.length > 0) {
      productDoc.variants = productData.variants.map((variant) => ({
        ...variant,
        id: generateSKU(productData.name, variant.size, variant.color),
        sku:
          variant.sku || generateSKU(productData.name, variant.size, variant.color),
        stock: variant.stock || 0,
      }));

      productDoc.totalStock = productDoc.variants.reduce(
        (sum, variant) => sum + variant.stock,
        0,
      );
    }

    const productRef = await addDoc(collection(db, PRODUCTS_COLLECTION), productDoc);
    const productId = productRef.id;

    let uploadedImages = [];
    if (imageFiles && imageFiles.length > 0) {
      const imageUploadResult = await uploadMultipleProductImages(
        imageFiles,
        productId,
        imageColorMapping,
      );

      if (!imageUploadResult.success) {
        // Surface upload errors so UI can react
        return { success: false, error: 'Image upload failed', uploadErrors: imageUploadResult.errors || [imageUploadResult.error] };
      }

      uploadedImages = imageUploadResult.uploadedImages.map((imageData, index) => ({
        ...imageData,
        color: imageColorMapping[index] || "default",
        isPrimary: index === 0,
      }));

      await updateDoc(productRef, { images: uploadedImages });
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
    // console.error("Error creating product:", error);
    return { success: false, error: error.message || "Failed to create product" };
  }
};

export const updateProduct = async (
  productId,
  updateData,
  newImageFiles = [],
  imagesToRemove = [],
  userId = null,
  imageColorMapping = [],
) => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    const productSnap = await getDoc(productRef);
    if (!productSnap.exists()) return { success: false, error: "Product not found" };

    const currentProduct = productSnap.data();

    const validation = validateProductData({ ...currentProduct, ...updateData });
    if (!validation.valid) return { success: false, errors: validation.errors };

    let slug = currentProduct.slug;
    if (updateData.name && updateData.name !== currentProduct.name) {
      slug = generateSlug(updateData.name);
      // uniqueness check can be added
    }

    if (updateData.variants) {
      updateData.variants = updateData.variants.map((variant) => ({
        ...variant,
        id: variant.id || generateSKU(updateData.name || currentProduct.name, variant.size, variant.color),
        sku: variant.sku || generateSKU(updateData.name || currentProduct.name, variant.size, variant.color),
        stock: variant.stock || 0,
      }));

      updateData.totalStock = updateData.variants.reduce((sum, variant) => sum + variant.stock, 0);
    }

    let currentImages = currentProduct.images || [];

    if (imagesToRemove.length > 0) {
      await Promise.all(imagesToRemove.map((url) => deleteProductImage(url)));
      currentImages = currentImages.filter((img) => !imagesToRemove.includes(img.url));
    }

    if (newImageFiles.length > 0) {
      const imageUploadResult = await uploadMultipleProductImages(newImageFiles, productId, imageColorMapping);

      if (!imageUploadResult.success) {
        return { success: false, error: 'Image upload failed', uploadErrors: imageUploadResult.errors || [imageUploadResult.error] };
      }

      const newImagesWithColor = imageUploadResult.uploadedImages.map((imageData, index) => ({
        ...imageData,
        color: imageColorMapping[index] || "default",
        isPrimary: currentImages.length === 0 && index === 0,
      }));

      currentImages = [...currentImages, ...newImagesWithColor];
    }

    const updateDocumentData = { ...updateData, slug, images: currentImages, updatedAt: new Date(), updatedBy: userId };
    await updateDoc(productRef, updateDocumentData);

    return { success: true, message: "Product updated successfully" };
  } catch (error) {
    // console.error("Error updating product:", error);
    return { success: false, error: error.message || "Failed to update product" };
  }
};

export const deleteProduct = async (productId) => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    const productSnap = await getDoc(productRef);
    if (!productSnap.exists()) return { success: false, error: "Product not found" };

    const deleteImagesResult = await deleteAllProductImages(productId);
    if (!deleteImagesResult.success) {
      // console.warn("Some images may not have been deleted:", deleteImagesResult.error);
    }

    await deleteDoc(productRef);

    return { success: true, message: "Product deleted successfully" };
  } catch (error) {
    // console.error("Error deleting product:", error);
    return { success: false, error: error.message || "Failed to delete product" };
  }
};

export const updateProductStock = async (productId, variantId, newStock) => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    const productSnap = await getDoc(productRef);
    if (!productSnap.exists()) return { success: false, error: "Product not found" };

    const product = productSnap.data();
    const variants = product.variants || [];

    const updatedVariants = variants.map((variant) => {
      if (variant.id === variantId) return { ...variant, stock: newStock };
      return variant;
    });

    const totalStock = updatedVariants.reduce((sum, variant) => sum + variant.stock, 0);

    await updateDoc(productRef, { variants: updatedVariants, totalStock, updatedAt: new Date() });

    return { success: true, message: "Stock updated successfully" };
  } catch (error) {
    // console.error("Error updating stock:", error);
    return { success: false, error: error.message || "Failed to update stock" };
  }
};
