import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  subscribeToNotifications,
  markNotificationAsRead,
  deleteNotification,
  markAllNotificationsAsRead,
} from '../../services/notifications.service';
import { useTheme } from '../../contexts/ThemeContext';

const NotificationsPanel = () => {
  const { isDark } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    // Subscribe to real-time notifications
    const unsubscribe = subscribeToNotifications((result) => {
      if (result.success) {
        setNotifications(result.notifications);
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (notificationId) => {
    const res = await markNotificationAsRead(notificationId);
    if (res.success) {
      toast.success('Marked as read');
    }
  };

  const handleDelete = async (notificationId) => {
    const res = await deleteNotification(notificationId);
    if (res.success) {
      toast.success('Notification deleted');
    }
  };

  const handleMarkAllAsRead = async () => {
    const res = await markAllNotificationsAsRead();
    if (res.success) {
      toast.success('All marked as read');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return '🛍️';
      case 'review':
        return '⭐';
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'order':
        return isDark ? 'bg-blue-900' : 'bg-blue-50';
      case 'review':
        return isDark ? 'bg-yellow-900' : 'bg-yellow-50';
      default:
        return isDark ? 'bg-gray-800' : 'bg-gray-50';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-colors ${
          isDark
            ? 'hover:bg-gray-800 text-gray-300'
            : 'hover:bg-gray-100 text-gray-700'
        }`}
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-30 md:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed inset-x-0 top-0 z-40 w-full md:absolute md:inset-auto md:right-4 md:top-16 md:w-96 md:max-w-[24rem] max-w-full md:rounded-lg rounded-b-lg shadow-2xl ${
                isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
              }`}
            >
              {/* Header */}
              <div
                className={`flex items-center justify-between p-4 border-b ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}
              >
                <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Notifications
                </h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setIsOpen(false)} className="p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="max-h-[calc(100vh-6rem)] md:max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center">
                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                      Loading notifications...
                    </p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                      No notifications yet
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {notifications.map((notif) => (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={`p-4 transition-colors cursor-pointer hover:opacity-75 ${getNotificationColor(notif.type)}`}
                      >
                        <div className="flex gap-3">
                          <div className="text-2xl">{getNotificationIcon(notif.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p
                                  className={`font-semibold text-sm ${
                                    isDark ? 'text-white' : 'text-gray-900'
                                  }`}
                                >
                                  {notif.title}
                                </p>
                                <p
                                  className={`text-sm mt-1 ${
                                    isDark ? 'text-gray-400' : 'text-gray-600'
                                  }`}
                                >
                                  {notif.message}
                                </p>
                                <p
                                  className={`text-xs mt-2 ${
                                    isDark ? 'text-gray-500' : 'text-gray-500'
                                  }`}
                                >
                                  {new Date(notif.createdAt?.toDate()).toLocaleString()}
                                </p>
                              </div>

                              {/* Actions */}
                              <div className="flex gap-2 flex-shrink-0">
                                {!notif.isRead && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkAsRead(notif.id);
                                    }}
                                    className={`p-1 rounded transition-colors ${
                                      isDark
                                        ? 'hover:bg-gray-700 text-gray-400'
                                        : 'hover:bg-gray-200 text-gray-600'
                                    }`}
                                    title="Mark as read"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(notif.id);
                                  }}
                                  className={`p-1 rounded transition-colors ${
                                    isDark
                                      ? 'hover:bg-red-900 text-red-400'
                                      : 'hover:bg-red-100 text-red-600'
                                  }`}
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationsPanel;
