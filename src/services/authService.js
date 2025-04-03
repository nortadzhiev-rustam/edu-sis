/**
 * Authentication Service
 * Handles all API calls related to authentication
 */

// Base API URL - replace with your actual API endpoint
const BASE_URL = 'https://sis.bfi.edu.mm/mobile_api';

// Вспомогательная функция для кодирования строки в base64
const encodeToBase64 = (str) => {
  if (typeof btoa === 'function') {
    return btoa(str);
  } else if (typeof Buffer === 'function') {
    return Buffer.from(str, 'utf8').toString('base64');
  }
  throw new Error('Нет доступного метода для кодирования в base64');
};

/**
 * Teacher login API call
 * @param {string} username - Teacher's username
 * @param {string} password - Teacher's password
 * @param {string} deviceToken - Firebase device token
 * @returns {Promise<Object>} - User data or null if login fails
 */
export const teacherLogin = async (username, password, deviceToken) => {
  try {
    // Используем вспомогательную функцию для кодирования deviceToken
    const encodedToken = deviceToken ? encodeToBase64(deviceToken) : '';

    const apiUrl = `${BASE_URL}/check-staff-credentials/?username=${username}&password=${password}&deviceType=ios&deviceToken=${encodedToken}`;

    const response = await fetch(apiUrl);
    console.log('Teacher login response:', response);

    if (response.status === 200 || response.status === 201) {
      const data = await response.json();
      return {
        ...data,
        userType: 'teacher', // Добавляем тип пользователя для различения в приложении
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
    const encodedToken = deviceToken ? encodeToBase64(deviceToken) : '';

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
