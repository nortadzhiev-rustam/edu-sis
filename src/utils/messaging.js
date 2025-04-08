import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform, Linking } from 'react-native';

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
      }
    });

  // Handle foreground messages
  messaging().onMessage(async (remoteMessage) => {
    console.log('Received foreground message:', remoteMessage);
    // You can show a local notification here
  });
};
