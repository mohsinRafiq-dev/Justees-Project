import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { isAdminUser } from '../../utils/validation';
import {
  getAllOrders,
  updateOrderStatus,
} from '../../services/products.service';

const OrdersManagement = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdminUser(user)) return;
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await getAllOrders();
      if (res.success) setOrders(res.orders);
      else toast.error(res.error || 'Failed to load orders');
    } catch (err) {
      console.error(err);
      toast.error('Error loading orders');
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (orderId, newStatus) => {
    try {
      const res = await updateOrderStatus(orderId, newStatus);
      if (res.success) {
        toast.success('Order updated');
        loadOrders();
      } else toast.error(res.error || 'Failed to update');
    } catch (err) {
      console.error(err);
      toast.error('Error updating order');
    }
  };

  if (!isAdminUser(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Orders</h2>
      <p className="text-gray-600 mb-6">Manage customer orders</p>

      <div className="bg-white rounded-lg shadow p-4">
        {loading ? (
          <LoadingSpinner />
        ) : orders.length === 0 ? (
          <p className="text-gray-600">No orders found.</p>
        ) : (
          <table className="w-full table-auto">
            <thead>
              <tr className="text-left text-sm text-gray-600">
                <th className="pb-2">Order ID</th>
                <th className="pb-2">Customer</th>
                <th className="pb-2">Total</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Created</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="py-3 text-sm">{o.id}</td>
                  <td className="py-3 text-sm">{o.customer?.name || o.customer?.email || 'N/A'}</td>
                  <td className="py-3 text-sm">{o.total || '—'}</td>
                  <td className="py-3 text-sm">{o.status || 'pending'}</td>
                  <td className="py-3 text-sm">{o.createdAt?.toDate?.()?.toLocaleString?.() || '—'}</td>
                  <td className="py-3 text-sm space-x-2">
                    {o.status !== 'processing' && (
                      <button onClick={() => changeStatus(o.id, 'processing')} className="px-2 py-1 bg-blue-600 text-white rounded text-sm">Mark Processing</button>
                    )}
                    {o.status !== 'completed' && (
                      <button onClick={() => changeStatus(o.id, 'completed')} className="px-2 py-1 bg-green-600 text-white rounded text-sm">Mark Completed</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default OrdersManagement;
