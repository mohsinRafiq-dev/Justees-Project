import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const SETTINGS_COLLECTION = 'siteSettings';
const GENERAL_SETTINGS_DOC = 'general';

/**
 * Get site settings from Firestore
 * @returns {Promise<{success: boolean, settings?: object, error?: string}>}
 */
export const getSiteSettings = async (options = {}) => {
  const { serverOnly = false } = options;
  try {
    const settingsRef = doc(db, SETTINGS_COLLECTION, GENERAL_SETTINGS_DOC);
    // if serverOnly is true, force Firestore to bypass the local cache
    const settingsSnap = await getDoc(settingsRef, serverOnly ? { source: 'server' } : undefined);

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

/**
 * Subscribe to site settings changes in real-time
 * @param {Function} callback - Callback function to receive updated settings
 * @returns {Function} Unsubscribe function to stop listening
 */
export const subscribeSiteSettings = (callback) => {
  const settingsRef = doc(db, SETTINGS_COLLECTION, GENERAL_SETTINGS_DOC);
  
  return onSnapshot(
    settingsRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback({
          success: true,
          settings: docSnap.data(),
        });
      } else {
        // Return default settings if document doesn't exist
        callback({
          success: true,
          settings: {
            volumeText: 'Volume 1: The Debut',
          },
        });
      }
    },
    (error) => {
      console.error('Error listening to site settings:', error);
      callback({
        success: false,
        error: error.message,
      });
    }
  );
};
