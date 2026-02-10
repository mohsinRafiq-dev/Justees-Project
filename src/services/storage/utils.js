import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

/** Compress and resize image before upload */
export const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
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
      ctx.drawImage(img, 0, 0, width, height);
      // Use explicit callback to catch null blob (some browsers may return null)
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Image compression failed (blob is null)'));
        }
      }, file.type, quality);
    };

    img.onerror = (err) => reject(err || new Error('Image load error'));
    img.src = URL.createObjectURL(file);
  });
};

export const generateFileName = (originalName, productId = null) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop().toLowerCase();
  const prefix = productId ? `${productId}_` : '';

  return `${prefix}${timestamp}_${random}.${extension}`;
};

export const validateImage = (file) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File size too large. Maximum size is 5MB.' };
  }

  return { valid: true };
};

/**
 * Validate media (images or videos) for slides and other places
 */
export const validateMedia = (file, options = {}) => {
  const { allowImages = true, allowVideos = true } = options;

  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const videoTypes = ['video/mp4', 'video/webm', 'video/quicktime']; // quicktime allows .mov

  const maxImageSize = 5 * 1024 * 1024; // 5MB
  const maxVideoSize = 80 * 1024 * 1024; // 80MB

  if (allowImages && imageTypes.includes(file.type)) {
    if (file.size > maxImageSize) {
      return { valid: false, error: 'Image size too large. Maximum is 5MB.' };
    }
    return { valid: true, type: 'image' };
  }

  if (allowVideos && videoTypes.includes(file.type)) {
    if (file.size > maxVideoSize) {
      return { valid: false, error: 'Video size too large. Maximum is 80MB.' };
    }
    return { valid: true, type: 'video' };
  }

  return { valid: false, error: 'Invalid media type. Allowed images: JPG/PNG/WebP. Allowed videos: MP4/WebM/MOV.' };
};

export { ref, uploadBytes, getDownloadURL };
