import { registerRootComponent } from 'expo';
import {
  getMessaging,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';

import App from './App';

// Register background handler for Firebase messaging
setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
  console.log('Message handled in the background!', remoteMessage);

  // You can perform background tasks here like:
  // - Updating local storage
  // - Making network requests
  // - Processing notification data

  // Store notification in history for when app opens
  try {
    const AsyncStorage =
      require('@react-native-async-storage/async-storage').default;
    const existingNotifications = await AsyncStorage.getItem(
      'notificationHistory'
    );
    const notifications = existingNotifications
      ? JSON.parse(existingNotifications)
      : [];

    const notificationRecord = {
      id: Date.now().toString(),
      title: remoteMessage.notification?.title || 'Background Notification',
      body: remoteMessage.notification?.body || 'You have a new update',
      data: remoteMessage.data || {},
      timestamp: remoteMessage.sentTime || Date.now(),
      read: false,
      type: remoteMessage.data?.type || 'general',
    };

    // Add new notification to the beginning and keep only last 100
    const updatedNotifications = [notificationRecord, ...notifications].slice(
      0,
      100
    );
    await AsyncStorage.setItem(
      'notificationHistory',
      JSON.stringify(updatedNotifications)
    );

    console.log('Background notification stored:', notificationRecord.title);
  } catch (error) {
    console.error('Error storing background notification:', error);
  }
});

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
