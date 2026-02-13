import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  updatePassword,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { auth } from './firebase';

// Allowed admin emails from environment variables (supports multiple emails)
const ADMIN_EMAILS_STRING = import.meta.env.VITE_ADMIN_EMAIL;
const ALLOWED_ADMIN_EMAILS = ADMIN_EMAILS_STRING 
  ? ADMIN_EMAILS_STRING.split(',').map(email => email.trim().toLowerCase())
  : [];

/**
 * Check if email is authorized as admin
 * @param {string} email - Email to check
 * @returns {boolean}
 */
const isAdminEmail = (email) => {
  if (!email || ALLOWED_ADMIN_EMAILS.length === 0) return false;
  return ALLOWED_ADMIN_EMAILS.includes(email.toLowerCase());
};

/**
 * Sign in admin user with Google OAuth
 * Uses client-side validation with environment variable
 * @returns {Promise<User>}
 */

export const loginAdminWithGoogle = async () => {
  try {
    // Validate that admin email is configured
    if (ALLOWED_ADMIN_EMAILS.length === 0) {
      throw new Error('Admin access is not properly configured. Please contact support.');
    }

    // Set persistence to LOCAL (survives browser restarts)
    await setPersistence(auth, browserLocalPersistence);

    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if the email is allowed
    if (!isAdminEmail(user.email)) {
      // Sign out and delete the user immediately if email doesn't match
      await signOut(auth);

      // Delete unauthorized user account (optional cleanup)
      try {
        await user.delete();
      } catch (deleteError) {
        // console.log('User deletion skipped:', deleteError.message);
      }

      throw new Error('Access denied. You are not authorized to access the admin panel.');
    }

    return user;
  } catch (error) {
    // console.error('Google login error:', error);
    if (error.message.includes('Access denied') || error.message.includes('not properly configured')) {
      throw error;
    }
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Email/password login with admin authorization check
 */
export const loginAdmin = async (email, password) => {
  try {
    // Validate that admin emails are configured
    if (ALLOWED_ADMIN_EMAILS.length === 0) {
      throw new Error('Admin access is not properly configured. Please contact support.');
    }

    // Check if email is authorized before attempting login
    if (!isAdminEmail(email)) {
      throw new Error('Access denied. You are not authorized to access the admin panel.');
    }

    // Set persistence to LOCAL (survives browser restarts)
    await setPersistence(auth, browserLocalPersistence);

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Double-check authorization after successful login
    if (!isAdminEmail(userCredential.user.email)) {
      await signOut(auth);
      throw new Error('Access denied. You are not authorized to access the admin panel.');
    }

    return userCredential.user;
  } catch (error) {
    // console.error('Email login error:', error);
    
    if (error.message.includes('Access denied') || error.message.includes('not properly configured')) {
      throw error;
    }
    
    if (error.code === 'auth/invalid-login-credentials' || error.code === 'auth/invalid-credential') {
      throw new Error('Invalid email or password');
    }
    
    throw new Error(getAuthErrorMessage(error.code));
  }
};

export const updateAdminPassword = async (user, newPassword) => {
  try {
    await updatePassword(user, newPassword);
    return { success: true };
  } catch (error) {
    // console.error('Error updating password:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sign out current user
 * @returns {Promise<void>}
 */
export const logoutAdmin = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    // console.error('Logout error:', error);
    throw new Error('Failed to logout. Please try again.');
  }
};

/**
 * Subscribe to auth state changes
 * @param {function} callback - Function to call when auth state changes
 * @returns {function} Unsubscribe function
 */
export const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Get current authenticated user
 * @returns {User|null}
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Convert Firebase auth error codes to user-friendly messages
 * @param {string} errorCode - Firebase error code
 * @returns {string} User-friendly error message
 */
const getAuthErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    default:
      return 'Authentication failed. Please try again.';
  }
};
