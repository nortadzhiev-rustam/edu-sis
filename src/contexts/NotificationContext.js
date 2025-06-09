import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getNotificationHistory,
  getUnreadNotificationCount,
  markNotificationAsRead,
  clearNotificationHistory,
  setupLocalNotifications,
} from '../utils/messaging';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
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
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true }
              : notification
          )
        );
        
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
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
    return notifications.filter(notification => notification.type === type);
  };

  // Get recent notifications (last 24 hours)
  const getRecentNotifications = () => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return notifications.filter(notification => notification.timestamp > oneDayAgo);
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
    
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
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
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
