import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { ChevronDown, Check, Clock, Truck, Trash2 } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { isAdminUser } from '../../utils/validation';
import {
  getAllOrders,
  updateOrderStatus,
  subscribeToOrders,
  deleteOrder,
} from '../../services/orders.service';

const OrdersManagement = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    if (!isAdminUser(user)) return;
    
    setLoading(true);
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToOrders((result) => {
      if (result.success) {
        setOrders(result.orders);
        setLoading(false);
      } else {
        toast.error(result.error || 'Failed to load orders');
        setLoading(false);
      }
    });
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  const changeStatus = async (orderId, newStatus) => {
    try {
      const res = await updateOrderStatus(orderId, newStatus);
      if (res.success) {
        toast.success('Order updated');
      } else {
        toast.error(res.error || 'Failed to update');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating order');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }
    
    try {
      const res = await deleteOrder(orderId);
      if (res.success) {
        toast.success('Order deleted successfully');
        setExpandedOrder(null);
      } else {
        toast.error(res.error || 'Failed to delete order');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting order');
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
    <div className={`p-8 max-w-7xl mx-auto ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <h2 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Orders</h2>
      <p className={`mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Manage customer orders and view details</p>

      <div className={`rounded-lg shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        {loading ? (
          <div className="p-8">
            <LoadingSpinner />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center">
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No orders found yet.</p>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className={`border rounded-lg overflow-hidden hover:shadow-md transition-shadow ${isDark ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-white'}`}
              >
                {/* Order Header - Always Visible */}
                <button
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  className={`w-full px-6 py-4 flex items-center justify-between transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'}`}
                >
                  <div className="flex items-center gap-4 flex-1 text-left">
                    <div>
                      <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Order #{order.id.slice(0, 8)}</h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {order.delivery?.firstName} {order.delivery?.lastName} • {order.contact?.email}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <span className={`text-xs px-2 py-1 rounded font-semibold ${
                          order.paymentMethod === 'cod'
                            ? 'bg-green-100 text-green-800'
                            : order.paymentMethod === 'online'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {order.paymentMethod === 'cod'
                            ? 'COD'
                            : order.paymentMethod === 'online'
                            ? 'Online'
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Rs. {order.total?.toLocaleString()}</p>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {order.createdAt?.toDate?.()?.toLocaleDateString?.() || new Date().toLocaleDateString()}
                      </p>
                    </div>
                    
                    <select
                      value={order.status || 'pending'}
                      onChange={(e) => changeStatus(order.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className={`px-3 py-2 rounded text-sm font-semibold ${
                        order.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'processing'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                    </select>
                    
                    <ChevronDown
                      className={`w-5 h-5 text-gray-600 transition-transform ${
                        expandedOrder === order.id ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Order Details - Expandable */}
                {expandedOrder === order.id && (
                  <div className={`px-6 py-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} border-t space-y-6`}>
                    {/* Customer Details */}
                    <div>
                      <h4 className={`font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Delivery Address</h4>
                      <div className={`p-4 rounded text-sm space-y-1 ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
                        <p className="font-semibold">{order.delivery?.firstName} {order.delivery?.lastName}</p>
                        {order.delivery?.phone && (
                          <p className="text-blue-600 font-medium">📞 {order.delivery?.phone}</p>
                        )}
                        <p>{order.delivery?.address}</p>
                        {order.delivery?.apartment && <p>{order.delivery?.apartment}</p>}
                        <p>{order.delivery?.city}, {order.delivery?.postalCode}</p>
                        <p>{order.delivery?.country}</p>
                      </div>
                    </div>

                    {/* Contact */}
                    <div>
                      <h4 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Contact</h4>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{order.contact?.email}</p>
                      {order.contact?.subscribe && (
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>✓ Subscribed to newsletter</p>
                      )}
                    </div>

                    {/* Payment Method */}
                    <div>
                      <h4 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Payment Method</h4>
                      <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        order.paymentMethod === 'cod'
                          ? 'bg-green-100 text-green-800'
                          : order.paymentMethod === 'online'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {order.paymentMethod === 'cod'
                          ? '💳 Cash on Delivery (COD)'
                          : order.paymentMethod === 'online'
                          ? '🏦 Online Payment'
                          : 'Not Specified'}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div>
                      <h4 className={`font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Items</h4>
                      <div className="space-y-3">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className={`flex gap-4 p-3 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                            <div className="flex-1 text-sm">
                              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.name}</p>
                              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                                Qty: {item.quantity} × Rs. {item.price?.toLocaleString()}
                              </p>
                              {item.selectedSize && (
                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Size: {item.selectedSize}</p>
                              )}
                              {item.selectedColor && (
                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Color: {item.selectedColor}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className={`p-4 rounded space-y-2 text-sm ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Subtotal:</span>
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Rs. {order.subtotal?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Shipping:</span>
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Rs. {order.shippingCost?.toLocaleString()}</span>
                      </div>
                      <div className={`border-t pt-2 flex justify-between font-bold ${isDark ? 'border-gray-600' : ''}`}>
                        <span className={isDark ? 'text-white' : 'text-gray-900'}>Total:</span>
                        <span className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Rs. {order.total?.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Note */}
                    <div className={`border p-4 rounded text-sm ${isDark ? 'bg-blue-900/30 border-blue-700 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-900'}`}>
                      <p className="font-semibold mb-1">Payment Status:</p>
                      <p>
                        {order.paymentMethod === 'cod'
                          ? 'Customer will pay full amount upon delivery'
                          : 'Customer needs to pay Rs. 250 advance for delivery via WhatsApp: 03291526285'}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t" style={{borderColor: isDark ? '#374151' : '#e5e7eb'}}>
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded font-semibold transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Order
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersManagement;
