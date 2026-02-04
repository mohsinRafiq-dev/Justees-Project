import { ref, deleteObject, listAll, getDownloadURL, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase';

export const deleteProductImage = async (imageUrl) => {
  try {
    const decodedUrl = decodeURIComponent(imageUrl);
    const startIndex = decodedUrl.indexOf('/o/') + 3;
    const endIndex = decodedUrl.indexOf('?');
    const filePath = decodedUrl.substring(startIndex, endIndex);

    const imageRef = ref(storage, filePath);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    if (error.code !== 'storage/object-not-found') throw new Error('Failed to delete image.');
  }
};

export const deleteMultipleImages = async (imageUrls) => {
  try {
    const deletePromises = imageUrls.map((url) => deleteProductImage(url));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting multiple images:', error);
    throw new Error('Failed to delete images.');
  }
};

export const deleteAllProductImages = async (productId) => {
  try {
    const folderRef = ref(storage, `products/${productId}`);
    const listResult = await listAll(folderRef);
    const deletePromises = listResult.items.map(itemRef => deleteObject(itemRef));
    await Promise.all(deletePromises);
    return { success: true, deletedCount: listResult.items.length, message: `Deleted ${listResult.items.length} images` };
  } catch (error) {
    console.error('Error deleting product images:', error);
    return { success: false, error: error.message || 'Failed to delete product images' };
  }
};

export const moveImagesToProductFolder = async (tempImagePaths, productId) => {
  try {
    const movePromises = tempImagePaths.map(async (tempPath) => {
      const tempRef = ref(storage, tempPath);
      const fileName = tempPath.split('/').pop();
      const newPath = `products/${productId}/${fileName}`;
      const newRef = ref(storage, newPath);
      const downloadURL = await getDownloadURL(tempRef);
      const response = await fetch(downloadURL);
      const blob = await response.blob();
      await uploadBytes(newRef, blob);
      await deleteObject(tempRef);
      const newDownloadURL = await getDownloadURL(newRef);
      return { oldPath: tempPath, newPath, newUrl: newDownloadURL };
    });

    const results = await Promise.all(movePromises);
    return { success: true, movedImages: results };
  } catch (error) {
    console.error('Error moving images:', error);
    return { success: false, error: error.message || 'Failed to move images' };
  }
};
