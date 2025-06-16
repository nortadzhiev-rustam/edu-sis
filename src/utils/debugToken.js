import { Platform } from 'react-native';
import { getDeviceToken } from './messaging';

/**
 * Debug utility to test device token functionality
 * Call this function to test if device tokens are working properly
 */
export async function debugDeviceToken() {
  console.log('🔍 DEBUG: Starting device token debug...');
  console.log('📱 Platform:', Platform.OS);
  
  try {
    const token = await getDeviceToken();
    
    if (token) {
      console.log('✅ DEBUG: Device token retrieved successfully');
      console.log('📏 Token length:', token.length);
      console.log('🔤 Token type:', typeof token);
      console.log('🏁 Token preview:', token.substring(0, 50) + '...');
      
      // Validate token format
      if (Platform.OS === 'android') {
        // Android FCM tokens are typically 152+ characters
        if (token.length < 100) {
          console.warn('⚠️ DEBUG: Android token seems too short');
        } else {
          console.log('✅ DEBUG: Android token length looks good');
        }
      } else if (Platform.OS === 'ios') {
        // iOS APNS tokens can vary in length
        if (token.length < 50) {
          console.warn('⚠️ DEBUG: iOS token seems too short');
        } else {
          console.log('✅ DEBUG: iOS token length looks good');
        }
      }
      
      return {
        success: true,
        token: token,
        platform: Platform.OS,
        tokenLength: token.length
      };
    } else {
      console.error('❌ DEBUG: No device token retrieved');
      return {
        success: false,
        error: 'No token retrieved',
        platform: Platform.OS
      };
    }
  } catch (error) {
    console.error('❌ DEBUG: Error during token retrieval:', error);
    return {
      success: false,
      error: error.message,
      platform: Platform.OS
    };
  }
}

/**
 * Test device token and log results for debugging
 */
export async function testDeviceTokenForLogin() {
  console.log('🧪 TEST: Testing device token for login...');
  
  const result = await debugDeviceToken();
  
  if (result.success) {
    console.log('✅ TEST: Device token is ready for login');
    console.log('📊 TEST Results:', {
      platform: result.platform,
      hasToken: true,
      tokenLength: result.tokenLength
    });
  } else {
    console.error('❌ TEST: Device token not ready for login');
    console.error('📊 TEST Results:', {
      platform: result.platform,
      hasToken: false,
      error: result.error
    });
  }
  
  return result;
}
