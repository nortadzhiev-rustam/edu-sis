/**
 * Firebase Configuration Debug Utility
 * Helps debug Firebase senderId mismatch issues
 */

import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

/**
 * Check Firebase configuration and senderId
 */
export const debugFirebaseConfig = async () => {
  try {
    console.log('=== FIREBASE CONFIG DEBUG ===');
    console.log('Platform:', Platform.OS);
    
    // Check if Firebase is properly initialized
    const isInitialized = messaging().isDeviceRegisteredForRemoteMessages;
    console.log('Firebase initialized:', isInitialized !== undefined);
    
    // Get FCM token
    try {
      const token = await messaging().getToken();
      console.log('FCM Token available:', !!token);
      if (token) {
        console.log('Token length:', token.length);
        console.log('Token preview:', token.substring(0, 30) + '...');
        
        // Try to extract sender ID from token (first part before colon)
        const tokenParts = token.split(':');
        if (tokenParts.length > 0) {
          console.log('Potential Sender ID from token:', tokenParts[0]);
        }
      }
    } catch (tokenError) {
      console.error('Error getting FCM token:', tokenError.message);
    }
    
    // Check APNS token (iOS only)
    if (Platform.OS === 'ios') {
      try {
        const apnsToken = await messaging().getAPNSToken();
        console.log('APNS Token:', apnsToken ? 'Available' : 'Not available');
      } catch (apnsError) {
        console.log('APNS Token error:', apnsError.message);
      }
    }
    
    // Check registration status
    try {
      if (Platform.OS === 'ios') {
        const isRegistered = await messaging().isDeviceRegisteredForRemoteMessages;
        console.log('Device registered for remote messages:', isRegistered);
      }
    } catch (regError) {
      console.log('Registration check error:', regError.message);
    }
    
    console.log('=== END FIREBASE CONFIG DEBUG ===');
    
  } catch (error) {
    console.error('Firebase debug error:', error);
  }
};

/**
 * Check expected vs actual sender IDs
 */
export const checkSenderIdMismatch = () => {
  console.log('=== SENDER ID CONFIGURATION CHECK ===');
  
  // Expected sender IDs from your config files
  const expectedSenderId = '427748902918'; // From your google-services.json
  const expectedBundleId = 'com.edunovaasia.edusis'; // From app.json
  const expectedPackageName = 'com.edunovaasia.edusis'; // From app.json
  
  console.log('Expected Sender ID:', expectedSenderId);
  console.log('Expected Bundle ID (iOS):', expectedBundleId);
  console.log('Expected Package Name (Android):', expectedPackageName);
  
  // Check for mismatched configurations
  console.log('');
  console.log('POTENTIAL ISSUES TO CHECK:');
  console.log('1. Make sure google-services.json has package:', expectedPackageName);
  console.log('2. Make sure GoogleService-Info.plist has bundle:', expectedBundleId);
  console.log('3. Make sure both files have sender ID:', expectedSenderId);
  console.log('4. Check if you have multiple google-services.json files');
  console.log('5. Verify Firebase project settings match your app');
  
  console.log('=== END SENDER ID CONFIGURATION CHECK ===');
};

/**
 * Test Firebase messaging functionality
 */
export const testFirebaseMessaging = async () => {
  try {
    console.log('=== FIREBASE MESSAGING TEST ===');
    
    // Test permission status
    const authStatus = await messaging().hasPermission();
    console.log('Permission status:', authStatus);
    
    // Test token generation
    const token = await messaging().getToken();
    console.log('Token generation:', token ? 'SUCCESS' : 'FAILED');
    
    // Test message listener setup
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('Test message received:', remoteMessage);
    });
    
    console.log('Message listener setup: SUCCESS');
    unsubscribe(); // Clean up
    
    console.log('=== END FIREBASE MESSAGING TEST ===');
    return true;
    
  } catch (error) {
    console.error('Firebase messaging test failed:', error);
    return false;
  }
};

/**
 * Complete Firebase diagnostic
 */
export const runFirebaseDiagnostic = async () => {
  console.log('🔥 Starting Firebase Diagnostic...');
  
  await debugFirebaseConfig();
  checkSenderIdMismatch();
  const messagingWorking = await testFirebaseMessaging();
  
  console.log('🔥 Firebase Diagnostic Complete');
  console.log('📊 Messaging Status:', messagingWorking ? '✅ Working' : '❌ Issues Found');
  
  return messagingWorking;
};
