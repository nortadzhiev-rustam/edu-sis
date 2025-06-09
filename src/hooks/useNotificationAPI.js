/**
 * Custom hook for notification API operations
 * Provides easy-to-use functions for notification management
 */

import { useState, useCallback } from 'react';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationCategories,
  sendNotification,
  getNotificationStatistics,
  sendBPSNotification,
  sendAttendanceReminder,
  sendRichNotification,
  sendStaffNotification,
} from '../services/notificationService';

export const useNotificationAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to handle API calls with loading and error states
  const handleApiCall = useCallback(async (apiFunction, ...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction(...args);
      return result;
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('API call failed:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get notifications with pagination
  const fetchNotifications = useCallback(
    async (params = {}) => {
      return handleApiCall(getNotifications, params);
    },
    [handleApiCall]
  );

  // Mark single notification as read
  const markAsRead = useCallback(
    async (notificationId) => {
      return handleApiCall(markNotificationAsRead, notificationId);
    },
    [handleApiCall]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    return handleApiCall(markAllNotificationsAsRead);
  }, [handleApiCall]);

  // Get notification categories
  const fetchCategories = useCallback(async () => {
    return handleApiCall(getNotificationCategories);
  }, [handleApiCall]);

  // Send notification (staff only)
  const sendNotificationMessage = useCallback(
    async (notificationData) => {
      return handleApiCall(sendNotification, notificationData);
    },
    [handleApiCall]
  );

  // Get notification statistics (staff only)
  const fetchStatistics = useCallback(
    async (params = {}) => {
      return handleApiCall(getNotificationStatistics, params);
    },
    [handleApiCall]
  );

  // Real-time notification functions

  // Send BPS notification
  const sendBPS = useCallback(
    async (bpsData) => {
      return handleApiCall(sendBPSNotification, bpsData);
    },
    [handleApiCall]
  );

  // Send attendance reminder
  const sendAttendanceReminderMessage = useCallback(
    async (reminderData) => {
      return handleApiCall(sendAttendanceReminder, reminderData);
    },
    [handleApiCall]
  );

  // Send rich notification
  const sendRichMessage = useCallback(
    async (richData) => {
      return handleApiCall(sendRichNotification, richData);
    },
    [handleApiCall]
  );

  // Send staff notification
  const sendStaffMessage = useCallback(
    async (staffData) => {
      return handleApiCall(sendStaffNotification, staffData);
    },
    [handleApiCall]
  );

  // Utility functions for common notification scenarios

  // Send grade notification
  const sendGradeNotification = useCallback(
    async (studentId, subject, grade, message) => {
      const notificationData = {
        type: 'single',
        title: `New Grade: ${subject}`,
        message: `You received a grade of ${grade}. ${message}`,
        priority: 'normal',
        recipients: [studentId],
        category: 'grade',
      };
      return sendNotificationMessage(notificationData);
    },
    [sendNotificationMessage]
  );

  // Send attendance notification
  const sendAttendanceNotification = useCallback(
    async (studentId, date, status, message) => {
      const notificationData = {
        type: 'single',
        title: `Attendance Update: ${date}`,
        message: `Your attendance status: ${status}. ${message}`,
        priority: 'normal',
        recipients: [studentId],
        category: 'attendance',
      };
      return sendNotificationMessage(notificationData);
    },
    [sendNotificationMessage]
  );

  // Send homework notification
  const sendHomeworkNotification = useCallback(
    async (recipients, subject, dueDate, description) => {
      const notificationData = {
        type: recipients.length === 1 ? 'single' : 'classroom',
        title: `New Homework: ${subject}`,
        message: `Due: ${dueDate}. ${description}`,
        priority: 'normal',
        recipients,
        category: 'homework',
      };
      return sendNotificationMessage(notificationData);
    },
    [sendNotificationMessage]
  );

  // Send announcement
  const sendAnnouncement = useCallback(
    async (title, message, type = 'all', priority = 'normal', recipients = []) => {
      const notificationData = {
        type,
        title,
        message,
        priority,
        recipients,
        category: 'announcement',
      };
      return sendNotificationMessage(notificationData);
    },
    [sendNotificationMessage]
  );

  // Send emergency notification
  const sendEmergencyNotification = useCallback(
    async (title, message, type = 'all') => {
      const notificationData = {
        type,
        title: `🚨 URGENT: ${title}`,
        message,
        priority: 'high',
        category: 'emergency',
      };
      return sendNotificationMessage(notificationData);
    },
    [sendNotificationMessage]
  );

  // Batch operations

  // Send notifications to multiple students
  const sendBatchNotifications = useCallback(
    async (notifications) => {
      const results = [];
      for (const notification of notifications) {
        const result = await sendNotificationMessage(notification);
        results.push(result);
      }
      return results;
    },
    [sendNotificationMessage]
  );

  // Mark multiple notifications as read
  const markMultipleAsRead = useCallback(
    async (notificationIds) => {
      const results = [];
      for (const id of notificationIds) {
        const result = await markAsRead(id);
        results.push(result);
      }
      return results;
    },
    [markAsRead]
  );

  return {
    // State
    loading,
    error,

    // Basic operations
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    fetchCategories,
    sendNotificationMessage,
    fetchStatistics,

    // Real-time notifications
    sendBPS,
    sendAttendanceReminderMessage,
    sendRichMessage,
    sendStaffMessage,

    // Utility functions
    sendGradeNotification,
    sendAttendanceNotification,
    sendHomeworkNotification,
    sendAnnouncement,
    sendEmergencyNotification,

    // Batch operations
    sendBatchNotifications,
    markMultipleAsRead,

    // Clear error
    clearError: () => setError(null),
  };
};
