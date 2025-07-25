/**
 * Data Validation Utilities
 * Provides functions to validate and sanitize user data from AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Validate user data structure
 * @param {any} userData - User data to validate
 * @returns {boolean} - True if valid user data
 */
export const isValidUserData = (userData) => {
  if (!userData || typeof userData !== 'object') {
    return false;
  }

  // Check for required fields
  const requiredFields = ['userType', 'name'];
  const hasRequiredFields = requiredFields.every(field => 
    userData[field] && typeof userData[field] === 'string'
  );

  if (!hasRequiredFields) {
    return false;
  }

  // Validate userType
  const validUserTypes = ['teacher', 'student', 'parent', 'staff'];
  if (!validUserTypes.includes(userData.userType)) {
    return false;
  }

  return true;
};

/**
 * Validate student account data
 * @param {any} studentData - Student data to validate
 * @returns {boolean} - True if valid student data
 */
export const isValidStudentData = (studentData) => {
  if (!studentData || typeof studentData !== 'object') {
    return false;
  }

  // Check for required fields
  const requiredFields = ['name', 'authCode'];
  const hasRequiredFields = requiredFields.every(field => 
    studentData[field] && typeof studentData[field] === 'string'
  );

  return hasRequiredFields;
};

/**
 * Safely parse JSON data from AsyncStorage
 * @param {string} jsonString - JSON string to parse
 * @param {any} fallback - Fallback value if parsing fails
 * @returns {any} - Parsed data or fallback
 */
export const safeJsonParse = (jsonString, fallback = null) => {
  try {
    if (!jsonString || typeof jsonString !== 'string') {
      return fallback;
    }
    
    const parsed = JSON.parse(jsonString);
    return parsed;
  } catch (error) {
    console.error('❌ VALIDATION: JSON parse error:', error);
    return fallback;
  }
};

/**
 * Get and validate user data from AsyncStorage
 * @returns {Promise<Object|null>} - Valid user data or null
 */
export const getValidatedUserData = async () => {
  try {
    const userDataStr = await AsyncStorage.getItem('userData');
    if (!userDataStr) {
      return null;
    }

    const userData = safeJsonParse(userDataStr);
    if (!isValidUserData(userData)) {
      console.warn('⚠️ VALIDATION: Invalid user data found, clearing...');
      await AsyncStorage.removeItem('userData');
      return null;
    }

    return userData;
  } catch (error) {
    console.error('❌ VALIDATION: Error getting validated user data:', error);
    return null;
  }
};

/**
 * Get and validate student accounts from AsyncStorage
 * @returns {Promise<Array>} - Array of valid student accounts
 */
export const getValidatedStudentAccounts = async () => {
  try {
    const studentAccountsStr = await AsyncStorage.getItem('studentAccounts');
    if (!studentAccountsStr) {
      return [];
    }

    const studentAccounts = safeJsonParse(studentAccountsStr, []);
    if (!Array.isArray(studentAccounts)) {
      console.warn('⚠️ VALIDATION: Student accounts is not an array, clearing...');
      await AsyncStorage.removeItem('studentAccounts');
      return [];
    }

    // Filter out invalid student accounts
    const validStudents = studentAccounts.filter(student => {
      const isValid = isValidStudentData(student);
      if (!isValid) {
        console.warn('⚠️ VALIDATION: Invalid student account found:', student);
      }
      return isValid;
    });

    // If some students were invalid, update the storage with only valid ones
    if (validStudents.length !== studentAccounts.length) {
      console.log('🔧 VALIDATION: Updating student accounts with valid data only');
      await AsyncStorage.setItem('studentAccounts', JSON.stringify(validStudents));
    }

    return validStudents;
  } catch (error) {
    console.error('❌ VALIDATION: Error getting validated student accounts:', error);
    return [];
  }
};

/**
 * Clear corrupted data from AsyncStorage
 * @param {Array<string>} keys - Keys to clear
 */
export const clearCorruptedData = async (keys = []) => {
  try {
    const defaultKeys = ['userData', 'studentAccounts', 'selectedStudent'];
    const keysToRemove = keys.length > 0 ? keys : defaultKeys;
    
    console.log('🧹 VALIDATION: Clearing corrupted data keys:', keysToRemove);
    await AsyncStorage.multiRemove(keysToRemove);
    
    console.log('✅ VALIDATION: Corrupted data cleared successfully');
  } catch (error) {
    console.error('❌ VALIDATION: Error clearing corrupted data:', error);
  }
};

/**
 * Validate and sanitize all user data in AsyncStorage
 * @returns {Promise<Object>} - Summary of validation results
 */
export const validateAndSanitizeAllData = async () => {
  const results = {
    userData: { valid: false, cleared: false },
    studentAccounts: { valid: false, cleared: false, count: 0 },
    selectedStudent: { valid: false, cleared: false }
  };

  try {
    // Validate userData
    const userData = await getValidatedUserData();
    results.userData.valid = !!userData;

    // Validate studentAccounts
    const studentAccounts = await getValidatedStudentAccounts();
    results.studentAccounts.valid = true;
    results.studentAccounts.count = studentAccounts.length;

    // Validate selectedStudent
    const selectedStudentStr = await AsyncStorage.getItem('selectedStudent');
    if (selectedStudentStr) {
      const selectedStudent = safeJsonParse(selectedStudentStr);
      if (isValidStudentData(selectedStudent)) {
        results.selectedStudent.valid = true;
      } else {
        console.warn('⚠️ VALIDATION: Invalid selected student, clearing...');
        await AsyncStorage.removeItem('selectedStudent');
        results.selectedStudent.cleared = true;
      }
    }

    console.log('📊 VALIDATION: Data validation summary:', results);
    return results;
  } catch (error) {
    console.error('❌ VALIDATION: Error during data validation:', error);
    return results;
  }
};
