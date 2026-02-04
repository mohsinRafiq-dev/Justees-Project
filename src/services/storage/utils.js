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

export { ref, uploadBytes, getDownloadURL };
