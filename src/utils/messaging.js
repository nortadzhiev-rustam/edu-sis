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
      Alert.alert(
        'Enable Notifications',
        "Would you like to receive important updates about your child's education? This includes grades, attendance, and school announcements.",
        [
          {
            text: 'Not Now',
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

      // Store token in AsyncStorage for future use
      await AsyncStorage.setItem('deviceToken', token);
      console.log('💾 DEVICE TOKEN: Stored in AsyncStorage');
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

  // When the application is running in the background
  onNotificationOpenedApp(messaging, (remoteMessage) => {
    console.log('🔔 BACKGROUND NOTIFICATION: App opened from background');
    console.log('📋 Notification data:', remoteMessage.notification);
    console.log('📦 Message data:', remoteMessage.data);
    console.log('🏷️ Message ID:', remoteMessage.messageId);

    // Navigate to appropriate screen if needed
    handleNotificationNavigation(remoteMessage);
  });

  // When the application is opened from a quit state
  getInitialNotification(messaging).then((remoteMessage) => {
    if (remoteMessage) {
      console.log('🔔 QUIT STATE NOTIFICATION: App opened from quit state');
      console.log('📋 Notification data:', remoteMessage.notification);
      console.log('📦 Message data:', remoteMessage.data);
      console.log('🏷️ Message ID:', remoteMessage.messageId);

      // Navigate to appropriate screen if needed
      handleNotificationNavigation(remoteMessage);
    } else {
      console.log('📱 NORMAL LAUNCH: App opened normally (no notification)');
    }
  });

  // Handle foreground messages
  onMessage(messaging, async (remoteMessage) => {
    console.log('Received foreground message:', remoteMessage);
    // Show local notification for foreground messages
    await showLocalNotification(remoteMessage);
    // Store notification in history
    await storeNotificationInHistory(remoteMessage);
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
    return true;
  } catch (error) {
    console.error('Error clearing notification history:', error);
    return false;
  }
}

// Handle notification navigation
export function handleNotificationNavigation(remoteMessage) {
  try {
    const { data } = remoteMessage;

    if (!data) return;

    // Handle different notification types
    switch (data.type) {
      case 'attendance':
        // Navigate to attendance screen
        console.log('Navigate to attendance screen');
        break;
      case 'grade':
        // Navigate to grades screen
        console.log('Navigate to grades screen');
        break;
      case 'announcement':
        // Navigate to announcements screen
        console.log('Navigate to announcements screen');
        break;
      case 'timetable':
        // Navigate to timetable screen
        console.log('Navigate to timetable screen');
        break;
      default:
        // Navigate to home screen
        console.log('Navigate to home screen');
        break;
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
      ? 'Positive Behavior Recognition'
      : 'Behavior Notice';
    const pointText = item_point > 0 ? `+${item_point}` : `${item_point}`;

    let body = `${item_title} (${pointText} points)`;
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
