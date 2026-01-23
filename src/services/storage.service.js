import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  listAll 
} from 'firebase/storage';
import { storage } from './firebase';

/**
 * Compress and resize image before upload
 * @param {File} file - Image file to compress
 * @param {number} maxWidth - Maximum width
 * @param {number} maxHeight - Maximum height
 * @param {number} quality - Compression quality (0-1)
 * @returns {Promise<Blob>} Compressed image blob
 */
export const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(resolve, file.type, quality);
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Generate unique filename with timestamp
 * @param {string} originalName - Original filename
 * @param {string} productId - Product ID
 * @returns {string} Unique filename
 */
const generateFileName = (originalName, productId = null) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop().toLowerCase();
  const prefix = productId ? `${productId}_` : '';
  
  return `${prefix}${timestamp}_${random}.${extension}`;
};

/**
 * Validate image file
 * @param {File} file - File to validate
 * @returns {Object} Validation result
 */
export const validateImage = (file) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size too large. Maximum size is 5MB.'
    };
  }

  return { valid: true };
};

/**
 * Upload single product image (Legacy function - maintained for compatibility)
 * @param {File} file - Image file to upload
 * @param {string} productId - Product ID (optional)
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
 * Enhanced upload single product image with compression and metadata
 * @param {File} file - Image file to upload
 * @param {string} productId - Product ID (optional)
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Upload result with URL and metadata
 */
export const uploadProductImageEnhanced = async (file, productId = null, onProgress = null) => {
  try {
    // Validate file
    const validation = validateImage(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Compress image
    const compressedBlob = await compressImage(file);
    
    // Generate filename and path
    const fileName = generateFileName(file.name, productId);
    const imagePath = productId ? `products/${productId}/${fileName}` : `products/temp/${fileName}`;
    
    // Create storage reference
    const storageRef = ref(storage, imagePath);
    
    // Upload file
    const uploadResult = await uploadBytes(storageRef, compressedBlob, {
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        productId: productId || 'temp'
      }
    });

    // Get download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);

    return {
      success: true,
      data: {
        id: fileName.split('.')[0], // Remove extension for ID
        url: downloadURL,
        fileName,
        path: imagePath,
        size: compressedBlob.size,
        originalSize: file.size,
        alt: file.name.split('.')[0].replace(/[_-]/g, ' ')
      }
    };

  } catch (error) {
    console.error('Error uploading image:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload image'
    };
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
 * Enhanced upload multiple product images with compression and metadata
 * @param {File[]} files - Array of image files
 * @param {string} productId - Product ID
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Upload results
 */
export const uploadMultipleProductImages = async (files, productId, colorMapping = [], onProgress = null) => {
  try {
    const uploadPromises = files.map(async (file, index) => {
      const result = await uploadProductImageEnhanced(file, productId, (progress) => {
        if (onProgress) {
          onProgress(index, progress);
        }
      });
      return result;
    });

    const results = await Promise.all(uploadPromises);
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return {
      success: failed.length === 0,
      uploadedImages: successful.map(r => r.data),
      errors: failed.map(r => r.error),
      totalUploaded: successful.length,
      totalFailed: failed.length
    };

  } catch (error) {
    console.error('Error uploading multiple images:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload images'
    };
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

/**
 * Delete all images for a product
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteAllProductImages = async (productId) => {
  try {
    const folderRef = ref(storage, `products/${productId}`);
    const listResult = await listAll(folderRef);
    
    const deletePromises = listResult.items.map(itemRef => deleteObject(itemRef));
    await Promise.all(deletePromises);
    
    return {
      success: true,
      deletedCount: listResult.items.length,
      message: `Deleted ${listResult.items.length} images`
    };
  } catch (error) {
    console.error('Error deleting product images:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete product images'
    };
  }
};

/**
 * Move images from temp folder to product folder
 * @param {string[]} tempImagePaths - Array of temporary image paths
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Move result with new URLs
 */
export const moveImagesToProductFolder = async (tempImagePaths, productId) => {
  try {
    const movePromises = tempImagePaths.map(async (tempPath) => {
      const tempRef = ref(storage, tempPath);
      const fileName = tempPath.split('/').pop();
      const newPath = `products/${productId}/${fileName}`;
      const newRef = ref(storage, newPath);
      
      // Get the blob from temp location
      const downloadURL = await getDownloadURL(tempRef);
      const response = await fetch(downloadURL);
      const blob = await response.blob();
      
      // Upload to new location
      await uploadBytes(newRef, blob);
      
      // Delete from temp location
      await deleteObject(tempRef);
      
      // Return new URL
      const newDownloadURL = await getDownloadURL(newRef);
      return {
        oldPath: tempPath,
        newPath,
        newUrl: newDownloadURL
      };
    });
    
    const results = await Promise.all(movePromises);
    
    return {
      success: true,
      movedImages: results
    };
  } catch (error) {
    console.error('Error moving images:', error);
    return {
      success: false,
      error: error.message || 'Failed to move images'
    };
  }
};

/**
 * Get all images for a product
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} List of images
 */
export const getProductImages = async (productId) => {
  try {
    const folderRef = ref(storage, `products/${productId}`);
    const listResult = await listAll(folderRef);
    
    const imagePromises = listResult.items.map(async (itemRef) => {
      const url = await getDownloadURL(itemRef);
      const metadata = await itemRef.getMetadata();
      
      return {
        name: itemRef.name,
        url,
        path: itemRef.fullPath,
        size: metadata.size,
        created: metadata.timeCreated,
        updated: metadata.updated
      };
    });
    
    const images = await Promise.all(imagePromises);
    
    return {
      success: true,
      images
    };
  } catch (error) {
    console.error('Error getting product images:', error);
    return {
      success: false,
      error: error.message || 'Failed to get product images'
    };
  }
};

export default {
  compressImage,
  validateImage,
  uploadProductImage,
  uploadProductImageEnhanced,
  uploadMultipleImages,
  uploadMultipleProductImages,
  deleteProductImage,
  deleteMultipleImages,
  deleteAllProductImages,
  moveImagesToProductFolder,
  getProductImages
};
