import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Utility functions for managing notification preferences
 */

const DEFAULT_NOTIFICATION_SETTINGS = {
  enabled: true,
  sound: true,
  vibration: true,
  showPreviews: true,
  categories: {
    grades: true,
    attendance: true,
    homework: true,
    behavior: true,
    announcements: true,
    emergency: true,
  },
};

/**
 * Get notification settings from storage
 * @returns {Promise<Object>} Notification settings object
 */
export const getNotificationSettings = async () => {
  try {
    const savedSettings = await AsyncStorage.getItem('notificationSettings');
    if (savedSettings) {
      return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(savedSettings) };
    }
    return DEFAULT_NOTIFICATION_SETTINGS;
  } catch (error) {
    console.error('Error loading notification settings:', error);
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
};

/**
 * Save notification settings to storage
 * @param {Object} settings - Notification settings object
 * @returns {Promise<boolean>} Success status
 */
export const saveNotificationSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(
      'notificationSettings',
      JSON.stringify(settings)
    );
    return true;
  } catch (error) {
    console.error('Error saving notification settings:', error);
    return false;
  }
};

/**
 * Check if notifications are enabled for a specific category
 * @param {string} category - Category to check (grades, attendance, homework, behavior, announcements, emergency)
 * @returns {Promise<boolean>} Whether notifications are enabled for this category
 */
export const isNotificationEnabledForCategory = async (category) => {
  try {
    const settings = await getNotificationSettings();
    return settings.enabled && settings.categories[category];
  } catch (error) {
    console.error('Error checking notification category:', error);
    return false;
  }
};

/**
 * Check if sound is enabled for notifications
 * @returns {Promise<boolean>} Whether sound is enabled
 */
export const isSoundEnabled = async () => {
  try {
    const settings = await getNotificationSettings();
    return settings.enabled && settings.sound;
  } catch (error) {
    console.error('Error checking sound setting:', error);
    return false;
  }
};

/**
 * Check if vibration is enabled for notifications
 * @returns {Promise<boolean>} Whether vibration is enabled
 */
export const isVibrationEnabled = async () => {
  try {
    const settings = await getNotificationSettings();
    return settings.enabled && settings.vibration;
  } catch (error) {
    console.error('Error checking vibration setting:', error);
    return false;
  }
};

/**
 * Check if notification previews should be shown
 * @returns {Promise<boolean>} Whether previews should be shown
 */
export const shouldShowPreviews = async () => {
  try {
    const settings = await getNotificationSettings();
    return settings.enabled && settings.showPreviews;
  } catch (error) {
    console.error('Error checking preview setting:', error);
    return false;
  }
};

/**
 * Update a specific notification setting
 * @param {string} key - Setting key to update
 * @param {any} value - New value
 * @param {string} categoryKey - Optional category key for nested settings
 * @returns {Promise<boolean>} Success status
 */
export const updateNotificationSetting = async (
  key,
  value,
  categoryKey = null
) => {
  try {
    const settings = await getNotificationSettings();

    if (categoryKey) {
      settings.categories[categoryKey] = value;
    } else {
      settings[key] = value;
    }

    return await saveNotificationSettings(settings);
  } catch (error) {
    console.error('Error updating notification setting:', error);
    return false;
  }
};

/**
 * Reset notification settings to defaults
 * @returns {Promise<boolean>} Success status
 */
export const resetNotificationSettings = async () => {
  try {
    return await saveNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);
  } catch (error) {
    console.error('Error resetting notification settings:', error);
    return false;
  }
};

/**
 * Get notification configuration for a specific notification type
 * This can be used by notification services to determine how to display notifications
 * @param {string} category - Notification category
 * @returns {Promise<Object>} Notification configuration
 */
export const getNotificationConfig = async (category) => {
  try {
    const settings = await getNotificationSettings();

    return {
      enabled: settings.enabled && settings.categories[category],
      sound: settings.enabled && settings.sound,
      vibration: settings.enabled && settings.vibration,
      showPreviews: settings.enabled && settings.showPreviews,
    };
  } catch (error) {
    console.error('Error getting notification config:', error);
    return {
      enabled: false,
      sound: false,
      vibration: false,
      showPreviews: false,
    };
  }
};

/**
 * Notification category mappings for easy reference
 */
export const NOTIFICATION_CATEGORIES = {
  GRADES: 'grades',
  ATTENDANCE: 'attendance',
  HOMEWORK: 'homework',
  BEHAVIOR: 'behavior',
  ANNOUNCEMENTS: 'announcements',
  EMERGENCY: 'emergency',
};

/**
 * Get user-friendly category names
 */
export const getCategoryDisplayName = (category) => {
  const displayNames = {
    grades: 'Grades',
    attendance: 'Attendance',
    homework: 'Homework',
    behavior: 'Behavior Points',
    announcements: 'Announcements',
    emergency: 'Emergency Alerts',
  };

  return displayNames[category] || category;
};

/**
 * Example usage in notification services:
 *
 * import { isNotificationEnabledForCategory, getNotificationConfig, NOTIFICATION_CATEGORIES } from '../utils/notificationPreferences';
 *
 * // Check if grades notifications are enabled
 * const canSendGradeNotification = await isNotificationEnabledForCategory(NOTIFICATION_CATEGORIES.GRADES);
 *
 * // Get full config for homework notifications
 * const homeworkConfig = await getNotificationConfig(NOTIFICATION_CATEGORIES.HOMEWORK);
 * if (homeworkConfig.enabled) {
 *   // Send notification with sound/vibration based on config
 *   await sendNotification({
 *     title: 'New Homework Assignment',
 *     body: 'You have a new assignment due tomorrow',
 *     sound: homeworkConfig.sound,
 *     vibrate: homeworkConfig.vibration,
 *   });
 * }
 */
