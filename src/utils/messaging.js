import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

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
    // Check if we've already asked for permission before
    const hasAskedForPermission = await AsyncStorage.getItem(
      'hasAskedForNotificationPermission'
    );

    if (hasAskedForPermission !== 'true') {
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
              const authStatus = await messaging().requestPermission();
              const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

              if (enabled) {
                console.log('Notification permission granted');
                getFCMToken();
              } else {
                console.log('Notification permission denied by system');
              }
            },
          },
        ],
        { cancelable: false }
      );
    } else {
      // We've asked before, just check the current status
      const authStatus = await messaging().hasPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Notification permission already granted');
        getFCMToken();
      } else {
        console.log('Notification permission not granted');

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
    }
  } catch (error) {
    console.error('Error checking notification permission:', error);
  }
}

export async function getFCMToken() {
  try {
    const fcmToken = await AsyncStorage.getItem('fcmToken');
    if (!fcmToken) {
      const newToken = await messaging().getToken();
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

export async function getToken() {
  try {
    // Register device for remote messages first (required for iOS)
    if (Platform.OS === 'ios') {
      const isRegistered = await messaging().isDeviceRegisteredForRemoteMessages;
      if (!isRegistered) {
        await messaging().registerDeviceForRemoteMessages();
        console.log('Device registered for remote messages');
      }
    }

    // Get the device token directly from Firebase messaging
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Error getting Firebase messaging token:', error);
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
  // When the application is running in the background
  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log(
      'Notification caused app to open from background state:',
      remoteMessage.notification
    );
    // Navigate to appropriate screen if needed
    handleNotificationNavigation(remoteMessage);
  });

  // When the application is opened from a quit state
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log(
          'Notification caused app to open from quit state:',
          remoteMessage.notification
        );
        // Navigate to appropriate screen if needed
        handleNotificationNavigation(remoteMessage);
      }
    });

  // Handle foreground messages
  messaging().onMessage(async (remoteMessage) => {
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
    }

    if (Platform.OS === 'android') {
      notificationContent.channelId = channelId;
    }

    await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: null, // Show immediately
    });

    console.log('Local notification shown:', notificationContent.title);
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

    console.log('Announcement notification sent:', title);
  } catch (error) {
    console.error('Error sending announcement notification:', error);
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
