import { ref, getDownloadURL, uploadBytes } from 'firebase/storage';
import { storage, auth } from '../firebase';
import { compressImage, validateImage, generateFileName } from './utils';


export const uploadProductImageEnhanced = async (file, productId = null, onProgress = null) => {
  console.log('[storage] uploadProductImageEnhanced called', { fileName: file?.name, productId });
  try {
    const validation = validateImage(file);
    if (!validation.valid) {
      console.warn('[storage] image validation failed', validation);
      throw new Error(validation.error);
    }

    const compressedBlob = await compressImage(file);
    console.log('[storage] compressed image', { originalSize: file.size, compressedSize: compressedBlob?.size });

    const fileName = generateFileName(file.name, productId);
    const imagePath = productId ? `products/${productId}/${fileName}` : `products/temp/${fileName}`;
    const storageRef = ref(storage, imagePath);

    // Debug: log current auth state to help diagnose permission issues
    try {
      console.log('[storage] auth.currentUser', auth?.currentUser ? { uid: auth.currentUser.uid, email: auth.currentUser.email } : null);
    } catch (e) {
      console.debug('[storage] auth debug failed', e.message || e);
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
      console.error('[storage] upload error', uploadError);

      // If unauthorized, try refreshing auth token once then retry
      if (uploadError && uploadError.code === 'storage/unauthorized' && auth?.currentUser && typeof auth.currentUser.getIdToken === 'function') {
        try {
          console.log('[storage] attempting token refresh and retry');
          await auth.currentUser.getIdToken(true);
          const retryResult = await doUpload();
          return retryResult;
        } catch (retryError) {
          console.error('[storage] retry upload error', retryError);
          return { success: false, error: retryError.message || 'Failed to upload image after token refresh', code: retryError.code || null };
        }
      }

      return { success: false, error: uploadError.message || 'Failed to upload image', code: uploadError.code || null };
    }
  } catch (error) {
    console.error('Error uploading image:', error);
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
    console.error('Error uploading category image:', error);
    return { success: false, error: error.message || 'Failed to upload category image' };
  }
};

export const uploadMultipleProductImages = async (files, productId, colorMapping = [], onProgress = null) => {
  console.log('[storage] uploadMultipleProductImages called', { count: files?.length, productId });
  try {
    const uploadPromises = files.map(async (file, index) => {
      console.log(`[storage] starting upload for file index ${index}`, { name: file.name });
      const result = await uploadProductImageEnhanced(file, productId, (progress) => {
        if (onProgress) onProgress(index, progress);
      });
      console.debug(`[storage] upload result for index ${index}`, result);
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
    console.error('Error uploading multiple images:', error);
    return { success: false, error: error.message || 'Failed to upload images' };
  }
};
