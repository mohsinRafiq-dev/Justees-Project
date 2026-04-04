import { db } from './firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';

const NOTIFICATIONS_COLLECTION = 'notifications';

/**
 * Create a new notification
 */
export const createNotification = async (notificationData) => {
  try {
    const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      title: notificationData.title || 'New Order',
      message: notificationData.message || '',
      type: notificationData.type || 'order', // 'order', 'review', 'system'
      orderId: notificationData.orderId || null,
      customerName: notificationData.customerName || '',
      customerEmail: notificationData.customerEmail || '',
      orderTotal: notificationData.orderTotal || 0,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all notifications (most recent first)
 */
export const getAllNotifications = async () => {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const querySnapshot = await getDocs(q);
    const notifications = [];
    querySnapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    return { success: true, notifications };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { success: false, error: error.message, notifications: [] };
  }
};

/**
 * Subscribe to real-time notifications
 */
export const subscribeToNotifications = (callback) => {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notifications = [];
      querySnapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      callback({ success: true, notifications });
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to notifications:', error);
    callback({ success: false, error: error.message, notifications: [] });
    return null;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notificationRef, {
      isRead: true,
      updatedAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('isRead', '==', false)
    );
    const querySnapshot = await getDocs(q);
    
    const batch = [];
    querySnapshot.forEach((doc) => {
      batch.push(
        updateDoc(doc.ref, {
          isRead: true,
          updatedAt: new Date(),
        })
      );
    });
    
    await Promise.all(batch);
    return { success: true };
  } catch (error) {
    console.error('Error updating notifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId) => {
  try {
    await deleteDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async () => {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('isRead', '==', false)
    );
    const querySnapshot = await getDocs(q);
    return { success: true, count: querySnapshot.size };
  } catch (error) {
    console.error('Error getting unread count:', error);
    return { success: false, error: error.message, count: 0 };
  }
};
