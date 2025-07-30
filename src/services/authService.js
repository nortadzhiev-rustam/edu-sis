/**
 * Authentication Service
 * Uses dummy data for development and testing
 */

import { Config, buildApiUrl } from '../config/env';
import { getLoginDeviceInfo } from '../utils/deviceInfo';
import SchoolConfigService from './schoolConfigService';

// Flag to toggle between dummy data and real API
const USE_DUMMY_DATA = Config.DEV.USE_DUMMY_DATA;

// Demo mode credentials
const DEMO_CREDENTIALS = {
  TEACHER: {
    username: 'demo_teacher',
    password: 'demo2025',
  },
  STUDENT: {
    username: 'demo_student',
    password: 'demo2025',
  },
  PARENT: {
    username: 'demo_parent',
    password: 'demo2025',
  },
};

// Demo user data with comprehensive information
const demoTeacherData = {
  id: 'DEMO_T001',
  username: 'demo_teacher',
  name: 'Sarah Johnson',
  email: 'sarah.johnson@demo.edu',
  authCode: 'DEMO_AUTH_T001',
  userType: 'teacher',
  is_teacher: true,
  is_homeroom: true,
  photo: null,
  role: 'Senior Teacher',
  branches: [
    {
      branch_id: 1,
      branch_name: 'Main Campus',
      branch_code: 'MC',
    },
    {
      branch_id: 2,
      branch_name: 'Secondary Campus',
      branch_code: 'SC',
    },
  ],
  permissions: {
    can_take_attendance: true,
    can_manage_bps: true,
    can_create_homework: true,
    can_delete_bps: true,
    can_view_all_students: true,
    can_send_notifications: true,
  },
  subjects: ['Mathematics', 'Physics'],
  homeroom_class: 'Grade 10A',
  roles: [
    {
      role_id: 1,
      role_name: 'Senior Teacher',
      branch_id: 1,
      branch_name: 'Main Campus',
    },
    {
      role_id: 2,
      role_name: 'Mathematics Department Head',
      branch_id: 1,
      branch_name: 'Main Campus',
    },
    {
      role_id: 3,
      role_name: 'Subject Teacher',
      branch_id: 2,
      branch_name: 'Secondary Campus',
    },
  ],
  demo_mode: true,
};

const demoStudentData = {
  id: 'DEMO_S001',
  username: 'demo_student',
  name: 'Alex Chen',
  email: 'alex.chen@demo.edu',
  authCode: 'DEMO_AUTH_S001',
  userType: 'student',
  is_student: true,
  photo: null,
  student_id: 'STU2024001',
  grade: '10',
  class: 'Grade 10A',
  branch: {
    branch_id: 1,
    branch_name: 'Main Campus',
    branch_code: 'MC',
  },
  homeroom_teacher: 'Sarah Johnson',
  demo_mode: true,
};

const demoParentData = {
  id: 'DEMO_P001',
  username: 'demo_parent',
  name: 'Michael Chen',
  email: 'michael.chen@demo.com',
  authCode: 'DEMO_AUTH_P001',
  userType: 'parent',
  is_parent: true,
  photo: null,
  children: [
    {
      id: 'DEMO_S001',
      name: 'Alex Chen',
      student_id: 'STU2024001',
      grade: '10',
      class: 'Grade 10A',
      branch_name: 'Main Campus',
      authCode: 'DEMO_AUTH_S001',
    },
  ],
  demo_mode: true,
};

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

// Demo mode detection functions
const isDemoCredentials = (username, password, userType) => {
  const demoCredential = DEMO_CREDENTIALS[userType.toUpperCase()];
  return (
    demoCredential &&
    username === demoCredential.username &&
    password === demoCredential.password
  );
};

const getDemoUserData = (userType) => {
  switch (userType.toLowerCase()) {
    case 'teacher':
      return { ...demoTeacherData };
    case 'student':
      return { ...demoStudentData };
    case 'parent':
      return { ...demoParentData };
    default:
      return null;
  }
};

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

  // Check for demo mode credentials first
  if (isDemoCredentials(username, password, 'teacher')) {
    console.log('🎭 DEMO MODE: Teacher login detected');

    // Set up demo school configuration
    try {
      const schoolConfig = await SchoolConfigService.detectSchoolFromLogin(
        username,
        'teacher'
      );
      await SchoolConfigService.saveCurrentSchoolConfig(schoolConfig);
      console.log(
        '🏫 DEMO MODE: School configuration saved:',
        schoolConfig.name
      );
    } catch (schoolError) {
      console.error('❌ DEMO MODE: School detection error:', schoolError);
    }

    const demoData = getDemoUserData('teacher');
    return demoData;
  }

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
        '🔍 AUTH DEBUG: Device token constructor:',
        deviceToken?.constructor?.name
      );
      console.log(
        '🔍 AUTH DEBUG: Device token toString():',
        deviceToken?.toString()
      );
      console.log(
        '🔍 AUTH DEBUG: Device token length:',
        deviceToken?.length || 0
      );

      // Check if deviceToken is a Future or Promise
      if (
        deviceToken &&
        typeof deviceToken === 'object' &&
        deviceToken.constructor
      ) {
        console.error(
          '❌ AUTH ERROR: Device token appears to be an object/Future instead of string!'
        );
        console.error('🔍 Constructor name:', deviceToken.constructor.name);
        console.error('🔍 Object keys:', Object.keys(deviceToken));

        // If it's a Promise/Future, try to await it
        if (typeof deviceToken.then === 'function') {
          console.log('🔄 AUTH: Attempting to await the device token...');
          try {
            deviceToken = await deviceToken;
            console.log(
              '✅ AUTH: Successfully awaited device token:',
              deviceToken
            );
          } catch (awaitError) {
            console.error('❌ AUTH: Failed to await device token:', awaitError);
            deviceToken = ''; // Use empty string as fallback
          }
        }
      }

      // Final validation: ensure deviceToken is a string
      if (deviceToken && typeof deviceToken !== 'string') {
        console.error(
          '❌ AUTH ERROR: Device token is still not a string after processing!'
        );
        console.error('🔍 Final type:', typeof deviceToken);
        console.error('🔍 Final value:', deviceToken);
        deviceToken = String(deviceToken); // Force convert to string
        console.log('🔄 AUTH: Forced conversion to string:', deviceToken);
      }

      const encodedToken = deviceToken ? encodeToBase64(deviceToken) : '';
      console.log('🔍 AUTH DEBUG: Encoded token:', encodedToken);
      console.log('🔍 AUTH DEBUG: Encoded token length:', encodedToken.length);

      // Validate encoded token doesn't contain "Future" or "Instance"
      let finalEncodedToken = encodedToken;
      if (
        encodedToken.includes('Future') ||
        encodedToken.includes('Instance')
      ) {
        console.error(
          '❌ AUTH ERROR: Encoded token contains Future/Instance - this indicates the original token was not a string!'
        );
        console.error('🔍 Problematic encoded token:', encodedToken);
        // Use empty token as fallback and continue with login
        console.log('🔄 AUTH: Using empty token as fallback and continuing...');
        finalEncodedToken = '';
        console.log('🔄 AUTH: Proceeding with empty encoded token');
      }

      const apiUrl = buildApiUrl(Config.API_ENDPOINTS.CHECK_STAFF_CREDENTIALS, {
        username,
        password,
        deviceType: deviceInfo.deviceType,
        deviceToken: finalEncodedToken,
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

        // Debug: Log the actual API response
        console.log('🔍 TEACHER LOGIN API RESPONSE:', data);
        console.log('🔍 TEACHER LOGIN API RESPONSE TYPE:', typeof data);

        // Check if the API returned an error in the response body
        if (data === 0 || data === '0' || data === null || data === false) {
          console.log(
            '❌ TEACHER LOGIN: API returned invalid credentials (data is 0/null/false)'
          );
          return null;
        }

        // Check if the response has an error field
        if (data && data.error) {
          console.log(
            '❌ TEACHER LOGIN: API returned error in response body:',
            data.error
          );
          return null;
        }

        // Check if the response indicates invalid credentials
        if (
          data &&
          (data.message === 'Invalid credentials' || data.status === 'error')
        ) {
          console.log(
            '❌ TEACHER LOGIN: API returned invalid credentials message'
          );
          return null;
        }

        console.log('✅ TEACHER LOGIN: Valid credentials, detecting school...');

        // Detect and save school configuration
        try {
          const schoolConfig = await SchoolConfigService.detectSchoolFromLogin(
            username,
            'teacher',
            data // Pass the authentication response data
          );
          await SchoolConfigService.saveCurrentSchoolConfig(schoolConfig);
          console.log(
            '🏫 TEACHER LOGIN: School configuration saved:',
            schoolConfig.name
          );
        } catch (schoolError) {
          console.error(
            '❌ TEACHER LOGIN: School detection error:',
            schoolError
          );
          // Continue with login even if school detection fails
        }

        return {
          ...data,
          userType: 'teacher',
        };
      } else {
        console.log(
          '❌ TEACHER LOGIN: API returned non-200 status:',
          response.status
        );
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

  // Check for demo mode credentials first
  if (isDemoCredentials(username, password, 'student')) {
    console.log('🎭 DEMO MODE: Student login detected');

    // Set up demo school configuration
    try {
      const schoolConfig = await SchoolConfigService.detectSchoolFromLogin(
        username,
        'student'
      );
      await SchoolConfigService.saveCurrentSchoolConfig(schoolConfig);
      console.log(
        '🏫 DEMO MODE: School configuration saved:',
        schoolConfig.name
      );
    } catch (schoolError) {
      console.error('❌ DEMO MODE: School detection error:', schoolError);
    }

    const demoData = getDemoUserData('student');
    return demoData;
  }

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
        '🔍 STUDENT AUTH DEBUG: Device token constructor:',
        deviceToken?.constructor?.name
      );
      console.log(
        '🔍 STUDENT AUTH DEBUG: Device token toString():',
        deviceToken?.toString()
      );
      console.log(
        '🔍 STUDENT AUTH DEBUG: Device token length:',
        deviceToken?.length || 0
      );

      // Check if deviceToken is a Future or Promise
      if (
        deviceToken &&
        typeof deviceToken === 'object' &&
        deviceToken.constructor
      ) {
        console.error(
          '❌ STUDENT AUTH ERROR: Device token appears to be an object/Future instead of string!'
        );
        console.error('🔍 Constructor name:', deviceToken.constructor.name);
        console.error('🔍 Object keys:', Object.keys(deviceToken));

        // If it's a Promise/Future, try to await it
        if (typeof deviceToken.then === 'function') {
          console.log(
            '🔄 STUDENT AUTH: Attempting to await the device token...'
          );
          try {
            deviceToken = await deviceToken;
            console.log(
              '✅ STUDENT AUTH: Successfully awaited device token:',
              deviceToken
            );
          } catch (awaitError) {
            console.error(
              '❌ STUDENT AUTH: Failed to await device token:',
              awaitError
            );
            deviceToken = ''; // Use empty string as fallback
          }
        }
      }

      // Final validation: ensure deviceToken is a string
      if (deviceToken && typeof deviceToken !== 'string') {
        console.error(
          '❌ STUDENT AUTH ERROR: Device token is still not a string after processing!'
        );
        console.error('🔍 Final type:', typeof deviceToken);
        console.error('🔍 Final value:', deviceToken);
        deviceToken = String(deviceToken); // Force convert to string
        console.log(
          '🔄 STUDENT AUTH: Forced conversion to string:',
          deviceToken
        );
      }

      const encodedToken = deviceToken ? encodeToBase64(deviceToken) : '';
      console.log('🔍 STUDENT AUTH DEBUG: Encoded token:', encodedToken);
      console.log(
        '🔍 STUDENT AUTH DEBUG: Encoded token length:',
        encodedToken.length
      );

      // Validate encoded token doesn't contain "Future" or "Instance"
      let finalEncodedToken = encodedToken;
      if (
        encodedToken.includes('Future') ||
        encodedToken.includes('Instance')
      ) {
        console.error(
          '❌ STUDENT AUTH ERROR: Encoded token contains Future/Instance - this indicates the original token was not a string!'
        );
        console.error('🔍 Problematic encoded token:', encodedToken);
        console.log(
          '🔄 STUDENT AUTH: Using empty token as fallback and continuing...'
        );
        finalEncodedToken = '';
        console.log('🔄 STUDENT AUTH: Proceeding with empty encoded token');
      }

      const apiUrl = buildApiUrl(
        Config.API_ENDPOINTS.CHECK_STUDENT_CREDENTIALS,
        {
          username,
          password,
          deviceType: deviceInfo.deviceType,
          deviceToken: finalEncodedToken,
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

        // Debug: Log the actual API response
        console.log('🔍 STUDENT LOGIN API RESPONSE:', data);
        console.log('🔍 STUDENT LOGIN API RESPONSE TYPE:', typeof data);

        // Check if the API returned an error (0 means invalid credentials)
        if (data === 0 || data === '0' || data === null || data === false) {
          console.log(
            '❌ STUDENT LOGIN: API returned invalid credentials (data is 0/null/false)'
          );
          return null;
        }

        // Check if the response has an error field
        if (data && data.error) {
          console.log(
            '❌ STUDENT LOGIN: API returned error in response body:',
            data.error
          );
          return null;
        }

        // Check if the response indicates invalid credentials
        if (
          data &&
          (data.message === 'Invalid credentials' || data.status === 'error')
        ) {
          console.log(
            '❌ STUDENT LOGIN: API returned invalid credentials message'
          );
          return null;
        }

        console.log('✅ STUDENT LOGIN: Valid credentials, detecting school...');

        // Detect and save school configuration
        try {
          const schoolConfig = await SchoolConfigService.detectSchoolFromLogin(
            username,
            'student',
            data // Pass the authentication response data
          );
          await SchoolConfigService.saveCurrentSchoolConfig(schoolConfig);
          console.log(
            '🏫 STUDENT LOGIN: School configuration saved:',
            schoolConfig.name
          );
        } catch (schoolError) {
          console.error(
            '❌ STUDENT LOGIN: School detection error:',
            schoolError
          );
          // Continue with login even if school detection fails
        }

        return {
          ...data,
          userType: 'student',
        };
      } else {
        console.log(
          '❌ STUDENT LOGIN: API returned non-200 status:',
          response.status
        );
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
    const userDataString = JSON.stringify(userData);
    await AsyncStorage.setItem('userData', userDataString);
    console.log('✅ AUTH: userData saved to AsyncStorage:', {
      userType: userData.userType,
      username: userData.username,
      hasAuthCode: !!userData.authCode,
      dataLength: userDataString.length,
    });
    return true;
  } catch (error) {
    console.error('❌ AUTH: Failed to save userData:', error);
    return false;
  }
};

/**
 * Get demo mode credentials for display purposes
 * @returns {Object} Demo credentials object
 */
export const getDemoCredentials = () => {
  return {
    teacher: {
      username: DEMO_CREDENTIALS.TEACHER.username,
      password: DEMO_CREDENTIALS.TEACHER.password,
      description: 'Full teacher access with all features',
    },
    student: {
      username: DEMO_CREDENTIALS.STUDENT.username,
      password: DEMO_CREDENTIALS.STUDENT.password,
      description: 'Student view with grades, attendance, and homework',
    },
    parent: {
      username: DEMO_CREDENTIALS.PARENT.username,
      password: DEMO_CREDENTIALS.PARENT.password,
      description: 'Parent dashboard with child monitoring features',
    },
  };
};

/**
 * Check if user is in demo mode
 * @param {Object} userData - User data object
 * @returns {boolean} True if user is in demo mode
 */
export const isDemoMode = (userData) => {
  return userData && userData.demo_mode === true;
};
