/**
 * Custom hook for student notification functionality
 * Provides student-specific notification features
 */

import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { useNotificationAPI } from './useNotificationAPI';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useStudentNotifications = (authCode = null) => {
  const {
    notifications: localNotifications,
    unreadCount: localUnreadCount,
    refreshNotifications,
  } = useNotifications();

  const {
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    fetchCategories,
    loading,
    error,
  } = useNotificationAPI();

  const [studentNotifications, setStudentNotifications] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Get auth code from storage if not provided
  const getAuthCode = useCallback(async () => {
    if (authCode) return authCode;
    
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        return user.authCode || user.auth_code;
      }
    } catch (error) {
      console.error('Error getting auth code:', error);
    }
    return null;
  }, [authCode]);

  // Load notifications from API
  const loadNotifications = useCallback(async (page = 1, reset = false) => {
    try {
      const userAuthCode = await getAuthCode();
      if (!userAuthCode) return;

      const params = {
        page,
        limit: 20,
        category: selectedCategory,
      };

      const response = await fetchNotifications(params);
      
      if (response?.success) {
        const newNotifications = response.data || [];
        
        if (reset) {
          setStudentNotifications(newNotifications);
        } else {
          setStudentNotifications(prev => [...prev, ...newNotifications]);
        }

        setCurrentPage(page);
        setHasMorePages(response.has_more_pages || false);
      }
    } catch (error) {
      console.error('Error loading student notifications:', error);
    }
  }, [fetchNotifications, getAuthCode, selectedCategory]);

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      const response = await fetchCategories();
      if (response?.success) {
        setCategories(response.data || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }, [fetchCategories]);

  // Initial load
  useEffect(() => {
    loadCategories();
    loadNotifications(1, true);
  }, [loadCategories, loadNotifications]);

  // Refresh notifications
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications(1, true);
    await refreshNotifications(); // Also refresh local notifications
    setRefreshing(false);
  }, [loadNotifications, refreshNotifications]);

  // Load more notifications (pagination)
  const loadMore = useCallback(() => {
    if (!loading && hasMorePages) {
      loadNotifications(currentPage + 1, false);
    }
  }, [loading, hasMorePages, currentPage, loadNotifications]);

  // Mark notification as read
  const handleMarkAsRead = useCallback(async (notificationId) => {
    try {
      const response = await markAsRead(notificationId);
      if (response?.success) {
        // Update local state
        setStudentNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        );
        
        // Also refresh local notifications
        await refreshNotifications();
        return true;
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
    return false;
  }, [markAsRead, refreshNotifications]);

  // Mark all notifications as read
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      const response = await markAllAsRead();
      if (response?.success) {
        // Update local state
        setStudentNotifications(prev =>
          prev.map(notification => ({ ...notification, read: true }))
        );
        
        // Also refresh local notifications
        await refreshNotifications();
        return true;
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
    return false;
  }, [markAllAsRead, refreshNotifications]);

  // Filter notifications by category
  const handleCategoryFilter = useCallback((category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    loadNotifications(1, true);
  }, [loadNotifications]);

  // Get notifications by type
  const getNotificationsByType = useCallback((type) => {
    return studentNotifications.filter(notification => 
      notification.type === type || notification.category === type
    );
  }, [studentNotifications]);

  // Get unread notifications
  const getUnreadNotifications = useCallback(() => {
    return studentNotifications.filter(notification => !notification.read);
  }, [studentNotifications]);

  // Get recent notifications (last 7 days)
  const getRecentNotifications = useCallback(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return studentNotifications.filter(notification => {
      const notificationDate = new Date(notification.created_at);
      return notificationDate >= sevenDaysAgo;
    });
  }, [studentNotifications]);

  // Get notifications by priority
  const getNotificationsByPriority = useCallback((priority) => {
    return studentNotifications.filter(notification => 
      notification.priority === priority
    );
  }, [studentNotifications]);

  // Get grade-related notifications
  const getGradeNotifications = useCallback(() => {
    return getNotificationsByType('grade');
  }, [getNotificationsByType]);

  // Get attendance-related notifications
  const getAttendanceNotifications = useCallback(() => {
    return getNotificationsByType('attendance');
  }, [getNotificationsByType]);

  // Get homework-related notifications
  const getHomeworkNotifications = useCallback(() => {
    return getNotificationsByType('homework');
  }, [getNotificationsByType]);

  // Get announcement notifications
  const getAnnouncementNotifications = useCallback(() => {
    return getNotificationsByType('announcement');
  }, [getNotificationsByType]);

  // Get emergency notifications
  const getEmergencyNotifications = useCallback(() => {
    return getNotificationsByPriority('high').filter(notification =>
      notification.category === 'emergency' || notification.type === 'emergency'
    );
  }, [getNotificationsByPriority]);

  // Calculate statistics
  const getNotificationStats = useCallback(() => {
    const total = studentNotifications.length;
    const unread = getUnreadNotifications().length;
    const recent = getRecentNotifications().length;
    const emergency = getEmergencyNotifications().length;
    
    return {
      total,
      unread,
      recent,
      emergency,
      readPercentage: total > 0 ? Math.round(((total - unread) / total) * 100) : 0,
    };
  }, [studentNotifications, getUnreadNotifications, getRecentNotifications, getEmergencyNotifications]);

  return {
    // Data
    notifications: studentNotifications,
    localNotifications,
    categories,
    selectedCategory,
    
    // State
    loading,
    error,
    refreshing,
    hasMorePages,
    currentPage,
    
    // Counts
    unreadCount: getUnreadNotifications().length,
    localUnreadCount,
    totalCount: studentNotifications.length,
    
    // Actions
    loadNotifications,
    handleRefresh,
    loadMore,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleCategoryFilter,
    
    // Getters
    getNotificationsByType,
    getUnreadNotifications,
    getRecentNotifications,
    getNotificationsByPriority,
    getGradeNotifications,
    getAttendanceNotifications,
    getHomeworkNotifications,
    getAnnouncementNotifications,
    getEmergencyNotifications,
    getNotificationStats,
  };
};
