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

// Allowed admin email from environment variables
const ALLOWED_ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

/**
 * Sign in admin user with Google OAuth
 * Uses client-side validation with environment variable
 * @returns {Promise<User>}
 */

export const loginAdminWithGoogle = async () => {
  try {
    // Validate that admin email is configured
    if (!ALLOWED_ADMIN_EMAIL) {
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
    if (user.email !== ALLOWED_ADMIN_EMAIL) {
      // Sign out and delete the user immediately if email doesn't match
      await signOut(auth);

      // Delete unauthorized user account (optional cleanup)
      try {
        await user.delete();
      } catch (deleteError) {
        console.log('User deletion skipped:', deleteError.message);
      }

      throw new Error('Access denied. You are not authorized to access the admin panel.');
    }

    return user;
  } catch (error) {
    console.error('Google login error:', error);
    if (error.message.includes('Access denied') || error.message.includes('not properly configured')) {
      throw error;
    }
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Legacy email/password login - kept for backwards compatibility
 * @deprecated Use loginAdminWithGoogle instead
 */
export const loginAdmin = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    if (error.code === 'auth/invalid-login-credentials' || error.code === 'auth/invalid-credential') {
      throw new Error('Invalid email or password');
    }
    throw error;
  }
};

export const updateAdminPassword = async (user, newPassword) => {
  try {
    await updatePassword(user, newPassword);
    return { success: true };
  } catch (error) {
    console.error('Error updating password:', error);
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
    console.error('Logout error:', error);
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
