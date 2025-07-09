/**
 * Rate Limit Clearing Utility
 * Quick utility to clear rate limits for testing
 */

import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CalendarSecurityService from '../services/calendarSecurityService';

/**
 * Clear Google Sign-In rate limit for current user
 */
export const clearGoogleSignInRateLimit = async () => {
  try {
    // Get current user data
    const userDataStr = await AsyncStorage.getItem('userData');
    if (!userDataStr) {
      Alert.alert('Error', 'No user data found. Please log in first.');
      return false;
    }

    const userData = JSON.parse(userDataStr);
    const userId = userData.id || userData.authCode || 'unknown';

    // Clear Google Sign-In rate limit
    await CalendarSecurityService.clearRateLimit(userId, 'google_signin');
    
    console.log('✅ RATE LIMIT: Cleared Google Sign-In rate limit for user:', userId);
    
    Alert.alert(
      'Rate Limit Cleared',
      'Google Sign-In rate limit has been cleared. You can now try signing in again.',
      [{ text: 'OK' }]
    );

    return true;

  } catch (error) {
    console.error('❌ RATE LIMIT: Error clearing rate limit:', error);
    Alert.alert('Error', `Failed to clear rate limit: ${error.message}`);
    return false;
  }
};

/**
 * Clear all rate limits for current user
 */
export const clearAllRateLimits = async () => {
  try {
    // Get current user data
    const userDataStr = await AsyncStorage.getItem('userData');
    if (!userDataStr) {
      Alert.alert('Error', 'No user data found. Please log in first.');
      return false;
    }

    const userData = JSON.parse(userDataStr);
    const userId = userData.id || userData.authCode || 'unknown';

    // Clear all rate limits
    await CalendarSecurityService.clearAllRateLimits(userId);
    
    console.log('✅ RATE LIMIT: Cleared all rate limits for user:', userId);
    
    Alert.alert(
      'All Rate Limits Cleared',
      'All rate limits have been cleared for your account. You can now try all actions again.',
      [{ text: 'OK' }]
    );

    return true;

  } catch (error) {
    console.error('❌ RATE LIMIT: Error clearing all rate limits:', error);
    Alert.alert('Error', `Failed to clear rate limits: ${error.message}`);
    return false;
  }
};

/**
 * Check current rate limit status
 */
export const checkRateLimitStatus = async () => {
  try {
    // Get current user data
    const userDataStr = await AsyncStorage.getItem('userData');
    if (!userDataStr) {
      Alert.alert('Error', 'No user data found. Please log in first.');
      return null;
    }

    const userData = JSON.parse(userDataStr);
    const userId = userData.id || userData.authCode || 'unknown';

    // Get all AsyncStorage keys
    const keys = await AsyncStorage.getAllKeys();
    const rateLimitKeys = keys.filter(key => 
      key.startsWith(`rate_limit_${userId}_`)
    );

    console.log('🔍 RATE LIMIT: Found rate limit keys:', rateLimitKeys);

    const rateLimitStatus = {};

    for (const key of rateLimitKeys) {
      try {
        const dataStr = await AsyncStorage.getItem(key);
        if (dataStr) {
          const data = JSON.parse(dataStr);
          const action = key.replace(`rate_limit_${userId}_`, '');
          const timeLeft = Math.max(0, (data.timestamp + 300000) - Date.now()); // 5 minutes default
          
          rateLimitStatus[action] = {
            count: data.count,
            timestamp: data.timestamp,
            timeLeftMs: timeLeft,
            timeLeftMin: Math.ceil(timeLeft / 60000),
            isActive: timeLeft > 0
          };
        }
      } catch (error) {
        console.error('❌ RATE LIMIT: Error parsing rate limit data for key:', key, error);
      }
    }

    console.log('📊 RATE LIMIT STATUS:', rateLimitStatus);

    // Show status in alert
    if (Object.keys(rateLimitStatus).length === 0) {
      Alert.alert(
        'Rate Limit Status',
        'No active rate limits found. All actions are available.',
        [{ text: 'OK' }]
      );
    } else {
      const statusText = Object.entries(rateLimitStatus)
        .map(([action, status]) => {
          if (status.isActive) {
            return `${action}: ${status.count} attempts, ${status.timeLeftMin}min left`;
          } else {
            return `${action}: Available (expired)`;
          }
        })
        .join('\n');

      Alert.alert(
        'Rate Limit Status',
        statusText,
        [
          { text: 'Clear All', onPress: clearAllRateLimits },
          { text: 'OK' }
        ]
      );
    }

    return rateLimitStatus;

  } catch (error) {
    console.error('❌ RATE LIMIT: Error checking status:', error);
    Alert.alert('Error', `Failed to check rate limit status: ${error.message}`);
    return null;
  }
};

/**
 * Quick fix for Google Sign-In rate limit error
 */
export const quickFixGoogleSignIn = async () => {
  try {
    console.log('🔧 QUICK FIX: Starting Google Sign-In rate limit fix...');

    // Clear the rate limit
    const cleared = await clearGoogleSignInRateLimit();
    
    if (cleared) {
      console.log('✅ QUICK FIX: Google Sign-In should now work');
      
      Alert.alert(
        'Quick Fix Applied',
        'Google Sign-In rate limit has been cleared.\n\nYou can now:\n• Go back to Calendar screen\n• Try signing in to Google Calendar again\n\nThe rate limit has been increased to 10 attempts per 5 minutes for testing.',
        [{ text: 'Got it!' }]
      );
    }

    return cleared;

  } catch (error) {
    console.error('❌ QUICK FIX: Error:', error);
    Alert.alert('Quick Fix Failed', `Error: ${error.message}`);
    return false;
  }
};

/**
 * Show rate limit help information
 */
export const showRateLimitHelp = () => {
  Alert.alert(
    'Rate Limiting Help',
    'Rate limiting prevents abuse of the Google Calendar API.\n\n' +
    'Current limits:\n' +
    '• Google Sign-In: 10 attempts per 5 minutes\n' +
    '• Fetch Events: 10 calls per minute\n' +
    '• Create/Edit/Delete: 5 calls per 5 minutes\n\n' +
    'If you hit a limit during testing, use the "Clear Rate Limits" option.',
    [
      { text: 'Clear Limits', onPress: clearAllRateLimits },
      { text: 'Check Status', onPress: checkRateLimitStatus },
      { text: 'OK' }
    ]
  );
};

export default {
  clearGoogleSignInRateLimit,
  clearAllRateLimits,
  checkRateLimitStatus,
  quickFixGoogleSignIn,
  showRateLimitHelp,
};
