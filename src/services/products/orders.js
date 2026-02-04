import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

export const getAllOrders = async () => {
  try {
    const snap = await getDocs(collection(db, "orders"));
    const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return { success: true, orders };
  } catch (error) {
    console.error("Error getting orders:", error);
    return { success: false, error: error.message || "Failed to get orders" };
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    const ref = doc(db, "orders", orderId);
    await updateDoc(ref, { status, updatedAt: new Date() });
    return { success: true };
  } catch (error) {
    console.error("Error updating order:", error);
    return { success: false, error: error.message || "Failed to update order" };
  }
};
