// Utility to crop an image (no rotation) and return a Blob or File
// Utility: attempt to load an image with crossOrigin to check CORS
export function canLoadImageWithCrossOrigin(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(true);
    img.onerror = () => reject(new Error('Failed to load image (CORS or network issue)'));
    img.src = src;
  });
}

export async function getCroppedImg(imageSrc, pixelCrop, mime = 'image/jpeg', quality = 0.9) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.floor(pixelCrop.width));
        canvas.height = Math.max(1, Math.floor(pixelCrop.height));
        const ctx = canvas.getContext('2d');

        ctx.drawImage(
          image,
          Math.floor(pixelCrop.x),
          Math.floor(pixelCrop.y),
          Math.floor(pixelCrop.width),
          Math.floor(pixelCrop.height),
          0,
          0,
          Math.floor(pixelCrop.width),
          Math.floor(pixelCrop.height),
        );

        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('Canvas is empty'));
          resolve(blob);
        }, mime, quality);
      } catch (err) {
        reject(err);
      }
    };
    image.onerror = () => reject(new Error('Failed to load image (possible CORS restriction)'));
    image.src = imageSrc;
  });
}
