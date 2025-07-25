/**
 * Homescreen Diagnostics Utility
 * Provides diagnostic functions to help troubleshoot homescreen navigation issues
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { validateAndSanitizeAllData } from './dataValidation';

/**
 * Run comprehensive diagnostics for homescreen navigation issues
 * @returns {Promise<Object>} - Diagnostic results
 */
export const runHomescreenDiagnostics = async () => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    asyncStorage: {
      accessible: false,
      userData: { exists: false, valid: false, error: null },
      studentAccounts: { exists: false, valid: false, count: 0, error: null },
      selectedStudent: { exists: false, valid: false, error: null }
    },
    dataValidation: null,
    recommendations: []
  };

  console.log('🔍 DIAGNOSTICS: Starting homescreen navigation diagnostics...');

  try {
    // Test AsyncStorage accessibility
    await AsyncStorage.setItem('diagnostics_test', 'test');
    await AsyncStorage.removeItem('diagnostics_test');
    diagnostics.asyncStorage.accessible = true;
    console.log('✅ DIAGNOSTICS: AsyncStorage is accessible');
  } catch (error) {
    console.error('❌ DIAGNOSTICS: AsyncStorage is not accessible:', error);
    diagnostics.recommendations.push('AsyncStorage is not accessible - this is a critical issue that prevents the app from storing user data');
    return diagnostics;
  }

  // Check userData
  try {
    const userDataStr = await AsyncStorage.getItem('userData');
    diagnostics.asyncStorage.userData.exists = !!userDataStr;
    
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        diagnostics.asyncStorage.userData.valid = !!(userData && userData.userType && userData.name);
        
        if (!diagnostics.asyncStorage.userData.valid) {
          diagnostics.recommendations.push('User data exists but is invalid - missing required fields like userType or name');
        }
      } catch (parseError) {
        diagnostics.asyncStorage.userData.error = parseError.message;
        diagnostics.recommendations.push('User data exists but contains invalid JSON - data corruption detected');
      }
    }
  } catch (error) {
    diagnostics.asyncStorage.userData.error = error.message;
    diagnostics.recommendations.push('Unable to read user data from storage');
  }

  // Check studentAccounts
  try {
    const studentAccountsStr = await AsyncStorage.getItem('studentAccounts');
    diagnostics.asyncStorage.studentAccounts.exists = !!studentAccountsStr;
    
    if (studentAccountsStr) {
      try {
        const studentAccounts = JSON.parse(studentAccountsStr);
        if (Array.isArray(studentAccounts)) {
          diagnostics.asyncStorage.studentAccounts.count = studentAccounts.length;
          diagnostics.asyncStorage.studentAccounts.valid = studentAccounts.every(
            student => student && student.name && student.authCode
          );
          
          if (!diagnostics.asyncStorage.studentAccounts.valid) {
            diagnostics.recommendations.push('Some student accounts are missing required fields (name or authCode)');
          }
        } else {
          diagnostics.recommendations.push('Student accounts data is not an array - data corruption detected');
        }
      } catch (parseError) {
        diagnostics.asyncStorage.studentAccounts.error = parseError.message;
        diagnostics.recommendations.push('Student accounts data contains invalid JSON - data corruption detected');
      }
    }
  } catch (error) {
    diagnostics.asyncStorage.studentAccounts.error = error.message;
    diagnostics.recommendations.push('Unable to read student accounts from storage');
  }

  // Check selectedStudent
  try {
    const selectedStudentStr = await AsyncStorage.getItem('selectedStudent');
    diagnostics.asyncStorage.selectedStudent.exists = !!selectedStudentStr;
    
    if (selectedStudentStr) {
      try {
        const selectedStudent = JSON.parse(selectedStudentStr);
        diagnostics.asyncStorage.selectedStudent.valid = !!(selectedStudent && selectedStudent.name && selectedStudent.authCode);
        
        if (!diagnostics.asyncStorage.selectedStudent.valid) {
          diagnostics.recommendations.push('Selected student data is invalid - missing required fields');
        }
      } catch (parseError) {
        diagnostics.asyncStorage.selectedStudent.error = parseError.message;
        diagnostics.recommendations.push('Selected student data contains invalid JSON - data corruption detected');
      }
    }
  } catch (error) {
    diagnostics.asyncStorage.selectedStudent.error = error.message;
    diagnostics.recommendations.push('Unable to read selected student from storage');
  }

  // Run data validation
  try {
    diagnostics.dataValidation = await validateAndSanitizeAllData();
    console.log('✅ DIAGNOSTICS: Data validation completed');
  } catch (error) {
    console.error('❌ DIAGNOSTICS: Data validation failed:', error);
    diagnostics.recommendations.push('Data validation utility failed - this indicates a serious issue');
  }

  // Generate additional recommendations based on findings
  if (!diagnostics.asyncStorage.userData.exists && !diagnostics.asyncStorage.studentAccounts.exists) {
    diagnostics.recommendations.push('No user data found - user needs to log in or add student accounts');
  }

  if (diagnostics.asyncStorage.userData.exists && !diagnostics.asyncStorage.userData.valid) {
    diagnostics.recommendations.push('Clear corrupted user data and ask user to log in again');
  }

  if (diagnostics.asyncStorage.studentAccounts.exists && !diagnostics.asyncStorage.studentAccounts.valid) {
    diagnostics.recommendations.push('Clean up invalid student accounts or ask user to re-add students');
  }

  console.log('📊 DIAGNOSTICS: Homescreen diagnostics completed');
  console.log('📋 DIAGNOSTICS: Recommendations:', diagnostics.recommendations);

  return diagnostics;
};

/**
 * Generate user-friendly error message based on diagnostic results
 * @param {Object} diagnostics - Results from runHomescreenDiagnostics
 * @returns {string} - User-friendly error message
 */
export const generateUserFriendlyErrorMessage = (diagnostics) => {
  if (!diagnostics.asyncStorage.accessible) {
    return 'The app is unable to access device storage. Please restart the app and try again.';
  }

  if (!diagnostics.asyncStorage.userData.exists && !diagnostics.asyncStorage.studentAccounts.exists) {
    return 'No user accounts found. Please log in as a teacher/student or add a student account through the parent section.';
  }

  if (diagnostics.asyncStorage.userData.error || diagnostics.asyncStorage.studentAccounts.error) {
    return 'Your stored account data appears to be corrupted. Please log in again or re-add your student accounts.';
  }

  if (diagnostics.asyncStorage.userData.exists && !diagnostics.asyncStorage.userData.valid) {
    return 'Your login data is incomplete. Please log in again to continue.';
  }

  return 'An unexpected error occurred. Please restart the app and try again.';
};

/**
 * Clear all user data (useful for troubleshooting)
 * @returns {Promise<boolean>} - Success status
 */
export const clearAllUserData = async () => {
  try {
    console.log('🧹 DIAGNOSTICS: Clearing all user data...');
    
    const keysToRemove = [
      'userData',
      'studentAccounts', 
      'selectedStudent',
      'calendarUserData',
      'teacherCalendarData',
      'notificationHistory'
    ];
    
    await AsyncStorage.multiRemove(keysToRemove);
    console.log('✅ DIAGNOSTICS: All user data cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ DIAGNOSTICS: Failed to clear user data:', error);
    return false;
  }
};

/**
 * Log diagnostic information to console (for debugging)
 * @param {Object} diagnostics - Results from runHomescreenDiagnostics
 */
export const logDiagnostics = (diagnostics) => {
  console.log('\n🔍 HOMESCREEN DIAGNOSTICS REPORT');
  console.log('================================');
  console.log('Timestamp:', diagnostics.timestamp);
  console.log('AsyncStorage Accessible:', diagnostics.asyncStorage.accessible);
  console.log('User Data:', diagnostics.asyncStorage.userData);
  console.log('Student Accounts:', diagnostics.asyncStorage.studentAccounts);
  console.log('Selected Student:', diagnostics.asyncStorage.selectedStudent);
  console.log('Data Validation Results:', diagnostics.dataValidation);
  console.log('Recommendations:');
  diagnostics.recommendations.forEach((rec, index) => {
    console.log(`  ${index + 1}. ${rec}`);
  });
  console.log('================================\n');
};
