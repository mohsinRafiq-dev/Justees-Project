import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from './firebase';

/**
 * Upload product image to Firebase Storage
 * @param {File} file - Image file to upload
 * @param {string} productId - Product ID (optional, for naming)
 * @returns {Promise<string>} Download URL of uploaded image
 */
export const uploadProductImage = async (file, productId = null) => {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed.');
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('Image size must be less than 5MB.');
    }

    // Create unique filename
    const timestamp = Date.now();
    const fileName = productId 
      ? `${productId}_${timestamp}_${file.name}`
      : `${timestamp}_${file.name}`;
    
    // Create storage reference
    const storageRef = ref(storage, `products/${fileName}`);
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error(error.message || 'Failed to upload image.');
  }
};

/**
 * Delete product image from Firebase Storage
 * @param {string} imageUrl - Full URL of the image to delete
 * @returns {Promise<void>}
 */
export const deleteProductImage = async (imageUrl) => {
  try {
    // Extract the file path from the URL
    const decodedUrl = decodeURIComponent(imageUrl);
    const startIndex = decodedUrl.indexOf('/o/') + 3;
    const endIndex = decodedUrl.indexOf('?');
    const filePath = decodedUrl.substring(startIndex, endIndex);
    
    // Create reference to the file
    const imageRef = ref(storage, filePath);
    
    // Delete the file
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw error if image doesn't exist
    if (error.code !== 'storage/object-not-found') {
      throw new Error('Failed to delete image.');
    }
  }
};

/**
 * Upload multiple product images
 * @param {FileList|Array<File>} files - Array of image files
 * @param {string} productId - Product ID
 * @returns {Promise<Array<string>>} Array of download URLs
 */
export const uploadMultipleImages = async (files, productId = null) => {
  try {
    const uploadPromises = Array.from(files).map((file) =>
      uploadProductImage(file, productId)
    );
    
    const downloadURLs = await Promise.all(uploadPromises);
    return downloadURLs;
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw new Error('Failed to upload images.');
  }
};

/**
 * Delete multiple product images
 * @param {Array<string>} imageUrls - Array of image URLs to delete
 * @returns {Promise<void>}
 */
export const deleteMultipleImages = async (imageUrls) => {
  try {
    const deletePromises = imageUrls.map((url) => deleteProductImage(url));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting multiple images:', error);
    throw new Error('Failed to delete images.');
  }
};
