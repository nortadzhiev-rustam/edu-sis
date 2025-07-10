/**
 * Logout Service
 * Handles comprehensive cleanup of user data, notifications, and background services
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { clearFamiliesPolicyData } from './familiesPolicyService';
import { clearNotificationHistory } from '../utils/messaging';
import {
  removeCurrentUserFromDevice,
  removeStudentFromDevice,
  logoutUserFromDevice,
} from './deviceService';

/**
 * Comprehensive logout function that cleans up all user data
 * @param {Object} options - Logout options
 * @param {boolean} options.clearDeviceToken - Whether to clear device token (default: false)
 * @param {boolean} options.clearAllData - Whether to clear all app data (default: false)
 * @param {Function} options.messagingCleanup - Optional messaging context cleanup function
 * @param {Function} options.notificationCleanup - Optional notification context cleanup function
 */
export const performLogout = async (options = {}) => {
  const {
    clearDeviceToken = false,
    clearAllData = false,
    messagingCleanup,
    notificationCleanup,
  } = options;

  console.log('🚪 LOGOUT: Starting comprehensive logout process...');

  try {
    // 0. Clean up context states first
    if (messagingCleanup && typeof messagingCleanup === 'function') {
      console.log('💬 LOGOUT: Cleaning up messaging context...');
      messagingCleanup();
    }

    if (notificationCleanup && typeof notificationCleanup === 'function') {
      console.log('🔔 LOGOUT: Cleaning up notification context...');
      notificationCleanup();
    }
    // 1. Remove user from device using new authCode-based logout method
    console.log('� LOGOUT: Removing user from device using authCode...');
    try {
      // Get current user data to get authCode
      const userData = await AsyncStorage.getItem('userData');
      let currentUserType = 'unknown';
      let authCode = null;

      if (userData) {
        const user = JSON.parse(userData);
        currentUserType = user.userType || user.user_type || 'unknown';
        authCode = user.authCode || user.auth_code;
        console.log(`👤 LOGOUT: Current user type: ${currentUserType}`);
        console.log(
          `🔑 LOGOUT: Auth code available: ${authCode ? 'Yes' : 'No'}`
        );
      }

      // Check if there are student accounts on this device (parent accounts)
      const studentAccounts = await AsyncStorage.getItem('studentAccounts');
      const hasStudentAccounts =
        studentAccounts && JSON.parse(studentAccounts).length > 0;

      console.log(
        `👨‍👩‍👧‍👦 LOGOUT: Student accounts on device: ${
          hasStudentAccounts ? 'Yes' : 'No'
        }`
      );

      // Decision logic for device removal
      if (currentUserType === 'teacher' && hasStudentAccounts) {
        console.log('🏫 LOGOUT: Teacher logout with student accounts present');
        console.log(
          'ℹ️ LOGOUT: Skipping device removal to preserve student notifications'
        );
        console.log(
          '✅ LOGOUT: Teacher will stop receiving notifications via local data cleanup'
        );
      } else if (authCode) {
        // Use new authCode-based logout method
        console.log('� LOGOUT: Using new authCode-based logout method...');
        const logoutResult = await logoutUserFromDevice(authCode);
        if (logoutResult.success) {
          console.log('✅ LOGOUT: User successfully logged out from device');
          console.log('📊 LOGOUT: Response:', logoutResult.message);
        } else {
          console.warn(
            '⚠️ LOGOUT: Failed to logout from device:',
            logoutResult.error
          );

          // Fallback to old method if new method fails
          console.log('🔄 LOGOUT: Falling back to old removal method...');
          const fallbackResult = await removeCurrentUserFromDevice();
          if (fallbackResult.success) {
            console.log('✅ LOGOUT: Fallback removal successful');
          } else {
            console.warn(
              '⚠️ LOGOUT: Fallback removal also failed:',
              fallbackResult.error
            );
          }
        }
      } else {
        // No authCode available, use old method
        console.log(
          '� LOGOUT: No authCode available, using old removal method...'
        );
        const deviceRemovalResult = await removeCurrentUserFromDevice();
        if (deviceRemovalResult.success) {
          console.log(
            '✅ LOGOUT: User successfully removed from device database'
          );
        } else {
          console.warn(
            '⚠️ LOGOUT: Failed to remove user from device database:',
            deviceRemovalResult.error
          );
        }
      }
    } catch (error) {
      console.error('❌ LOGOUT: Error during device removal:', error);
      // Continue with logout even if device removal fails
    }

    // 1.5. Note: We don't unregister FCM completely during logout because:
    // - It would affect all users on the device (including students in parent accounts)
    // - The backend database removal (step 1) already prevents notifications for this user
    // - FCM token should remain active for other users who might still be logged in
    console.log(
      'ℹ️ LOGOUT: Keeping FCM active for other potential users on device'
    );
    console.log(
      '✅ LOGOUT: User-specific notifications stopped via backend database removal'
    );

    // 2. Clear app icon badge immediately
    console.log('📱 LOGOUT: Clearing app icon badge...');
    await Notifications.setBadgeCountAsync(0);

    // 3. Clear user data
    console.log('👤 LOGOUT: Clearing user data...');
    await AsyncStorage.removeItem('userData');
    await AsyncStorage.removeItem('calendarUserData'); // Clear temporary calendar user data

    // 4. Clear notification history and related data
    console.log('🔔 LOGOUT: Clearing notification data...');
    await clearNotificationHistory();
    await AsyncStorage.removeItem('notificationHistory');

    // 5. Clear messaging data
    console.log('💬 LOGOUT: Clearing messaging data...');
    const messagingKeys = [
      'conversationHistory',
      'unreadConversations',
      'messagingCache',
      'lastMessageUpdate',
    ];
    await AsyncStorage.multiRemove(messagingKeys);

    // 6. Clear families policy data
    console.log('👨‍👩‍👧‍👦 LOGOUT: Clearing families policy data...');
    await clearFamiliesPolicyData();

    // 7. Clear cached user-specific data
    console.log('🗂️ LOGOUT: Clearing cached data...');
    const cacheKeys = [
      'selectedStudent',
      'selectedStudentId',
      'selectedBranch',
      'selectedBranchId',
      'teacherTimetable',
      'studentGrades',
      'attendanceData',
      'homeworkData',
      'libraryData',
      'bpsData',
      'healthData',
    ];
    await AsyncStorage.multiRemove(cacheKeys);

    // 8. Clear student accounts only for parent users or complete logout
    if (clearAllData) {
      console.log('👨‍👩‍👧‍👦 LOGOUT: Clearing student accounts (complete logout)...');
      await AsyncStorage.removeItem('studentAccounts');
    } else {
      console.log('👨‍👩‍👧‍👦 LOGOUT: Preserving student accounts (normal logout)...');
      console.log(
        'ℹ️ LOGOUT: Student accounts remain for parent dashboard access'
      );
    }

    // 9. Optionally clear device token (usually not needed unless switching devices)
    if (clearDeviceToken) {
      console.log('📱 LOGOUT: Clearing device token...');
      await AsyncStorage.multiRemove(['deviceToken', 'fcmToken']);
    }

    // 10. If clearAllData is true, clear everything including device-specific data
    if (clearAllData) {
      console.log('🧹 LOGOUT: Clearing all app data...');
      const allKeys = await AsyncStorage.getAllKeys();
      // Keep only essential device keys if not clearing device token
      const keysToKeep = clearDeviceToken ? [] : ['deviceToken', 'fcmToken'];
      const keysToRemove = allKeys.filter((key) => !keysToKeep.includes(key));

      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
        console.log(`🧹 LOGOUT: Cleared ${keysToRemove.length} storage keys`);
      }
    } else {
      // 11. Clear any remaining user-specific keys by pattern matching
      console.log('🔍 LOGOUT: Clearing remaining user-specific data...');
      const allKeys = await AsyncStorage.getAllKeys();

      // Patterns that indicate user-specific data
      const userDataPatterns = [
        /^grades_/,
        /^homework_/,
        /^attendance_/,
        /^timetable_/,
        /^library_/,
        /^bps_/,
        /^notifications_/,
        /^student_data_/,
        /^student_cache_/,
        /^teacher_/,
        /^parent_/,
        /_cache$/,
        /_history$/,
      ];

      const userSpecificKeys = allKeys.filter((key) =>
        userDataPatterns.some((pattern) => pattern.test(key))
      );

      if (userSpecificKeys.length > 0) {
        await AsyncStorage.multiRemove(userSpecificKeys);
        console.log(
          `🔍 LOGOUT: Cleared ${userSpecificKeys.length} user-specific keys`
        );
      }
    }

    console.log('✅ LOGOUT: Comprehensive logout completed successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ LOGOUT: Error during logout process:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Quick logout function for basic cleanup (backwards compatibility)
 */
export const quickLogout = async () => {
  return await performLogout({ clearDeviceToken: false, clearAllData: false });
};

/**
 * Complete logout function that clears everything including device data
 * This also unregisters FCM - use only when switching devices or complete reset
 */
export const completeLogout = async () => {
  return await performLogout({
    clearDeviceToken: true,
    clearAllData: true,
    unregisterFCM: true, // This will unregister FCM completely
  });
};

/**
 * Complete device reset - unregisters FCM and clears all data
 * Use this when switching devices or doing a factory reset
 */
export const performDeviceReset = async () => {
  console.log('🔄 DEVICE RESET: Starting complete device reset...');

  try {
    // Import FCM unregistration function only when needed
    const { unregisterDeviceFromFCM } = await import('../utils/messaging');

    // 1. Unregister device from FCM completely
    console.log('🚫 DEVICE RESET: Unregistering device from FCM...');
    try {
      const fcmResult = await unregisterDeviceFromFCM();
      if (fcmResult.success) {
        console.log(
          '✅ DEVICE RESET: Device successfully unregistered from FCM'
        );
      } else {
        console.warn(
          '⚠️ DEVICE RESET: Failed to unregister device from FCM:',
          fcmResult.error
        );
      }
    } catch (error) {
      console.error(
        '❌ DEVICE RESET: Error unregistering device from FCM:',
        error
      );
    }

    // 2. Perform complete logout with all data clearing
    const logoutResult = await performLogout({
      clearDeviceToken: true,
      clearAllData: true,
    });

    if (logoutResult.success) {
      console.log('✅ DEVICE RESET: Complete device reset successful');
      return { success: true, message: 'Device reset completed successfully' };
    } else {
      console.error(
        '❌ DEVICE RESET: Logout portion failed:',
        logoutResult.error
      );
      return { success: false, error: logoutResult.error };
    }
  } catch (error) {
    console.error('❌ DEVICE RESET: Error during device reset:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Student removal cleanup (for parent users)
 * @param {Object} studentData - Student data to remove
 */
export const cleanupStudentData = async (studentData) => {
  console.log(
    `🧹 STUDENT CLEANUP: Cleaning up data for student ${studentData.name}...`
  );

  try {
    // 1. Remove student from device in database first
    console.log('🔌 STUDENT CLEANUP: Removing student from device database...');
    try {
      const deviceRemovalResult = await removeStudentFromDevice(studentData);
      if (deviceRemovalResult.success) {
        console.log(
          '✅ STUDENT CLEANUP: Student successfully removed from device database'
        );
      } else {
        console.warn(
          '⚠️ STUDENT CLEANUP: Failed to remove student from device database:',
          deviceRemovalResult.error
        );
        // Continue with cleanup even if device removal fails
      }
    } catch (error) {
      console.error(
        '❌ STUDENT CLEANUP: Error removing student from device database:',
        error
      );
      // Continue with cleanup even if device removal fails
    }

    // 2. Clean up student-specific cache keys
    const studentSpecificKeys = [
      `grades_${studentData.authCode}`,
      `homework_${studentData.authCode}`,
      `attendance_${studentData.authCode}`,
      `timetable_${studentData.authCode}`,
      `library_${studentData.authCode}`,
      `bps_${studentData.authCode}`,
      `notifications_${studentData.authCode}`,
      `student_data_${studentData.id}`,
      `student_cache_${studentData.authCode}`,
    ];

    // Remove known student-specific keys
    await AsyncStorage.multiRemove(studentSpecificKeys);

    // Clean up notification history for this student
    try {
      const notificationHistory = await AsyncStorage.getItem(
        'notificationHistory'
      );
      if (notificationHistory) {
        const notifications = JSON.parse(notificationHistory);
        if (Array.isArray(notifications)) {
          const filteredNotifications = notifications.filter(
            (notification) =>
              !(
                notification.studentAuthCode === studentData.authCode ||
                notification.authCode === studentData.authCode ||
                notification.studentId === studentData.id
              )
          );

          if (filteredNotifications.length !== notifications.length) {
            await AsyncStorage.setItem(
              'notificationHistory',
              JSON.stringify(filteredNotifications)
            );
            console.log(
              '🔔 STUDENT CLEANUP: Cleaned up student-specific notifications'
            );
          }
        }
      }
    } catch (error) {
      console.log(
        '⚠️ STUDENT CLEANUP: Could not clean notification history:',
        error
      );
    }

    // Find and remove any dynamic keys containing student identifiers
    const allKeys = await AsyncStorage.getAllKeys();
    const dynamicStudentKeys = allKeys.filter(
      (key) =>
        key.includes(studentData.id) ||
        key.includes(studentData.authCode) ||
        (studentData.username && key.includes(studentData.username))
    );

    if (dynamicStudentKeys.length > 0) {
      await AsyncStorage.multiRemove(dynamicStudentKeys);
      console.log(
        `🔍 STUDENT CLEANUP: Removed ${dynamicStudentKeys.length} dynamic student keys`
      );
    }

    console.log('✅ STUDENT CLEANUP: Student data cleanup completed');
    return { success: true };
  } catch (error) {
    console.error('❌ STUDENT CLEANUP: Error during student cleanup:', error);
    return { success: false, error: error.message };
  }
};
