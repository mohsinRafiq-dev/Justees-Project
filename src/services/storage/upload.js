import { ref, getDownloadURL, uploadBytes } from 'firebase/storage';
import { storage, auth } from '../firebase';
import { compressImage, validateImage, validateMedia, generateFileName } from './utils';


export const uploadProductImageEnhanced = async (file, productId = null, onProgress = null) => {

  try {
    const validation = validateImage(file);
    if (!validation.valid) {

      throw new Error(validation.error);
    }

    const compressedBlob = await compressImage(file);


    const fileName = generateFileName(file.name, productId);
    const imagePath = productId ? `products/${productId}/${fileName}` : `products/temp/${fileName}`;
    const storageRef = ref(storage, imagePath);

    // Debug: log current auth state to help diagnose permission issues
    try {

    } catch (e) {

    }

    // Upload helper that can be retried after refreshing auth token
    const doUpload = async () => {
      const uploadResult = await uploadBytes(storageRef, compressedBlob, {
        customMetadata: { originalName: file.name, uploadedAt: new Date().toISOString(), productId: productId || 'temp' }
      });
      const downloadURL = await getDownloadURL(uploadResult.ref);
      return { success: true, data: { id: fileName.split('.')[0], url: downloadURL, fileName, path: imagePath, size: compressedBlob.size, originalSize: file.size, alt: file.name.split('.')[0].replace(/[_-]/g, ' ') } };
    };

    try {
      let result = await doUpload();
      return result;
    } catch (uploadError) {
      // console.error('[storage] upload error', uploadError);

      // If unauthorized, try refreshing auth token once then retry
      if (uploadError && uploadError.code === 'storage/unauthorized' && auth?.currentUser && typeof auth.currentUser.getIdToken === 'function') {
        try {

          await auth.currentUser.getIdToken(true);
          const retryResult = await doUpload();
          return retryResult;
        } catch (retryError) {
          // console.error('[storage] retry upload error', retryError);
          return { success: false, error: retryError.message || 'Failed to upload image after token refresh', code: retryError.code || null };
        }
      }

      return { success: false, error: uploadError.message || 'Failed to upload image', code: uploadError.code || null };
    }
  } catch (error) {
    // console.error('Error uploading image:', error);
    return { success: false, error: error.message || 'Failed to upload image' };
  }
};

export const uploadCategoryImage = async (file) => {
  try {
    const validation = validateImage(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const compressedBlob = await compressImage(file);
    const fileName = generateFileName(file.name, 'category');
    const imagePath = `categories/${fileName}`;
    const storageRef = ref(storage, imagePath);

    const uploadResult = await uploadBytes(storageRef, compressedBlob, {
      customMetadata: { originalName: file.name, uploadedAt: new Date().toISOString() }
    });

    const downloadURL = await getDownloadURL(uploadResult.ref);
    return { success: true, url: downloadURL };
  } catch (error) {
    // console.error('Error uploading category image:', error);
    return { success: false, error: error.message || 'Failed to upload category image' };
  }
};

export const uploadMultipleProductImages = async (files, productId, colorMapping = [], onProgress = null) => {

  try {
    const uploadPromises = files.map(async (file, index) => {

      const result = await uploadProductImageEnhanced(file, productId, (progress) => {
        if (onProgress) onProgress(index, progress);
      });

      return result;
    });

    const results = await Promise.all(uploadPromises);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    // Return detailed error objects (message + code) to help UI show specific causes
    return {
      success: failed.length === 0,
      uploadedImages: successful.map(r => r.data),
      errors: failed.map(r => ({ message: r.error, code: r.code || null })),
      totalUploaded: successful.length,
      totalFailed: failed.length
    };
  } catch (error) {
    // console.error('Error uploading multiple images:', error);
    return { success: false, error: error.message || 'Failed to upload images' };
  }
};

/**
 * Upload media intended for slides (image or video)
 * Returns { success, data: { id, url, fileName, path, size, originalSize, alt }, error }
 */
export const uploadSlideMedia = async (file) => {
  try {
    // Defensive: ensure validateMedia exists (build sometimes lags). Fallback to image-only validate.
    let validation;
    if (typeof validateMedia === 'function') {
      validation = validateMedia(file, { allowImages: true, allowVideos: true });
    } else {

      const imgValidation = validateImage(file);
      validation = { ...imgValidation, type: imgValidation.valid ? 'image' : null };
    }

    if (!validation || !validation.valid) {
      throw new Error(validation ? validation.error : 'Invalid media file');
    }

    if (!auth || !auth.currentUser) {

      return { success: false, error: 'Not authenticated. Please log in and try again.' };
    }

    const fileName = generateFileName(file.name, 'slide');
    const mediaPath = `slides/${fileName}`;
    const storageRef = ref(storage, mediaPath);

    // Helper to do the actual upload and return the download URL
    const doUpload = async () => {
      if (validation.type === 'image') {
        const compressedBlob = await compressImage(file, 1400, 900, 0.85);
        const uploadResult = await uploadBytes(storageRef, compressedBlob, {
          customMetadata: { originalName: file.name, uploadedAt: new Date().toISOString(), type: 'image' }
        });
        const downloadURL = await getDownloadURL(uploadResult.ref);
        return { success: true, data: { id: fileName.split('.')[0], url: downloadURL, fileName, path: mediaPath, size: compressedBlob.size, originalSize: file.size, alt: file.name.split('.')[0].replace(/[_-]/g, ' ') } };
      }

      const uploadResult = await uploadBytes(storageRef, file, {
        customMetadata: { originalName: file.name, uploadedAt: new Date().toISOString(), type: 'video' }
      });
      const downloadURL = await getDownloadURL(uploadResult.ref);
      return { success: true, data: { id: fileName.split('.')[0], url: downloadURL, fileName, path: mediaPath, size: file.size, originalSize: file.size, alt: file.name.split('.')[0].replace(/[_-]/g, ' ') } };
    };

    try {
      return await doUpload();
    } catch (uploadError) {
      // console.error('[storage] uploadSlideMedia upload error', uploadError);
      // If unauthorized, try refreshing token and retry once
      if (uploadError && uploadError.code === 'storage/unauthorized' && auth?.currentUser && typeof auth.currentUser.getIdToken === 'function') {
        try {

          await auth.currentUser.getIdToken(true);
          return await doUpload();
        } catch (retryError) {
          // console.error('[storage] retry uploadSlideMedia error', retryError);
          return { success: false, error: retryError.message || 'Failed to upload media after token refresh', code: retryError.code || null };
        }
      }

      // Propagate other errors with helpful guidance for storage rules
      if (uploadError && uploadError.code === 'storage/unauthorized') {
        return { success: false, error: 'Unauthorized to upload to storage. Check Firebase Storage rules and ensure your user has upload permission.' , code: uploadError.code };
      }

      return { success: false, error: uploadError.message || 'Failed to upload media', code: uploadError.code || null };
    }
  } catch (error) {
    // console.error('Error uploading slide media:', error);
    return { success: false, error: error.message || 'Failed to upload media' };
  }
};
