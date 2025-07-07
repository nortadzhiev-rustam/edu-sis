/**
 * Notification Service
 * Handles all notification-related API calls and local storage
 */

import { Config, buildApiUrl } from '../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper function to get auth code from storage
const getAuthCode = async () => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      const authCode = user.authCode || user.auth_code;
      if (!authCode) {
        console.warn(
          '⚠️ NOTIFICATION SERVICE: User data found but no authCode available'
        );
        console.log(
          'ℹ️ NOTIFICATION SERVICE: This usually means user is not properly logged in'
        );
      }
      return authCode;
    } else {
      console.warn('⚠️ NOTIFICATION SERVICE: No user data found in storage');
      console.log('ℹ️ NOTIFICATION SERVICE: User appears to be logged out');
    }
    return null;
  } catch (error) {
    console.error('❌ NOTIFICATION SERVICE: Error getting auth code:', error);
    return null;
  }
};

// Helper function to make API requests
const makeApiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      timeout: Config.NETWORK.TIMEOUT,
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * Get notifications list with pagination
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 20)
 * @param {string} params.category - Filter by category (optional)
 * @returns {Promise<Object>} - Notifications data
 */
export const getNotifications = async (params = {}) => {
  try {
    const authCode = await getAuthCode();
    if (!authCode) {
      const errorMessage =
        'No authentication code found - user may not be logged in';
      console.error('❌ NOTIFICATION SERVICE:', errorMessage);
      throw new Error(errorMessage);
    }

    const queryParams = {
      authCode,
      page: params.page || 1,
      limit: params.limit || 20,
      ...params,
    };

    const url = buildApiUrl(
      Config.API_ENDPOINTS.GET_NOTIFICATIONS,
      queryParams
    );
    return await makeApiRequest(url);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Get legacy notifications (backward compatibility)
 * @returns {Promise<Object>} - Notifications data
 */
export const getLegacyNotifications = async () => {
  try {
    const authCode = await getAuthCode();
    if (!authCode) {
      throw new Error('No authentication code found');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_NOTIFICATIONS_LEGACY, {
      authCode,
    });
    return await makeApiRequest(url);
  } catch (error) {
    console.error('Error fetching legacy notifications:', error);
    throw error;
  }
};

/**
 * Mark a notification as read
 * @param {number} notificationId - ID of the notification to mark as read
 * @param {string} specificAuthCode - Optional specific authCode to use (for student context)
 * @returns {Promise<Object>} - Response data
 */
export const markNotificationAsRead = async (
  notificationId,
  specificAuthCode = null
) => {
  try {
    const authCode = specificAuthCode || (await getAuthCode());
    if (!authCode) {
      throw new Error('No authentication code found');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.MARK_NOTIFICATION_READ);
    return await makeApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        authCode,
        notification_id: notificationId,
      }),
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 * @param {string} specificAuthCode - Optional specific authCode to use (for student context)
 * @returns {Promise<Object>} - Response data
 */
export const markAllNotificationsAsRead = async (specificAuthCode = null) => {
  try {
    const authCode = specificAuthCode || (await getAuthCode());
    if (!authCode) {
      throw new Error('No authentication code found');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.MARK_ALL_NOTIFICATIONS_READ);
    return await makeApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        authCode,
      }),
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Get notification categories
 * @returns {Promise<Object>} - Categories data
 */
export const getNotificationCategories = async () => {
  try {
    const authCode = await getAuthCode();
    if (!authCode) {
      throw new Error('No authentication code found');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_NOTIFICATION_CATEGORIES, {
      authCode,
    });
    return await makeApiRequest(url);
  } catch (error) {
    console.error('Error fetching notification categories:', error);
    throw error;
  }
};

/**
 * Send notification (Staff only)
 * @param {Object} notificationData - Notification data
 * @param {string} notificationData.type - Type: single|classroom|all|staff
 * @param {string} notificationData.title - Notification title
 * @param {string} notificationData.message - Notification message
 * @param {string} notificationData.priority - Priority: low|normal|high
 * @param {Array} notificationData.recipients - Array of recipient IDs (for single/classroom)
 * @returns {Promise<Object>} - Response data
 */
export const sendNotification = async (notificationData) => {
  try {
    const authCode = await getAuthCode();
    if (!authCode) {
      throw new Error('No authentication code found');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.SEND_NOTIFICATION);
    return await makeApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        authCode,
        ...notificationData,
      }),
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

/**
 * Get notification statistics (Staff only)
 * @param {Object} params - Query parameters
 * @param {string} params.date_from - Start date filter (YYYY-MM-DD)
 * @param {string} params.date_to - End date filter (YYYY-MM-DD)
 * @returns {Promise<Object>} - Statistics data
 */
export const getNotificationStatistics = async (params = {}) => {
  try {
    const authCode = await getAuthCode();
    if (!authCode) {
      throw new Error('No authentication code found');
    }

    const queryParams = {
      authCode,
      ...params,
    };

    const url = buildApiUrl(
      Config.API_ENDPOINTS.GET_NOTIFICATION_STATISTICS,
      queryParams
    );
    return await makeApiRequest(url);
  } catch (error) {
    console.error('Error fetching notification statistics:', error);
    throw error;
  }
};

// Real-time notification functions

/**
 * Send BPS notification
 * @param {Object} bpsData - BPS notification data
 * @param {number} bpsData.student_id - Student ID
 * @param {number} bpsData.user_id - User ID
 * @param {string} bpsData.item_type - Type: dps|prs
 * @param {string} bpsData.item_title - Item title
 * @param {number} bpsData.item_point - Point value
 * @param {string} bpsData.date - Date (YYYY-MM-DD)
 * @param {number} bpsData.id - BPS record ID
 * @returns {Promise<Object>} - Response data
 */
export const sendBPSNotification = async (bpsData) => {
  try {
    const url = buildApiUrl(Config.API_ENDPOINTS.SEND_BPS_NOTIFICATION);
    return await makeApiRequest(url, {
      method: 'POST',
      body: JSON.stringify(bpsData),
    });
  } catch (error) {
    console.error('Error sending BPS notification:', error);
    throw error;
  }
};

/**
 * Send attendance reminder
 * @param {Object} reminderData - Reminder data
 * @param {number} reminderData.branch_id - Branch ID
 * @param {string} reminderData.message - Reminder message
 * @returns {Promise<Object>} - Response data
 */
export const sendAttendanceReminder = async (reminderData) => {
  try {
    const url = buildApiUrl(Config.API_ENDPOINTS.SEND_ATTENDANCE_REMINDER);
    return await makeApiRequest(url, {
      method: 'POST',
      body: JSON.stringify(reminderData),
    });
  } catch (error) {
    console.error('Error sending attendance reminder:', error);
    throw error;
  }
};

/**
 * Send rich notification
 * @param {Object} richData - Rich notification data
 * @param {number} richData.student - Student ID
 * @param {string} richData.type - Notification type
 * @param {string} richData.title - Notification title
 * @param {string} richData.message - Notification message
 * @param {Object} richData.data - Additional data
 * @returns {Promise<Object>} - Response data
 */
export const sendRichNotification = async (richData) => {
  try {
    const url = buildApiUrl(Config.API_ENDPOINTS.SEND_RICH_NOTIFICATION);
    return await makeApiRequest(url, {
      method: 'POST',
      body: JSON.stringify(richData),
    });
  } catch (error) {
    console.error('Error sending rich notification:', error);
    throw error;
  }
};

/**
 * Send staff notification
 * @param {Object} staffData - Staff notification data
 * @param {string} staffData.title - Notification title
 * @param {string} staffData.message - Notification message
 * @param {string} staffData.type - Notification type
 * @param {string} staffData.priority - Priority level
 * @returns {Promise<Object>} - Response data
 */
export const sendStaffNotification = async (staffData) => {
  try {
    const url = buildApiUrl(Config.API_ENDPOINTS.SEND_STAFF_NOTIFICATION);
    return await makeApiRequest(url, {
      method: 'POST',
      body: JSON.stringify(staffData),
    });
  } catch (error) {
    console.error('Error sending staff notification:', error);
    throw error;
  }
};

/**
 * Send health notification
 * @param {Object} healthData - Health notification data
 * @param {number} healthData.student_id - Student ID (for student health records)
 * @param {number} healthData.staff_id - Staff ID (for staff health records)
 * @param {string} healthData.guest_name - Guest name (for guest health records)
 * @param {string} healthData.type - Health notification type: 'student_visit'|'staff_visit'|'guest_visit'|'health_alert'
 * @param {string} healthData.title - Notification title
 * @param {string} healthData.message - Notification message
 * @param {string} healthData.priority - Priority: 'low'|'normal'|'high'|'urgent'
 * @param {Object} healthData.data - Additional health data
 * @returns {Promise<Object>} - Response data
 */
export const sendHealthNotification = async (healthData) => {
  try {
    const authCode = await getAuthCode();
    if (!authCode) {
      throw new Error('Authentication required');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.SEND_HEALTH_NOTIFICATION);

    return await makeApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        authCode,
        ...healthData,
      }),
    });
  } catch (error) {
    console.error('Error sending health notification:', error);
    throw error;
  }
};

/**
 * Send emergency health alert
 * @param {Object} emergencyData - Emergency alert data
 * @param {number} emergencyData.student_id - Student ID
 * @param {string} emergencyData.emergency_type - Type: 'allergy'|'injury'|'illness'|'accident'
 * @param {string} emergencyData.severity - Severity: 'minor'|'moderate'|'severe'|'critical'
 * @param {string} emergencyData.description - Emergency description
 * @param {string} emergencyData.location - Location of emergency
 * @param {Array} emergencyData.emergency_contacts - Emergency contact IDs to notify
 * @returns {Promise<Object>} - Response data
 */
export const sendEmergencyHealthAlert = async (emergencyData) => {
  try {
    const authCode = await getAuthCode();
    if (!authCode) {
      throw new Error('Authentication required');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.SEND_EMERGENCY_HEALTH_ALERT);

    return await makeApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        authCode,
        ...emergencyData,
        priority: 'urgent', // Emergency alerts are always urgent
      }),
    });
  } catch (error) {
    console.error('Error sending emergency health alert:', error);
    throw error;
  }
};

/**
 * Get health notification categories for filtering
 * @returns {Array} - Array of health notification categories
 */
export const getHealthNotificationCategories = () => {
  return [
    {
      id: 'health_visit',
      name: 'Health Visits',
      description:
        'Notifications about student, staff, and guest health visits',
      types: ['student_visit', 'staff_visit', 'guest_visit'],
    },
    {
      id: 'health_alert',
      name: 'Health Alerts',
      description: 'Important health alerts and emergencies',
      types: ['allergy_alert', 'emergency', 'injury_report'],
    },
    {
      id: 'health_reminder',
      name: 'Health Reminders',
      description: 'Medication reminders and health checkup notifications',
      types: [
        'medication_reminder',
        'checkup_reminder',
        'vaccination_reminder',
      ],
    },
    {
      id: 'health_update',
      name: 'Health Updates',
      description: 'Updates to health information and records',
      types: ['info_updated', 'record_created', 'record_updated'],
    },
  ];
};
