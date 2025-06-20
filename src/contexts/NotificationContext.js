import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
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
  getLegacyNotifications,
} from '../services/notificationService';
import { Config, buildApiUrl } from '../config/env';

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

  // Student-specific notifications for parent view
  const [studentNotifications, setStudentNotifications] = useState({});
  const [studentUnreadCounts, setStudentUnreadCounts] = useState({});
  const [currentStudentAuthCode, setCurrentStudentAuthCode] = useState(null);

  // Update app icon badge when unread count changes
  const updateAppIconBadge = async (count) => {
    try {
      await Notifications.setBadgeCountAsync(count);
      console.log(`📱 BADGE: App icon badge updated to ${count}`);
    } catch (error) {
      console.error('❌ BADGE: Error updating app icon badge:', error);
    }
  };

  // Calculate total unread count including student notifications for parent users
  const getTotalUnreadCount = () => {
    // Get total unread count from all student notifications
    const studentUnreadTotal = Object.values(studentUnreadCounts).reduce(
      (total, count) => total + count,
      0
    );

    // Return the higher of main unread count or student unread total
    // This handles both teacher/student accounts and parent accounts
    return Math.max(unreadCount, studentUnreadTotal);
  };

  // Update app icon badge whenever unread count or student unread counts change
  useEffect(() => {
    const totalUnread = getTotalUnreadCount();
    updateAppIconBadge(totalUnread);
  }, [unreadCount, studentUnreadCounts]);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
    setupLocalNotifications();
  }, []);

  // Add debouncing to prevent excessive API calls
  const lastLoadTime = React.useRef(0);
  const isLoading = React.useRef(false);

  // Load notifications from API and local storage
  const loadNotifications = async () => {
    try {
      // Prevent multiple simultaneous calls
      if (isLoading.current) {
        return;
      }

      // Debounce: only allow calls every 5 seconds
      const now = Date.now();
      if (now - lastLoadTime.current < 5000) {
        return;
      }

      lastLoadTime.current = now;
      isLoading.current = true;
      setLoading(true);

      // Try to fetch from API first
      try {
        const apiResponse = await getAPINotifications({ page: 1, limit: 50 });

        if (
          apiResponse?.success &&
          (apiResponse?.data || apiResponse?.notifications)
        ) {
          // Handle both data and notifications response formats
          const notificationArray =
            apiResponse.notifications || apiResponse.data;

          // Transform API data to match local notification format
          const apiNotifications = notificationArray.map((notification) => ({
            id:
              notification.notification_id?.toString() ||
              notification.id?.toString() ||
              Date.now().toString(),
            title: notification.title || 'Notification',
            body: notification.body || notification.message || '',
            timestamp: notification.created_at
              ? new Date(notification.created_at).getTime()
              : Date.now(),
            read: !!notification.read_at || !!notification.is_read,
            type: notification.type || notification.category || 'general',
            data: notification.data || {},
            // Keep original API data for reference
            _apiData: notification,
          }));

          setNotifications(apiNotifications);
          setUnreadCount(apiNotifications.filter((n) => !n.read).length);

          // Also store in local storage as backup
          await AsyncStorage.setItem(
            'notificationHistory',
            JSON.stringify(apiNotifications)
          );
          return;
        }
      } catch (apiError) {
        // API notifications not available, falling back to local storage
      }

      // Fallback to local storage if API fails
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
      isLoading.current = false;
    }
  };

  // Refresh notifications (with debouncing)
  const refreshNotifications = React.useCallback(async () => {
    await loadNotifications();
  }, []);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      // First, check if this is a student notification (has studentAuthCode)
      let targetNotification = null;
      let isStudentNotification = false;
      let studentAuthCode = null;

      // Check main notifications first
      targetNotification = notifications.find((n) => n.id === notificationId);

      // If not found in main notifications, check student notifications
      if (!targetNotification) {
        for (const [authCode, studentNotifs] of Object.entries(
          studentNotifications
        )) {
          const found = studentNotifs.find((n) => n.id === notificationId);
          if (found) {
            targetNotification = found;
            isStudentNotification = true;
            studentAuthCode = authCode;
            break;
          }
        }
      }

      if (!targetNotification) {
        console.error('Notification not found:', notificationId);
        return false;
      }

      // Try API method first if notification has API data
      if (
        targetNotification?._apiData?.id ||
        targetNotification?._apiData?.notification_id
      ) {
        try {
          // Use the original notification_id from the API data
          const originalNotificationId =
            targetNotification._apiData.notification_id ||
            targetNotification._apiData.id;

          let apiResponse;

          // For student notifications, pass the student's authCode
          if (isStudentNotification && studentAuthCode) {
            apiResponse = await markAPINotificationRead(
              originalNotificationId,
              studentAuthCode
            );
          } else {
            // For regular notifications, use the standard API call
            apiResponse = await markAPINotificationRead(originalNotificationId);
          }

          if (apiResponse?.success) {
            // Update local state based on notification type
            if (isStudentNotification && studentAuthCode) {
              // Update student notifications
              setStudentNotifications((prev) => ({
                ...prev,
                [studentAuthCode]: prev[studentAuthCode].map((n) =>
                  n.id === notificationId ? { ...n, read: true } : n
                ),
              }));
              // Update student unread count
              setStudentUnreadCounts((prev) => ({
                ...prev,
                [studentAuthCode]: Math.max(
                  0,
                  (prev[studentAuthCode] || 0) - 1
                ),
              }));
            } else {
              // Update main notifications
              setNotifications((prev) =>
                prev.map((n) =>
                  n.id === notificationId ? { ...n, read: true } : n
                )
              );
              setUnreadCount((prev) => Math.max(0, prev - 1));
            }
            return true;
          }
        } catch (apiError) {
          // API mark as read failed, using local method
        }
      }

      // Fallback to local method
      const success = await markLocalNotificationAsRead(notificationId);
      if (success) {
        // Update local state based on notification type
        if (isStudentNotification && studentAuthCode) {
          // Update student notifications
          setStudentNotifications((prev) => ({
            ...prev,
            [studentAuthCode]: prev[studentAuthCode].map((n) =>
              n.id === notificationId ? { ...n, read: true } : n
            ),
          }));
          // Update student unread count
          setStudentUnreadCounts((prev) => ({
            ...prev,
            [studentAuthCode]: Math.max(0, (prev[studentAuthCode] || 0) - 1),
          }));
        } else {
          // Update main notifications
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
        // Clear app icon badge when all notifications are cleared
        await updateAppIconBadge(0);
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

  // Mark all student notifications as read (for parent context)
  const markAllStudentNotificationsAsRead = async (studentAuthCode) => {
    try {
      const response = await markAllAPINotificationsRead(studentAuthCode);
      if (response?.success) {
        // Update local state for this student
        await loadStudentNotifications(studentAuthCode);
      }
      return response;
    } catch (error) {
      console.error('Error marking all student notifications as read:', error);
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

  // Student-specific notification functions for parent view
  const loadStudentNotifications = async (studentAuthCode) => {
    if (!studentAuthCode) {
      console.error('No studentAuthCode provided to loadStudentNotifications');
      return { notifications: [], unreadCount: 0 };
    }

    try {
      // Create a temporary API call with the student's authCode
      const tempApiCall = async (params) => {
        const url = buildApiUrl(Config.API_ENDPOINTS.GET_NOTIFICATIONS, {
          authCode: studentAuthCode,
          page: params.page || 1,
          limit: params.limit || 50,
          ...params,
        });

        const response = await fetch(url, {
          timeout: Config.NETWORK.TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      };

      const apiResponse = await tempApiCall({ page: 1, limit: 50 });

      if (apiResponse?.success && apiResponse?.notifications) {
        // Transform API data to match local notification format
        const apiNotifications = apiResponse.notifications.map(
          (notification) => ({
            id:
              notification.notification_id?.toString() ||
              notification.id?.toString() ||
              Date.now().toString(),
            title: notification.title || 'Notification',
            body: notification.body || notification.message || '',
            timestamp: notification.created_at
              ? new Date(notification.created_at).getTime()
              : Date.now(),
            read: !!notification.read_at || !!notification.is_read,
            type: notification.type || notification.category || 'general',
            data: notification.data || {},
            studentAuthCode: studentAuthCode,
            _apiData: notification,
          })
        );

        // Store notifications for this student
        setStudentNotifications((prev) => ({
          ...prev,
          [studentAuthCode]: apiNotifications,
        }));

        // Calculate and store unread count for this student
        const unreadCount = apiNotifications.filter((n) => !n.read).length;
        setStudentUnreadCounts((prev) => ({
          ...prev,
          [studentAuthCode]: unreadCount,
        }));

        return { notifications: apiNotifications, unreadCount };
      } else {
        return { notifications: [], unreadCount: 0 };
      }
    } catch (error) {
      console.error('Error loading student notifications:', error);
      return { notifications: [], unreadCount: 0 };
    }
  };

  // Set current student for notification context
  const setCurrentStudent = React.useCallback(
    (studentAuthCode) => {
      setCurrentStudentAuthCode(studentAuthCode);
      if (studentAuthCode && !studentNotifications[studentAuthCode]) {
        loadStudentNotifications(studentAuthCode);
      }
    },
    [studentNotifications, loadStudentNotifications]
  );

  // Get current student's unread count
  const getCurrentStudentUnreadCount = () => {
    if (!currentStudentAuthCode) return 0;
    return studentUnreadCounts[currentStudentAuthCode] || 0;
  };

  // Get current student's notifications
  const getCurrentStudentNotifications = () => {
    if (!currentStudentAuthCode) return [];
    return studentNotifications[currentStudentAuthCode] || [];
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
    // Badge management
    updateAppIconBadge,
    getTotalUnreadCount,
    // API functions
    fetchNotificationsFromAPI,
    markAPINotificationAsRead,
    markAllAPINotificationsAsRead,
    markAllStudentNotificationsAsRead,
    fetchNotificationCategories,
    sendNotificationToAPI,
    fetchNotificationStatistics,
    // Student-specific functions for parent view
    loadStudentNotifications,
    setCurrentStudent,
    getCurrentStudentUnreadCount,
    getCurrentStudentNotifications,
    studentNotifications,
    studentUnreadCounts,
    currentStudentAuthCode,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
