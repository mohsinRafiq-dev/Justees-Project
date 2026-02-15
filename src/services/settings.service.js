import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const SETTINGS_COLLECTION = 'siteSettings';
const GENERAL_SETTINGS_DOC = 'general';

/**
 * Get site settings from Firestore
 * @returns {Promise<{success: boolean, settings?: object, error?: string}>}
 */
export const getSiteSettings = async () => {
  try {
    const settingsRef = doc(db, SETTINGS_COLLECTION, GENERAL_SETTINGS_DOC);
    const settingsSnap = await getDoc(settingsRef);

    if (settingsSnap.exists()) {
      return {
        success: true,
        settings: settingsSnap.data(),
      };
    } else {
      // Return default settings if document doesn't exist
      const defaultSettings = {
        volumeText: 'Volume 1: The Debut',
      };
      return {
        success: true,
        settings: defaultSettings,
      };
    }
  } catch (error) {
    console.error('Error getting site settings:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Update site settings in Firestore
 * @param {object} settings - Settings object to update
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateSiteSettings = async (settings) => {
  try {
    const settingsRef = doc(db, SETTINGS_COLLECTION, GENERAL_SETTINGS_DOC);
    await setDoc(settingsRef, settings, { merge: true });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error updating site settings:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};
