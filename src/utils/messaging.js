import {
  getMessaging,
  getToken as getFirebaseToken,
  requestPermission,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  registerDeviceForRemoteMessages,
  isDeviceRegisteredForRemoteMessages,
} from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Navigation reference for programmatic navigation
let navigationRef = null;
let isNavigationReady = false;
let pendingNavigationActions = [];
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_INTERVAL = 2000;

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestUserPermission() {
  try {
    console.log('🔔 PERMISSION: Starting permission request process...');

    // Check if we've already asked for permission before
    const hasAskedForPermission = await AsyncStorage.getItem(
      'hasAskedForNotificationPermission'
    );
    console.log(
      '📋 PERMISSION: Previously asked for permission:',
      hasAskedForPermission
    );

    if (hasAskedForPermission !== 'true') {
      console.log('🆕 PERMISSION: First time asking for permission');
      // First time asking - show a custom alert explaining why we need notifications
      // Note: We need to import the language context to use translations here
      Alert.alert(
        'Enable Notifications', // TODO: Replace with t('enableNotifications') when context is available
        "Would you like to receive important updates about your child's education? This includes grades, attendance, and school announcements.", // TODO: Replace with t('notificationPermissionMessage')
        [
          {
            text: 'Not Now', // TODO: Replace with t('notNow')
            onPress: async () => {
              // Remember that we've asked even if they said no
              await AsyncStorage.setItem(
                'hasAskedForNotificationPermission',
                'true'
              );
              console.log('Notification permission denied by user');
            },
            style: 'cancel',
          },
          {
            text: 'Yes, Enable',
            onPress: async () => {
              // Remember that we've asked
              await AsyncStorage.setItem(
                'hasAskedForNotificationPermission',
                'true'
              );

              // Request the actual permission
              console.log(
                '🔐 PERMISSION: Requesting Firebase messaging permission...'
              );
              try {
                const messaging = getMessaging();
                const authStatus = await requestPermission(messaging);
                console.log('📋 PERMISSION: Auth status received:', authStatus);

                const enabled =
                  authStatus === 1 || // AuthorizationStatus.AUTHORIZED
                  authStatus === 2; // AuthorizationStatus.PROVISIONAL
                console.log('✅ PERMISSION: Permission enabled:', enabled);

                if (enabled) {
                  console.log(
                    '🎉 PERMISSION: Notification permission granted!'
                  );
                  getFCMToken();
                } else {
                  console.log(
                    '❌ PERMISSION: Notification permission denied by system'
                  );
                }
              } catch (permissionError) {
                console.error('❌ PERMISSION ERROR:', permissionError);
                console.log(
                  '🔄 PERMISSION: Continuing without notifications...'
                );
              }
            },
          },
        ],
        { cancelable: false }
      );
    } else {
      // We've asked before, check the current status by requesting permission
      // requestPermission() will return the current status without showing a dialog if already determined
      console.log('🔍 PERMISSION: Checking current permission status...');
      try {
        const messaging = getMessaging();
        const authStatus = await requestPermission(messaging);
        const enabled =
          authStatus === 1 || // AuthorizationStatus.AUTHORIZED
          authStatus === 2; // AuthorizationStatus.PROVISIONAL

        console.log('📋 PERMISSION: Current auth status:', authStatus);
        console.log('✅ PERMISSION: Permission enabled:', enabled);

        if (enabled) {
          console.log('🎉 PERMISSION: Notification permission already granted');
          getFCMToken();
        } else {
          console.log('❌ PERMISSION: Notification permission not granted');

          // Ask if they want to enable notifications in settings
          setTimeout(() => {
            Alert.alert(
              'Enable Notifications',
              "Would you like to enable notifications in settings? You'll receive important updates about your child's education.",
              [
                {
                  text: 'Not Now',
                  style: 'cancel',
                },
                {
                  text: 'Open Settings',
                  onPress: openNotificationSettings,
                },
              ]
            );
          }, 1000); // Slight delay to not overwhelm the user
        }
      } catch (permissionError) {
        console.error('❌ PERMISSION CHECK ERROR:', permissionError);
        console.log('🔄 PERMISSION: Continuing without notifications...');
      }
    }
  } catch (error) {
    console.error('Error checking notification permission:', error);
  }
}

export async function getFCMToken() {
  try {
    const fcmToken = await AsyncStorage.getItem('fcmToken');
    if (!fcmToken) {
      const messaging = getMessaging();
      const newToken = await getFirebaseToken(messaging);
      if (newToken) {
        await AsyncStorage.setItem('fcmToken', newToken);
        return newToken;
      }
    }
    return fcmToken;
  } catch (error) {
    console.log('Error getting FCM token:', error);
    return null;
  }
}

// Backward compatibility - alias for getDeviceToken
export { getDeviceToken as getToken };

export async function getDeviceToken() {
  try {
    console.log('🎫 DEVICE TOKEN: Starting token retrieval process...');
    console.log('📱 Platform:', Platform.OS);

    // Check if running on emulator/simulator
    const isRealDevice = Device.isDevice;
    console.log('🔍 DEVICE CHECK: Is real device:', isRealDevice);
    if (!isRealDevice) {
      console.warn(
        '⚠️ EMULATOR DETECTED: FCM tokens may not work properly on emulators'
      );
      console.warn(
        '💡 RECOMMENDATION: Test on a real Android device for accurate results'
      );
    }

    // Platform-specific setup
    if (Platform.OS === 'ios') {
      console.log(
        '🍎 iOS: Checking device registration for remote messages...'
      );
      const messaging = getMessaging();
      const isRegistered = isDeviceRegisteredForRemoteMessages(messaging);
      console.log(
        '📋 iOS: Device registered for remote messages:',
        isRegistered
      );

      if (!isRegistered) {
        console.log('📝 iOS: Registering device for remote messages...');
        await registerDeviceForRemoteMessages(messaging);
        console.log('✅ iOS: Device registration complete');
      }
    } else if (Platform.OS === 'android') {
      console.log('🤖 Android: Preparing Firebase messaging...');
      // Android doesn't require explicit registration like iOS
      // but we can add any Android-specific setup here if needed
    }

    // Get the device token directly from Firebase messaging
    console.log('🔑 FIREBASE: Requesting messaging token...');
    const messaging = getMessaging();
    const token = await getFirebaseToken(messaging);

    if (token) {
      console.log('✅ DEVICE TOKEN: Successfully retrieved');
      console.log('📏 Token length:', token.length);
      console.log('🔤 Token type:', typeof token);
      console.log('🏁 Token first 30 chars:', token.substring(0, 30) + '...');
      console.log('🔍 FULL TOKEN FOR DEBUG:', token); // Full token for debugging

      // Store token in AsyncStorage for future use
      await AsyncStorage.setItem('deviceToken', token);
      console.log('💾 DEVICE TOKEN: Stored in AsyncStorage');

      // Validate token format
      if (token.length < 50) {
        console.warn('⚠️ TOKEN WARNING: Token seems unusually short for FCM');
      }
      if (token.includes('undefined') || token.includes('null')) {
        console.error('❌ TOKEN ERROR: Token contains invalid values');
      }
    } else {
      console.log('❌ DEVICE TOKEN: No token returned from Firebase');

      // Try to get cached token from AsyncStorage
      const cachedToken = await AsyncStorage.getItem('deviceToken');
      if (cachedToken) {
        console.log('📦 DEVICE TOKEN: Using cached token');
        return cachedToken;
      }
    }

    return token;
  } catch (error) {
    console.error('❌ DEVICE TOKEN ERROR:', error);
    console.error('🔍 Error message:', error.message);
    console.error('📊 Error code:', error.code);
    console.error('🏷️ Error domain:', error.domain);

    // Try to get cached token as fallback
    try {
      const cachedToken = await AsyncStorage.getItem('deviceToken');
      if (cachedToken) {
        console.log('📦 DEVICE TOKEN: Using cached token as fallback');
        return cachedToken;
      }
    } catch (cacheError) {
      console.error('❌ CACHE ERROR:', cacheError);
    }

    return null;
  }
}

// Function to open app notification settings
export const openNotificationSettings = async () => {
  try {
    if (Platform.OS === 'ios') {
      await Linking.openURL('app-settings:');
    } else {
      // For Android
      await Linking.openSettings();
    }
  } catch (error) {
    console.error('Error opening settings:', error);
    Alert.alert(
      'Error',
      'Unable to open settings. Please open settings manually.'
    );
  }
};

export const notificationListener = () => {
  console.log('👂 LISTENERS: Setting up notification listeners...');

  const messaging = getMessaging();

  // Firebase messaging listeners
  // When the application is running in the background
  onNotificationOpenedApp(messaging, (remoteMessage) => {
    console.log(
      '🔔 FIREBASE BACKGROUND: App opened from background notification'
    );
    console.log('📋 Notification data:', remoteMessage.notification);
    console.log('📦 Message data:', remoteMessage.data);
    console.log('🏷️ Message ID:', remoteMessage.messageId);

    // Add a delay to ensure navigation is ready when app opens from background
    setTimeout(() => {
      handleNotificationNavigation(remoteMessage);
    }, 500);
  });

  // When the application is opened from a quit state
  getInitialNotification(messaging).then((remoteMessage) => {
    if (remoteMessage) {
      console.log(
        '🔔 FIREBASE QUIT STATE: App opened from quit state notification'
      );
      console.log('📋 Notification data:', remoteMessage.notification);
      console.log('📦 Message data:', remoteMessage.data);
      console.log('🏷️ Message ID:', remoteMessage.messageId);

      // Add a longer delay for quit state as app needs more time to initialize
      setTimeout(() => {
        handleNotificationNavigation(remoteMessage);
      }, 1000);
    } else {
      console.log('📱 NORMAL LAUNCH: App opened normally (no notification)');
    }
  });

  // Handle foreground messages
  onMessage(messaging, async (remoteMessage) => {
    console.log(
      '🔔 FIREBASE FOREGROUND: Received foreground message:',
      remoteMessage
    );
    // Show local notification for foreground messages
    await showLocalNotification(remoteMessage);
    // Store notification in history
    await storeNotificationInHistory(remoteMessage);
  });

  // Expo notifications listeners for local notifications
  // Handle notification taps when app is in background/foreground
  Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('🔔 EXPO NOTIFICATION: User tapped on notification');
    console.log(
      '📦 Notification data:',
      response.notification.request.content.data
    );

    // Create a remoteMessage-like object for consistency
    const mockRemoteMessage = {
      data: response.notification.request.content.data,
      notification: {
        title: response.notification.request.content.title,
        body: response.notification.request.content.body,
      },
    };

    // Add a small delay to ensure navigation is ready
    setTimeout(() => {
      handleNotificationNavigation(mockRemoteMessage);
    }, 200);
  });

  // Handle notification received while app is in foreground
  Notifications.addNotificationReceivedListener((notification) => {
    console.log('🔔 EXPO FOREGROUND: Notification received while app is open');
    console.log('📦 Notification data:', notification.request.content.data);
    // Note: This doesn't trigger navigation as the user didn't tap the notification
  });
};

// Enhanced notification functions

// Setup local notifications
export async function setupLocalNotifications() {
  try {
    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return false;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('education-updates', {
          name: 'Education Updates',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#007AFF',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('attendance-alerts', {
          name: 'Attendance Alerts',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF9500',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('grade-updates', {
          name: 'Grade Updates',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#34C759',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('bps-updates', {
          name: 'BPS Updates',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF6B35',
          sound: 'default',
        });
      }

      return true;
    } else {
      console.log('Must use physical device for Push Notifications');
      return false;
    }
  } catch (error) {
    console.error('Error setting up local notifications:', error);
    return false;
  }
}

// Show local notification for foreground messages
export async function showLocalNotification(remoteMessage) {
  try {
    const { notification, data } = remoteMessage;

    if (!notification) return;

    const notificationContent = {
      title: notification.title || 'Education Update',
      body: notification.body || 'You have a new update',
      data: data || {},
      sound: 'default',
    };

    // Determine channel based on notification type
    let channelId = 'education-updates';
    if (data?.type === 'attendance') {
      channelId = 'attendance-alerts';
    } else if (data?.type === 'grade') {
      channelId = 'grade-updates';
    } else if (data?.type === 'bps' || data?.item_type) {
      channelId = 'bps-updates';
    }

    if (Platform.OS === 'android') {
      notificationContent.channelId = channelId;
    }

    await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: null, // Show immediately
    });
  } catch (error) {
    console.error('Error showing local notification:', error);
  }
}

// Store notification in history
export async function storeNotificationInHistory(remoteMessage) {
  try {
    const { notification, data, sentTime } = remoteMessage;

    const notificationRecord = {
      id: Date.now().toString(),
      title: notification?.title || 'Education Update',
      body: notification?.body || 'You have a new update',
      data: data || {},
      timestamp: sentTime || Date.now(),
      read: false,
      type: data?.type || 'general',
    };

    // Get existing notifications
    const existingNotifications = await getNotificationHistory();

    // Add new notification to the beginning
    const updatedNotifications = [notificationRecord, ...existingNotifications];

    // Keep only last 100 notifications
    const trimmedNotifications = updatedNotifications.slice(0, 100);

    // Store updated notifications
    await AsyncStorage.setItem(
      'notificationHistory',
      JSON.stringify(trimmedNotifications)
    );

    // Update app icon badge count
    const unreadCount = trimmedNotifications.filter((n) => !n.read).length;
    await Notifications.setBadgeCountAsync(unreadCount);
    console.log(
      `📱 BADGE: Updated app icon badge to ${unreadCount} after storing notification`
    );

    console.log('Notification stored in history:', notificationRecord.title);
  } catch (error) {
    console.error('Error storing notification in history:', error);
  }
}

// Get notification history
export async function getNotificationHistory() {
  try {
    const storedNotifications = await AsyncStorage.getItem(
      'notificationHistory'
    );
    return storedNotifications ? JSON.parse(storedNotifications) : [];
  } catch (error) {
    console.error('Error getting notification history:', error);
    return [];
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId) {
  try {
    const notifications = await getNotificationHistory();
    const updatedNotifications = notifications.map((notification) =>
      notification.id === notificationId
        ? { ...notification, read: true }
        : notification
    );

    await AsyncStorage.setItem(
      'notificationHistory',
      JSON.stringify(updatedNotifications)
    );

    // Update app icon badge count
    const unreadCount = updatedNotifications.filter((n) => !n.read).length;
    await Notifications.setBadgeCountAsync(unreadCount);
    console.log(
      `📱 BADGE: Updated app icon badge to ${unreadCount} after marking notification as read`
    );

    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

// Clear all notifications
export async function clearNotificationHistory() {
  try {
    await AsyncStorage.removeItem('notificationHistory');

    // Clear app icon badge when all notifications are cleared
    await Notifications.setBadgeCountAsync(0);
    console.log(
      '📱 BADGE: Cleared app icon badge after clearing all notifications'
    );

    return true;
  } catch (error) {
    console.error('Error clearing notification history:', error);
    return false;
  }
}

/**
 * Unregister device from Firebase Cloud Messaging
 * This prevents the device from receiving any push notifications
 * Should be called during logout to stop notifications for logged-out users
 */
export async function unregisterDeviceFromFCM() {
  try {
    console.log(
      '🚫 FCM: Unregistering device from Firebase Cloud Messaging...'
    );

    const messaging = getMessaging();

    // Delete the FCM token to stop receiving notifications
    await messaging.deleteToken();
    console.log('✅ FCM: Device token deleted successfully');

    // Clear cached tokens from AsyncStorage
    await AsyncStorage.multiRemove(['deviceToken', 'fcmToken']);
    console.log('🧹 FCM: Cleared cached device tokens from storage');

    return { success: true };
  } catch (error) {
    console.error('❌ FCM: Error unregistering device:', error);
    console.error('🔍 Error details:', error.message);

    // Even if FCM deletion fails, clear local tokens
    try {
      await AsyncStorage.multiRemove(['deviceToken', 'fcmToken']);
      console.log('🧹 FCM: Cleared cached tokens despite FCM error');
    } catch (storageError) {
      console.error('❌ FCM: Failed to clear cached tokens:', storageError);
    }

    return { success: false, error: error.message };
  }
}

/**
 * Re-register device with Firebase Cloud Messaging
 * This should be called after login to re-enable push notifications
 * Gets a fresh device token and stores it
 */
export async function reregisterDeviceWithFCM() {
  try {
    console.log(
      '🔄 FCM: Re-registering device with Firebase Cloud Messaging...'
    );

    // Clear any existing cached tokens first
    await AsyncStorage.multiRemove(['deviceToken', 'fcmToken']);

    // Get a fresh device token
    const newToken = await getDeviceToken();

    if (newToken) {
      console.log('✅ FCM: Device re-registered successfully');
      console.log('🎫 FCM: New token length:', newToken.length);
      return { success: true, token: newToken };
    } else {
      console.warn('⚠️ FCM: Failed to get new device token');
      return { success: false, error: 'Failed to get new device token' };
    }
  } catch (error) {
    console.error('❌ FCM: Error re-registering device:', error);
    return { success: false, error: error.message };
  }
}

// Set navigation reference for programmatic navigation
export function setNavigationRef(ref) {
  console.log('🧭 NAVIGATION: Setting navigation reference...');
  navigationRef = ref;
  isNavigationReady = true;

  // Process any pending navigation actions
  processPendingNavigationActions();
}

// Clear all pending navigation actions (useful for cleanup)
export function clearPendingNavigationActions() {
  console.log(
    `🧹 NAVIGATION: Clearing ${pendingNavigationActions.length} pending navigation actions`
  );
  pendingNavigationActions = [];
  if (retryInterval) {
    clearInterval(retryInterval);
    retryInterval = null;
  }
}

// Process pending navigation actions
function processPendingNavigationActions() {
  if (pendingNavigationActions.length > 0) {
    console.log(
      `🧭 NAVIGATION: Processing ${pendingNavigationActions.length} pending navigation actions...`
    );
    const actionsToProcess = [...pendingNavigationActions];
    pendingNavigationActions = [];

    actionsToProcess.forEach((actionItem) => {
      try {
        if (typeof actionItem === 'function') {
          // Legacy support for direct functions
          actionItem();
        } else {
          // New format with retry count
          actionItem.action();
        }
      } catch (error) {
        console.error('❌ NAVIGATION: Error processing pending action:', error);

        // Only re-queue if under retry limit
        const retryCount = actionItem.retryCount || 0;
        if (retryCount < MAX_RETRY_ATTEMPTS) {
          console.log(
            `🔄 NAVIGATION: Re-queueing action (attempt ${
              retryCount + 1
            }/${MAX_RETRY_ATTEMPTS})`
          );
          const actionToRequeue =
            typeof actionItem === 'function'
              ? { action: actionItem, retryCount: retryCount + 1 }
              : { ...actionItem, retryCount: retryCount + 1 };
          pendingNavigationActions.push(actionToRequeue);
        } else {
          console.error(
            `❌ NAVIGATION: Max retry attempts (${MAX_RETRY_ATTEMPTS}) reached, dropping action`
          );
        }
      }
    });
  }
}

// Retry mechanism for pending actions
let retryInterval = null;
function startRetryMechanism() {
  if (retryInterval) return; // Already started

  retryInterval = setInterval(() => {
    if (
      pendingNavigationActions.length > 0 &&
      isNavigationReady &&
      navigationRef
    ) {
      console.log('🔄 NAVIGATION: Retrying pending navigation actions...');
      processPendingNavigationActions();
    }

    // Stop retrying if no pending actions
    if (pendingNavigationActions.length === 0) {
      console.log(
        '✅ NAVIGATION: No more pending actions, stopping retry mechanism'
      );
      clearInterval(retryInterval);
      retryInterval = null;
    }
  }, RETRY_INTERVAL);
}

// Queue navigation action if navigation is not ready
function queueNavigationAction(action) {
  console.log(
    '⏳ NAVIGATION: Queueing navigation action until navigation is ready...'
  );

  // Create action item with retry count
  const actionItem =
    typeof action === 'function'
      ? { action, retryCount: 0 }
      : { ...action, retryCount: 0 };

  pendingNavigationActions.push(actionItem);

  // Start retry mechanism if not already started
  startRetryMechanism();
}

// Safe navigation function that checks if navigation is ready
function safeNavigate(screenName, params = {}) {
  const navigationAction = () => {
    try {
      if (navigationRef && typeof navigationRef.navigate === 'function') {
        // Check if navigation is ready (if method exists)
        if (
          navigationRef.isReady &&
          typeof navigationRef.isReady === 'function'
        ) {
          if (navigationRef.isReady()) {
            console.log(
              `🚀 NAVIGATION: Navigating to ${screenName} (ready check passed) with params:`,
              params
            );
            navigationRef.navigate(screenName, params);
          } else {
            console.log(
              '⏳ NAVIGATION: Navigation not ready yet, queueing action...'
            );
            throw new Error('Navigation not ready');
          }
        } else {
          // Fallback for older React Navigation versions or different implementations
          console.log(
            `🚀 NAVIGATION: Navigating to ${screenName} (fallback method) with params:`,
            params
          );
          navigationRef.navigate(screenName, params);
        }
      } else {
        console.error('❌ NAVIGATION: Navigation reference is null or invalid');
        throw new Error('Invalid navigation reference');
      }
    } catch (error) {
      console.error('❌ NAVIGATION: Error during navigation:', error.message);
      throw error;
    }
  };

  if (isNavigationReady && navigationRef) {
    try {
      navigationAction();
    } catch (error) {
      console.log(
        '⏳ NAVIGATION: Queueing action due to error:',
        error.message
      );
      // Queue the action to retry later
      queueNavigationAction(navigationAction);
    }
  } else {
    console.log('⏳ NAVIGATION: Navigation not ready, queueing action...');
    queueNavigationAction(navigationAction);
  }
}

// Get user type from stored data
async function getUserType() {
  try {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      const parsedData = JSON.parse(userData);
      console.log('🔍 MESSAGING: Getting user type from userData:', parsedData);

      // Check multiple possible fields for user type
      const userType =
        parsedData.userType || parsedData.user_type || parsedData.type;
      const role = parsedData.role;

      // Determine user type based on stored data
      if (
        parsedData.is_teacher ||
        role === 'teacher' ||
        userType === 'teacher' ||
        userType === 'staff'
      ) {
        console.log('👨‍🏫 MESSAGING: Detected user type: teacher');
        return 'teacher';
      } else if (
        role === 'parent' ||
        parsedData.is_parent ||
        userType === 'parent'
      ) {
        console.log('👨‍👩‍👧‍👦 MESSAGING: Detected user type: parent');
        return 'parent';
      } else if (userType === 'student' || role === 'student') {
        console.log('👨‍🎓 MESSAGING: Detected user type: student');
        return 'student';
      } else {
        console.log(
          '❓ MESSAGING: Unknown user type, defaulting to student. UserData:',
          parsedData
        );
        return 'student';
      }
    }
    console.log('⚠️ MESSAGING: No userData found, defaulting to student');
    return 'student'; // Default fallback
  } catch (error) {
    console.error('Error getting user type:', error);
    return 'student';
  }
}

// Handle notification navigation
export async function handleNotificationNavigation(remoteMessage) {
  try {
    const { data } = remoteMessage;

    console.log('🔔 NAVIGATION: Handling notification navigation...');
    console.log('📦 Navigation data:', data);

    // Check if navigation reference is available
    if (!navigationRef) {
      console.warn(
        '⚠️ NAVIGATION: Navigation reference not set, cannot navigate'
      );
      return;
    }

    // Get user type to determine navigation parameters
    const userType = await getUserType();
    const authCode = await AsyncStorage.getItem('authCode');

    console.log('👤 NAVIGATION: User type:', userType);
    console.log('🔑 NAVIGATION: Auth code available:', !!authCode);

    // Handle messaging notifications specifically
    if (data?.type === 'message' || data?.notification_type === 'message') {
      console.log('💬 NAVIGATION: Handling message notification');

      const conversationUuid = data.conversation_uuid || data.conversation_id;
      const conversationTopic =
        data.conversation_topic || data.topic || 'Conversation';

      if (conversationUuid) {
        // Navigate directly to the conversation
        const conversationParams = {
          conversationUuid,
          conversationTopic,
          authCode,
        };

        if (userType === 'teacher') {
          conversationParams.teacherName = data.user_name || 'Teacher';
          conversationParams.userType = 'teacher';
        } else if (userType === 'student') {
          conversationParams.studentName = data.user_name || 'Student';
          conversationParams.userType = 'student';
        }

        console.log(
          '🚀 NAVIGATION: Navigating to ConversationScreen with params:',
          conversationParams
        );
        safeNavigate('ConversationScreen', conversationParams);
        return;
      } else {
        // Navigate to messaging screen if no specific conversation
        if (userType === 'teacher') {
          safeNavigate('TeacherMessagingScreen', {
            authCode,
            teacherName: data.user_name || 'Teacher',
          });
        } else if (userType === 'student') {
          safeNavigate('StudentMessagingScreen', {
            authCode,
            studentName: data.user_name || 'Student',
          });
        }
        return;
      }
    }

    // Default behavior for other notification types - navigate to NotificationScreen
    const navigationParams = {
      userType: userType,
    };

    // Add authCode for all user types (not just students)
    if (authCode) {
      navigationParams.authCode = authCode;
    }

    console.log(
      '🚀 NAVIGATION: Attempting to navigate to NotificationScreen with params:',
      navigationParams
    );

    // Use safe navigation function
    safeNavigate('NotificationScreen', navigationParams);

    // Log the specific notification type for analytics
    if (data?.type) {
      console.log(
        `📊 ANALYTICS: User opened app from ${data.type} notification`
      );
    }
  } catch (error) {
    console.error('Error handling notification navigation:', error);
  }
}

// Education-specific notification functions

// Schedule attendance reminder
export async function scheduleAttendanceReminder(classInfo) {
  try {
    const { subject, date } = classInfo;

    // Calculate trigger time (5 minutes before class)
    const classTime = new Date(date);
    const reminderTime = new Date(classTime.getTime() - 5 * 60 * 1000);

    if (reminderTime <= new Date()) {
      console.log('Class time has passed, not scheduling reminder');
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Class Starting Soon',
        body: `${subject} class starts in 5 minutes`,
        data: { type: 'attendance', classInfo },
        sound: 'default',
        channelId: Platform.OS === 'android' ? 'attendance-alerts' : undefined,
      },
      trigger: {
        date: reminderTime,
      },
    });

    console.log('Attendance reminder scheduled for:', subject);
  } catch (error) {
    console.error('Error scheduling attendance reminder:', error);
  }
}

// Send grade update notification
export async function sendGradeUpdateNotification(gradeInfo) {
  try {
    const { subject, grade, type } = gradeInfo;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'New Grade Available',
        body: `Your ${type} grade for ${subject} is now available: ${grade}`,
        data: { type: 'grade', gradeInfo },
        sound: 'default',
        channelId: Platform.OS === 'android' ? 'grade-updates' : undefined,
      },
      trigger: null, // Show immediately
    });

    console.log('Grade update notification sent for:', subject);
  } catch (error) {
    console.error('Error sending grade update notification:', error);
  }
}

// Send announcement notification
export async function sendAnnouncementNotification(announcement) {
  try {
    const { title, message, priority } = announcement;

    const channelId =
      priority === 'high' ? 'attendance-alerts' : 'education-updates';

    await Notifications.scheduleNotificationAsync({
      content: {
        title: title || 'School Announcement',
        body: message,
        data: { type: 'announcement', announcement },
        sound: 'default',
        channelId: Platform.OS === 'android' ? channelId : undefined,
      },
      trigger: null, // Show immediately
    });
  } catch (error) {
    console.error('Error sending announcement notification:', error);
  }
}

// Send BPS notification
export async function sendBPSLocalNotification(bpsData) {
  try {
    const { item_type, item_title, item_point, note } = bpsData;

    const isPositive = item_type === 'prs';
    const title = isPositive
      ? 'Positive Behavior Recognition' // TODO: Replace with t('positiveBehaviorRecognition') when context is available
      : 'Behavior Notice'; // TODO: Replace with t('behaviorNotice')
    const pointText = item_point > 0 ? `+${item_point}` : `${item_point}`;

    let body = `${item_title} (${pointText} points)`; // TODO: Replace 'points' with t('points')
    if (note?.trim()) {
      body += `\n${note}`;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          type: 'bps',
          ...bpsData,
        },
        sound: 'default',
        channelId: Platform.OS === 'android' ? 'bps-updates' : undefined,
      },
      trigger: null, // Show immediately
    });

    console.log('BPS notification sent:', title);
  } catch (error) {
    console.error('Error sending BPS notification:', error);
  }
}

// Get unread notification count
export async function getUnreadNotificationCount() {
  try {
    const notifications = await getNotificationHistory();
    return notifications.filter((notification) => !notification.read).length;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return 0;
  }
}

// Schedule daily attendance summary (for teachers)
export async function scheduleDailyAttendanceSummary() {
  try {
    // Schedule for 6 PM every day
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(18, 0, 0, 0);

    // If it's already past 6 PM today, schedule for tomorrow
    if (now > scheduledTime) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Daily Attendance Summary',
        body: "Review today's attendance records and complete any pending entries",
        data: { type: 'attendance', summary: true },
        sound: 'default',
        channelId: Platform.OS === 'android' ? 'education-updates' : undefined,
      },
      trigger: {
        date: scheduledTime,
        repeats: true,
      },
    });

    console.log('Daily attendance summary scheduled');
  } catch (error) {
    console.error('Error scheduling daily attendance summary:', error);
  }
}
