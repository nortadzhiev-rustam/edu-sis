/**
 * Authentication Service
 * Uses dummy data for development and testing
 */

import { Config, buildApiUrl } from '../config/env';
import { getLoginDeviceInfo } from '../utils/deviceInfo';

// Flag to toggle between dummy data and real API
const USE_DUMMY_DATA = Config.DEV.USE_DUMMY_DATA;

// Dummy data for development (when USE_DUMMY_DATA is true)
const dummyTeachers = [
  {
    id: 'T001',
    username: 'teacher1',
    password: 'password123',
    name: 'John Teacher',
    authCode: 'AUTH_T001',
    userType: 'teacher',
  },
];

const dummyStudents = [
  {
    id: 'S001',
    username: 'student1',
    password: 'password123',
    name: 'Jane Student',
    authCode: 'AUTH_S001',
    userType: 'student',
  },
];

// Helper functions for dummy data
const findTeacher = (username, password) => {
  return dummyTeachers.find(
    (teacher) => teacher.username === username && teacher.password === password
  );
};

const findStudent = (username, password) => {
  return dummyStudents.find(
    (student) => student.username === username && student.password === password
  );
};

// Helper function to encode string to base64
const encodeToBase64 = (str) => {
  if (typeof btoa === 'function') {
    return btoa(str);
  } else if (typeof Buffer === 'function') {
    return Buffer.from(str, 'utf8').toString('base64');
  }
  throw new Error('No available method for base64 encoding');
};

/**
 * Teacher login API call
 * @param {string} username - Teacher's username
 * @param {string} password - Teacher's password
 * @param {string} deviceToken - Firebase device token
 * @returns {Promise<Object>} - User data or null if login fails
 */
export const teacherLogin = async (username, password, deviceToken) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  if (USE_DUMMY_DATA) {
    const teacher = findTeacher(username, password);

    if (teacher) {
      return teacher;
    } else {
      return null;
    }
  } else {
    try {
      // Get device information
      const deviceInfo = await getLoginDeviceInfo();
      console.log('🔍 AUTH DEBUG: Device info collected:', deviceInfo);

      // Use the API for real authentication
      console.log('🔍 AUTH DEBUG: Raw device token:', deviceToken);
      console.log('🔍 AUTH DEBUG: Device token type:', typeof deviceToken);
      console.log(
        '🔍 AUTH DEBUG: Device token length:',
        deviceToken?.length || 0
      );

      const encodedToken = deviceToken ? encodeToBase64(deviceToken) : '';
      console.log('🔍 AUTH DEBUG: Encoded token:', encodedToken);
      console.log('🔍 AUTH DEBUG: Encoded token length:', encodedToken.length);

      const apiUrl = buildApiUrl(Config.API_ENDPOINTS.CHECK_STAFF_CREDENTIALS, {
        username,
        password,
        deviceType: deviceInfo.deviceType,
        deviceToken: encodedToken,
        deviceName: deviceInfo.deviceName,
        deviceModel: deviceInfo.deviceModel,
        deviceBrand: deviceInfo.deviceBrand,
        platform: deviceInfo.platform,
        osVersion: deviceInfo.osVersion,
        appVersion: deviceInfo.appVersion,
        isEmulator: deviceInfo.isEmulator,
      });

      console.log('🔍 AUTH DEBUG: API URL:', apiUrl);

      // Add timeout and better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        Config.NETWORK.TIMEOUT
      );

      const response = await fetch(apiUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (response.status === 200 || response.status === 201) {
        const data = await response.json();

        return {
          ...data,
          userType: 'teacher',
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('❌ TEACHER LOGIN ERROR:', error);
      console.error('🔍 Error message:', error.message);
      console.error('📊 Error code:', error.code);
      console.error('🌐 Network error:', error.name);
      console.error('📱 Device info available:', !!deviceInfo);
      console.error('🔑 Device token available:', !!deviceToken);
      console.error('🔗 API URL:', apiUrl);

      // Return error details for debugging
      return {
        error: true,
        errorType: error.name || 'NetworkError',
        errorMessage: error.message || 'Unknown error',
        errorCode: error.code,
        timestamp: new Date().toISOString(),
      };
    }
  }
};

/**
 * Student login API call
 * @param {string} username - Student's username
 * @param {string} password - Student's password
 * @param {string} deviceToken - Firebase device token
 * @returns {Promise<Object>} - User data or null if login fails
 */
export const studentLogin = async (username, password, deviceToken) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  if (USE_DUMMY_DATA) {
    const student = findStudent(username, password);

    if (student) {
      return student;
    } else {
      return null;
    }
  } else {
    try {
      // Get device information
      const deviceInfo = await getLoginDeviceInfo();
      console.log('🔍 STUDENT AUTH DEBUG: Device info collected:', deviceInfo);

      // Use the API for real authentication
      console.log('🔍 STUDENT AUTH DEBUG: Raw device token:', deviceToken);
      console.log(
        '🔍 STUDENT AUTH DEBUG: Device token type:',
        typeof deviceToken
      );
      console.log(
        '🔍 STUDENT AUTH DEBUG: Device token length:',
        deviceToken?.length || 0
      );

      const encodedToken = deviceToken ? encodeToBase64(deviceToken) : '';
      console.log('🔍 STUDENT AUTH DEBUG: Encoded token:', encodedToken);
      console.log(
        '🔍 STUDENT AUTH DEBUG: Encoded token length:',
        encodedToken.length
      );

      const apiUrl = buildApiUrl(
        Config.API_ENDPOINTS.CHECK_STUDENT_CREDENTIALS,
        {
          username,
          password,
          deviceType: deviceInfo.deviceType,
          deviceToken: encodedToken,
          deviceName: deviceInfo.deviceName,
          deviceModel: deviceInfo.deviceModel,
          deviceBrand: deviceInfo.deviceBrand,
          platform: deviceInfo.platform,
          osVersion: deviceInfo.osVersion,
          appVersion: deviceInfo.appVersion,
          isEmulator: deviceInfo.isEmulator,
        }
      );

      console.log('🔍 STUDENT AUTH DEBUG: API URL:', apiUrl);

      // Add timeout and better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        Config.NETWORK.TIMEOUT
      );

      const response = await fetch(apiUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);
      if (response.status === 200 || response.status === 201) {
        const data = await response.json();
        if (data !== 0) {
          return {
            ...data,
            userType: 'student',
          };
        }
      } else {
        return null;
      }
    } catch (error) {
      console.error('❌ STUDENT LOGIN ERROR:', error);
      console.error('🔍 Error message:', error.message);
      console.error('📊 Error code:', error.code);
      console.error('🌐 Network error:', error.name);
      console.error('📱 Device info available:', !!deviceInfo);
      console.error('🔑 Device token available:', !!deviceToken);
      console.error('🔗 API URL:', apiUrl);

      // Return error details for debugging
      return {
        error: true,
        errorType: error.name || 'NetworkError',
        errorMessage: error.message || 'Unknown error',
        errorCode: error.code,
        timestamp: new Date().toISOString(),
      };
    }
  }
};

/**
 * Save user data to AsyncStorage
 * @param {Object} userData - User data to save
 * @returns {Promise<boolean>} - Success status
 */
export const saveUserData = async (userData, AsyncStorage) => {
  try {
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
    return true;
  } catch (error) {
    return false;
  }
};
