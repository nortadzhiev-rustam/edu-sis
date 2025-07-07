/**
 * Device Service
 * Handles device-related API calls including user removal from device
 */

import { Config, buildApiUrl } from '../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Logout user from device using authCode (NEW METHOD)
 * Uses the new backend logout endpoint that properly removes user by authCode
 * @param {string} authCode - The user's authentication code
 * @returns {Promise<Object>} - Response from the API
 */
export const logoutUserFromDevice = async (authCode) => {
  try {
    console.log('🚪 DEVICE SERVICE: Logging out user from device...');
    console.log(
      `🔑 Auth Code: ${authCode ? authCode.substring(0, 10) + '...' : 'null'}`
    );

    if (!authCode) {
      console.warn('⚠️ DEVICE SERVICE: No auth code provided');
      return { success: false, error: 'No auth code provided' };
    }

    // Use POST method with JSON body (primary endpoint)
    const url = buildApiUrl('/logout/');

    console.log('🔗 DEVICE SERVICE: Logout API URL:', url);

    // Add timeout for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        authCode: authCode,
      }),
    });

    clearTimeout(timeoutId);

    console.log('📡 DEVICE SERVICE: Logout response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ DEVICE SERVICE: Logout successful:', data);

      return {
        success: true,
        data: data,
        message: data.message || 'Successfully logged out',
      };
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        '❌ DEVICE SERVICE: Logout failed with status:',
        response.status
      );
      console.error('❌ DEVICE SERVICE: Error data:', errorData);

      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`,
        status: response.status,
      };
    }
  } catch (error) {
    console.error('❌ DEVICE SERVICE: Logout error:', error);

    // Fallback to GET method if POST fails
    try {
      console.log('🔄 DEVICE SERVICE: Trying fallback GET method...');
      return await logoutUserFromDeviceGET(authCode);
    } catch (fallbackError) {
      console.error('❌ DEVICE SERVICE: Fallback also failed:', fallbackError);
      return {
        success: false,
        error: error.message || 'Network error during logout',
        fallbackAttempted: true,
      };
    }
  }
};

/**
 * Logout user from device using GET method (FALLBACK)
 * Uses the alternative GET endpoint for backward compatibility
 * @param {string} authCode - The user's authentication code
 * @returns {Promise<Object>} - Response from the API
 */
export const logoutUserFromDeviceGET = async (authCode) => {
  try {
    console.log('🚪 DEVICE SERVICE: Logging out user (GET method)...');

    if (!authCode) {
      return { success: false, error: 'No auth code provided' };
    }

    // Use GET method with query parameter (fallback endpoint)
    const url = buildApiUrl('/mobile-api/logout-device/', {
      authCode: authCode,
    });

    console.log('🔗 DEVICE SERVICE: Logout GET API URL:', url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ DEVICE SERVICE: Logout GET successful:', data);

      return {
        success: true,
        data: data,
        message: data.message || 'Successfully logged out',
      };
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ DEVICE SERVICE: Logout GET failed:', response.status);

      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`,
        status: response.status,
      };
    }
  } catch (error) {
    console.error('❌ DEVICE SERVICE: Logout GET error:', error);
    return {
      success: false,
      error: error.message || 'Network error during logout',
    };
  }
};

/**
 * Remove user from device in the database
 * This API call tells the server that the user has logged out from this specific device
 * @param {string} userId - The user ID to remove from device
 * @param {string} deviceToken - The device token to remove the user from
 * @returns {Promise<Object>} - Response from the API
 */
export const removeUserFromDevice = async (userId, deviceToken) => {
  try {
    console.log('🔌 DEVICE SERVICE: Removing user from device...');
    console.log(`👤 User ID: ${userId}`);
    console.log(
      `📱 Device Token: ${
        deviceToken ? deviceToken.substring(0, 20) + '...' : 'null'
      }`
    );

    if (!userId) {
      console.warn('⚠️ DEVICE SERVICE: No user ID provided');
      return { success: false, error: 'No user ID provided' };
    }

    if (!deviceToken) {
      console.warn('⚠️ DEVICE SERVICE: No device token provided');
      return { success: false, error: 'No device token provided' };
    }

    // Build the API URL with query parameters
    const url = buildApiUrl(Config.API_ENDPOINTS.REMOVE_USER_FROM_DEVICE, {
      userId,
      deviceToken,
    });

    console.log('🔗 DEVICE SERVICE: API URL:', url);

    // Add timeout for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    console.log(`📡 DEVICE SERVICE: Response status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ DEVICE SERVICE: User successfully removed from device');
      console.log('📄 Response data:', data);

      return {
        success: true,
        data,
        message: 'User removed from device successfully',
      };
    } else {
      const errorText = await response.text();
      console.error('❌ DEVICE SERVICE: Failed to remove user from device');
      console.error(`📄 Error response: ${errorText}`);

      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
        status: response.status,
      };
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('⏰ DEVICE SERVICE: Request timeout');
      return {
        success: false,
        error: 'Request timeout - server did not respond within 10 seconds',
      };
    }

    console.error('❌ DEVICE SERVICE: Error removing user from device:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
};

/**
 * Get user ID from stored user data
 * @returns {Promise<string|null>} - User ID or null if not found
 */
export const getUserIdFromStorage = async () => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      // Try different possible user ID fields
      return user.id || user.user_id || user.userId || user.authCode || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting user ID from storage:', error);
    return null;
  }
};

/**
 * Get device token from storage
 * @returns {Promise<string|null>} - Device token or null if not found
 */
export const getDeviceTokenFromStorage = async () => {
  try {
    // Try both possible device token keys
    let deviceToken = await AsyncStorage.getItem('deviceToken');
    if (!deviceToken) {
      deviceToken = await AsyncStorage.getItem('fcmToken');
    }
    return deviceToken;
  } catch (error) {
    console.error('Error getting device token from storage:', error);
    return null;
  }
};

/**
 * Remove current user from device (convenience function)
 * Gets user ID and device token from storage and calls the API
 * @returns {Promise<Object>} - Response from the API
 */
export const removeCurrentUserFromDevice = async () => {
  try {
    console.log('🔌 DEVICE SERVICE: Removing current user from device...');

    const [userId, deviceToken] = await Promise.all([
      getUserIdFromStorage(),
      getDeviceTokenFromStorage(),
    ]);

    if (!userId) {
      console.warn('⚠️ DEVICE SERVICE: No user ID found in storage');
      return { success: false, error: 'No user ID found in storage' };
    }

    if (!deviceToken) {
      console.warn('⚠️ DEVICE SERVICE: No device token found in storage');
      return { success: false, error: 'No device token found in storage' };
    }

    return await removeUserFromDevice(userId, deviceToken);
  } catch (error) {
    console.error(
      '❌ DEVICE SERVICE: Error in removeCurrentUserFromDevice:',
      error
    );
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
};

/**
 * Remove specific student from device (for parent users)
 * @param {Object} studentData - Student data containing ID and auth info
 * @returns {Promise<Object>} - Response from the API
 */
export const removeStudentFromDevice = async (studentData) => {
  try {
    console.log(
      `🔌 DEVICE SERVICE: Removing student ${studentData.name} from device...`
    );

    const deviceToken = await getDeviceTokenFromStorage();
    if (!deviceToken) {
      console.warn('⚠️ DEVICE SERVICE: No device token found in storage');
      return { success: false, error: 'No device token found in storage' };
    }

    // Use student's ID or authCode as user ID
    const userId =
      studentData.id || studentData.authCode || studentData.user_id;
    if (!userId) {
      console.warn('⚠️ DEVICE SERVICE: No user ID found in student data');
      return { success: false, error: 'No user ID found in student data' };
    }

    return await removeUserFromDevice(userId, deviceToken);
  } catch (error) {
    console.error(
      '❌ DEVICE SERVICE: Error in removeStudentFromDevice:',
      error
    );
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
};

/**
 * Update last login timestamp for the user
 * This API call tells the server that the user has opened and started using the app
 * @param {string} authCode - The user's authentication code
 * @returns {Promise<Object>} - Response from the API
 */
export const updateLastLogin = async (authCode) => {
  try {
    console.log('⏰ DEVICE SERVICE: Updating last login timestamp...');
    console.log(
      `🔑 Auth Code: ${authCode ? authCode.substring(0, 10) + '...' : 'null'}`
    );

    if (!authCode) {
      console.warn('⚠️ DEVICE SERVICE: No auth code provided');
      return { success: false, error: 'No auth code provided' };
    }

    // Build the API URL for update last login
    const url = buildApiUrl('/update-last-login/');

    console.log('🔗 DEVICE SERVICE: Update last login API URL:', url);

    // Add timeout for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        authCode: authCode,
      }),
    });

    clearTimeout(timeoutId);

    console.log(
      '📡 DEVICE SERVICE: Update last login response status:',
      response.status
    );

    if (response.ok) {
      const data = await response.json();
      console.log('✅ DEVICE SERVICE: Last login updated successfully:', data);

      return {
        success: true,
        data: data,
        message: data.message || 'Last login updated successfully',
      };
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        '❌ DEVICE SERVICE: Update last login failed with status:',
        response.status
      );
      console.error('❌ DEVICE SERVICE: Error data:', errorData);

      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`,
        status: response.status,
      };
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('⏰ DEVICE SERVICE: Update last login request timeout');
      return {
        success: false,
        error: 'Request timeout - server did not respond within 10 seconds',
      };
    }

    console.error('❌ DEVICE SERVICE: Update last login error:', error);
    return {
      success: false,
      error: error.message || 'Network error during last login update',
    };
  }
};

/**
 * Update last login for current user (convenience function)
 * Gets auth code from storage and calls the API
 * @returns {Promise<Object>} - Response from the API
 */
export const updateCurrentUserLastLogin = async () => {
  try {
    console.log('⏰ DEVICE SERVICE: Updating current user last login...');

    const userData = await AsyncStorage.getItem('userData');
    if (!userData) {
      console.warn('⚠️ DEVICE SERVICE: No user data found in storage');
      return { success: false, error: 'No user data found in storage' };
    }

    const user = JSON.parse(userData);
    const authCode = user.authCode || user.auth_code;

    if (!authCode) {
      console.warn('⚠️ DEVICE SERVICE: No auth code found in user data');
      return { success: false, error: 'No auth code found in user data' };
    }

    return await updateLastLogin(authCode);
  } catch (error) {
    console.error(
      '❌ DEVICE SERVICE: Error in updateCurrentUserLastLogin:',
      error
    );
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
};
