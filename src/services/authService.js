/**
 * Authentication Service
 * Uses dummy data for development and testing
 */

import { findTeacher, findStudent } from '../data/dummyUsers';

// Flag to toggle between dummy data and real API
const USE_DUMMY_DATA = false;

// Base API URL - replace with your actual API endpoint if not using dummy data
const BASE_URL = 'https://sis.bfi.edu.mm/mobile-api';

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
    console.log('Using dummy data for teacher login');
    const teacher = findTeacher(username, password);

    if (teacher) {
      console.log('Teacher login successful:', teacher.name);
      return teacher;
    } else {
      console.error('Teacher login failed: Invalid credentials');
      return null;
    }
  } else {
    try {
      // Use the API for real authentication
      const encodedToken = deviceToken ? encodeToBase64(deviceToken) : '';
      const apiUrl = `${BASE_URL}/check-staff-credentials?username=${username}&password=${password}&deviceType=ios&deviceToken=${encodedToken}`;

      const response = await fetch(apiUrl);
      console.log('Teacher login response:', response);

      if (response.status === 200 || response.status === 201) {
        const data = await response.json();
        return {
          ...data,
          userType: 'teacher',
        };
      } else {
        console.error('Teacher login failed with status:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Teacher login error:', error);
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
    console.log('Using dummy data for student login');
    const student = findStudent(username, password);

    if (student) {
      console.log('Student login successful:', student.name);
      return student;
    } else {
      console.error('Student login failed: Invalid credentials');
      return null;
    }
  } else {
    try {
      // Use the API for real authentication
      const encodedToken = deviceToken ? encodeToBase64(deviceToken) : '';
      const apiUrl = `${BASE_URL}/check-student-credentials?username=${username}&password=${password}&deviceType=ios&deviceToken=${encodedToken}`;

      const response = await fetch(apiUrl);
      console.log(response.status);
      if (response.status === 200 || response.status === 201) {
        const data = await response.json();
        return {
          ...data,
          userType: 'student',
        };
      } else {
        console.error('Student login failed with status:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Student login error:', error);
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
    console.log('User data saved to AsyncStorage');
    return true;
  } catch (error) {
    console.error('Error saving user data:', error);
    return false;
  }
};
