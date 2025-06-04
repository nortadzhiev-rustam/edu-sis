/**
 * Authentication Service
 * Uses dummy data for development and testing
 */

import { findTeacher, findStudent } from '../data/dummyUsers';
import { Config, buildApiUrl } from '../config/env';

// Flag to toggle between dummy data and real API
const USE_DUMMY_DATA = Config.DEV.USE_DUMMY_DATA;

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
      // Use the API for real authentication
      const encodedToken = deviceToken ? encodeToBase64(deviceToken) : '';
      const apiUrl = buildApiUrl(Config.API_ENDPOINTS.CHECK_STAFF_CREDENTIALS, {
        username,
        password,
        deviceType: Config.DEVICE.DEFAULT_TYPE,
        deviceToken: encodedToken,
      });

      const response = await fetch(apiUrl);

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
      return null;
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
      // Use the API for real authentication
      const encodedToken = deviceToken ? encodeToBase64(deviceToken) : '';
      const apiUrl = buildApiUrl(
        Config.API_ENDPOINTS.CHECK_STUDENT_CREDENTIALS,
        {
          username,
          password,
          deviceType: Config.DEVICE.DEFAULT_TYPE,
          deviceToken: encodedToken,
        }
      );

      const response = await fetch(apiUrl);
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
      return null;
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
