import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  updateDoc,
  doc,
  getDocs,
  where,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';

// Helper function to remove undefined and null values
const cleanData = (obj) => {
  if (Array.isArray(obj)) {
    return obj
      .map(item => cleanData(item))
      .filter(item => item !== undefined && item !== null && item !== '');
  }
  if (obj !== null && typeof obj === 'object') {
    const result = {};
    for (const key in obj) {
      const value = obj[key];
      // Skip undefined, null, and empty strings
      if (value !== undefined && value !== null && value !== '') {
        result[key] = cleanData(value);
      }
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }
  return obj;
};

// Add a new order
export const createOrder = async (orderData) => {
  try {
    // Clean all undefined values before saving
    const cleanedData = cleanData(orderData);
    
    console.log('Cleaned order data:', JSON.stringify(cleanedData, null, 2));
    
    // Ensure required fields exist
    if (!cleanedData.contact || !cleanedData.delivery || !cleanedData.items) {
      throw new Error('Missing required order fields: contact, delivery, or items');
    }
    
    if (!cleanedData.contact.email) {
      throw new Error('Missing required field: contact.email');
    }
    
    if (!cleanedData.delivery.firstName || !cleanedData.delivery.lastName || !cleanedData.delivery.address || !cleanedData.delivery.city) {
      throw new Error('Missing required delivery fields');
    }
    
    if (!Array.isArray(cleanedData.items) || cleanedData.items.length === 0) {
      throw new Error('Missing order items');
    }

    const ordersRef = collection(db, 'orders');
    
    const docRef = await addDoc(ordersRef, {
      ...cleanedData,
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return {
      success: true,
      orderId: docRef.id,
      message: 'Order created successfully',
    };
  } catch (error) {
    console.error('Error creating order:', error);
    return {
      success: false,
      error: error.message || 'Failed to create order',
    };
  }
};

// Get all orders
export const getAllOrders = async () => {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      orders,
    };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch orders',
    };
  }
};

// Subscribe to orders in real-time
export const subscribeToOrders = (callback) => {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      callback({
        success: true,
        orders,
      });
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to orders:', error);
    callback({
      success: false,
      error: error.message,
    });
  }
};

// Update order status
export const updateOrderStatus = async (orderId, status) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    
    await updateDoc(orderRef, {
      status,
      updatedAt: Timestamp.now(),
    });

    return {
      success: true,
      message: 'Order updated successfully',
    };
  } catch (error) {
    console.error('Error updating order:', error);
    return {
      success: false,
      error: error.message || 'Failed to update order',
    };
  }
};

// Get order by ID
export const getOrderById = async (orderId) => {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('id', '==', orderId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return {
        success: false,
        error: 'Order not found',
      };
    }
    
    const order = {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data(),
    };

    return {
      success: true,
      order,
    };
  } catch (error) {
    console.error('Error fetching order:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch order',
    };
  }
};

// Delete order
export const deleteOrder = async (orderId) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    
    await deleteDoc(orderRef);

    return {
      success: true,
      message: 'Order deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting order:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete order',
    };
  }
};
