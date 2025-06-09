import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getNotificationHistory,
  getUnreadNotificationCount,
  markNotificationAsRead as markLocalNotificationAsRead,
  clearNotificationHistory,
  setupLocalNotifications,
} from '../utils/messaging';
import {
  getNotifications as getAPINotifications,
  markNotificationAsRead as markAPINotificationRead,
  markAllNotificationsAsRead as markAllAPINotificationsRead,
  getNotificationCategories as getAPINotificationCategories,
  sendNotification as sendAPINotification,
  getNotificationStatistics as getAPINotificationStatistics,
} from '../services/notificationService';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider'
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
    setupLocalNotifications();
  }, []);

  // Load notifications from storage
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const [notificationHistory, unreadNotificationCount] = await Promise.all([
        getNotificationHistory(),
        getUnreadNotificationCount(),
      ]);

      setNotifications(notificationHistory);
      setUnreadCount(unreadNotificationCount);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh notifications
  const refreshNotifications = async () => {
    await loadNotifications();
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const success = await markNotificationAsRead(notificationId);
      if (success) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        );

        // Update unread count
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      return success;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  };

  // Clear all notifications
  const clearAll = async () => {
    try {
      const success = await clearNotificationHistory();
      if (success) {
        setNotifications([]);
        setUnreadCount(0);
      }
      return success;
    } catch (error) {
      console.error('Error clearing notifications:', error);
      return false;
    }
  };

  // Get notifications by type
  const getNotificationsByType = (type) => {
    return notifications.filter((notification) => notification.type === type);
  };

  // Get recent notifications (last 24 hours)
  const getRecentNotifications = () => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return notifications.filter(
      (notification) => notification.timestamp > oneDayAgo
    );
  };

  // Add new notification (for testing or manual additions)
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      read: false,
      type: 'general',
      ...notification,
    };

    setNotifications((prev) => [newNotification, ...prev]);
    setUnreadCount((prev) => prev + 1);
  };

  // API-based notification functions

  // Fetch notifications from API
  const fetchNotificationsFromAPI = async (
    page = 1,
    limit = 20,
    category = null
  ) => {
    try {
      setLoading(true);
      const params = { page, limit };
      if (category) params.category = category;

      const response = await getAPINotifications(params);
      return response;
    } catch (error) {
      console.error('Error fetching API notifications:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Mark API notification as read
  const markAPINotificationAsRead = async (notificationId) => {
    try {
      const response = await markAPINotificationRead(notificationId);
      if (response?.success) {
        // Update local state if needed
        await refreshNotifications();
      }
      return response;
    } catch (error) {
      console.error('Error marking API notification as read:', error);
      return null;
    }
  };

  // Mark all API notifications as read
  const markAllAPINotificationsAsRead = async () => {
    try {
      const response = await markAllAPINotificationsRead();
      if (response?.success) {
        // Update local state
        await refreshNotifications();
      }
      return response;
    } catch (error) {
      console.error('Error marking all API notifications as read:', error);
      return null;
    }
  };

  // Get notification categories
  const fetchNotificationCategories = async () => {
    try {
      const response = await getAPINotificationCategories();
      return response;
    } catch (error) {
      console.error('Error fetching notification categories:', error);
      return null;
    }
  };

  // Send notification (staff only)
  const sendNotificationToAPI = async (notificationData) => {
    try {
      const response = await sendAPINotification(notificationData);
      return response;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  };

  // Get notification statistics (staff only)
  const fetchNotificationStatistics = async (params = {}) => {
    try {
      const response = await getAPINotificationStatistics(params);
      return response;
    } catch (error) {
      console.error('Error fetching notification statistics:', error);
      return null;
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    refreshNotifications,
    markAsRead,
    clearAll,
    getNotificationsByType,
    getRecentNotifications,
    addNotification,
    // API functions
    fetchNotificationsFromAPI,
    markAPINotificationAsRead,
    markAllAPINotificationsAsRead,
    fetchNotificationCategories,
    sendNotificationToAPI,
    fetchNotificationStatistics,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
