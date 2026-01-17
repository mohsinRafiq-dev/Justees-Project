import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

const NEWSLETTER_COLLECTION = 'newsletter_subscribers';

/**
 * Subscribe email to newsletter
 * @param {string} email - Email address to subscribe
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const subscribeToNewsletter = async (email) => {
  try {
    // Validate email
    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid email address');
    }

    // Check if email already exists
    const q = query(
      collection(db, NEWSLETTER_COLLECTION),
      where('email', '==', email.toLowerCase())
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return {
        success: false,
        message: 'This email is already subscribed to our newsletter!',
      };
    }

    // Add new subscriber
    await addDoc(collection(db, NEWSLETTER_COLLECTION), {
      email: email.toLowerCase(),
      subscribedAt: serverTimestamp(),
      status: 'active',
    });

    return {
      success: true,
      message: 'Successfully subscribed! Check your inbox for updates.',
    };
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return {
      success: false,
      message: error.message || 'Failed to subscribe. Please try again later.',
    };
  }
};

/**
 * Unsubscribe email from newsletter
 * @param {string} email - Email address to unsubscribe
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const unsubscribeFromNewsletter = async (email) => {
  try {
    const q = query(
      collection(db, NEWSLETTER_COLLECTION),
      where('email', '==', email.toLowerCase())
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return {
        success: false,
        message: 'Email not found in our subscribers list.',
      };
    }

    // Update status to inactive instead of deleting
    const docRef = querySnapshot.docs[0].ref;
    await updateDoc(docRef, {
      status: 'inactive',
      unsubscribedAt: serverTimestamp(),
    });

    return {
      success: true,
      message: 'Successfully unsubscribed from newsletter.',
    };
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    return {
      success: false,
      message: 'Failed to unsubscribe. Please try again later.',
    };
  }
};

export default { subscribeToNewsletter, unsubscribeFromNewsletter };
