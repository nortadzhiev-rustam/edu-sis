/**
 * Authentication Service
 * Handles all API calls related to authentication
 */

import { Platform } from 'expo-modules-core';

// Base API URL - replace with your actual API endpoint
const BASE_URL = 'https://sis.bfi.edu.mm/mobile_api';

/**
 * Teacher login API call
 * @param {string} username - Teacher's username
 * @param {string} password - Teacher's password
 * @param {string} deviceToken - Firebase device token
 * @returns {Promise<Object>} - User data or null if login fails
 */
export const teacherLogin = async (username, password, deviceToken) => {
  try {
    // Encode device token to base64
    const encodedToken = deviceToken ? btoa(deviceToken) : '';

    const apiUrl = `${BASE_URL}/check-staff-credentials?username=${username}&password=${password}&deviceType=${Platform.OS}&deviceToken=${encodedToken}`;

    const response = await fetch(apiUrl);
    console.log('Teacher login response:', response);

    if (response.status === 200 || response.status === 201) {
      const data = await response.json();
      return {
        ...data,
        userType: 'teacher', // Add user type to distinguish in the app
      };
    } else {
      console.error('Teacher login failed with status:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Teacher login error:', error);
    return null;
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
  try {
    // Encode device token to base64
    const encodedToken = deviceToken ? btoa(deviceToken) : '';

    const apiUrl = `${BASE_URL}/check-student-credentials?username=${username}&password=${password}&deviceType=ios&deviceToken=${encodedToken}`;

    const response = await fetch(apiUrl);

    if (response.status === 200 || response.status === 201) {
      const data = await response.json();
      return {
        ...data,
        userType: 'student', // Add user type to distinguish in the app
      };
    } else {
      console.error('Student login failed with status:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Student login error:', error);
    return null;
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
    console.log('User data saved to AsyncStorage');
    return true;
  } catch (error) {
    console.error('Error saving user data:', error);
    return false;
  }
};
