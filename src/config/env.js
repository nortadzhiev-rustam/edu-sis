// Environment configuration
// Centralized configuration for the entire application

// API Configuration
export const Config = {
  // Base API Configuration
  API_BASE_URL: 'https://sis.bfi.edu.mm/mobile-api',
  API_DOMAIN: 'sis.bfi.edu.mm',

  // API Endpoints
  API_ENDPOINTS: {
    CHECK_STAFF_CREDENTIALS: '/check-staff-credentials',
    CHECK_STUDENT_CREDENTIALS: '/check-student-credentials',
    GET_STUDENT_TIMETABLE: '/get-student-timetable2',
    GET_TEACHER_TIMETABLE: '/get-teacher-timetable-data/',
    GET_STUDENT_GRADES: '/get-student-grades',
    GET_STUDENT_ATTENDANCE: '/get-student-attendance-data',
    GET_STUDENT_HOMEWORK: '/get-student-homework-data',
    GET_STUDENT_BPS: '/get-student-bps-data',
    GET_TEACHER_BPS: '/get-teacher-bps-data/',
    GET_ATTENDANCE_DETAILS: '/get-attendance-details/',
    GET_CLASS_STUDENTS: '/get-class-students/',
    TAKE_ATTENDANCE: '/attendance/api-store',
    UPDATE_ATTENDANCE: '/update-attendance/',
    STORE_BPS: '/discipline/store-bps',
    DELETE_BPS: '/discipline/delete-bps',
    GET_TEACHER_CLASSES: '/teacher/attendance/classes',
    // Notification API Endpoints
    GET_NOTIFICATIONS_LEGACY: '/get-notifications/',
    GET_NOTIFICATIONS: '/notifications/list',
    MARK_NOTIFICATION_READ: '/notifications/mark-read',
    MARK_ALL_NOTIFICATIONS_READ: '/notifications/mark-all-read',
    GET_NOTIFICATION_CATEGORIES: '/notifications/categories',
    SEND_NOTIFICATION: '/notifications/send',
    GET_NOTIFICATION_STATISTICS: '/notifications/statistics',

    // Real-time Notification Endpoints
    SEND_BPS_NOTIFICATION: '/notifications/realtime/bps',
    SEND_ATTENDANCE_REMINDER: '/notifications/realtime/attendance-reminder',
    SEND_RICH_NOTIFICATION: '/notifications/realtime/rich',
    SEND_STAFF_NOTIFICATION: '/notifications/realtime/staff',

    // Homeroom API Endpoints
    GET_HOMEROOM_CLASSROOMS: '/homeroom/classrooms',
    GET_HOMEROOM_ATTENDANCE: '/homeroom/attendance',
    GET_HOMEROOM_STUDENT_PROFILE: '/homeroom/student-profile',
    GET_HOMEROOM_STUDENTS: '/homeroom/students',
    GET_HOMEROOM_DISCIPLINE: '/homeroom/discipline',
  },

  // Web Resources
  WEB_ENDPOINTS: {
    CALENDAR: '/calendar',
    CONTACTS: '/contacts',
    MESSAGES: '/messages',
    ABOUT: '/about',
    FAQ: '/faq',
  },

  // App Configuration
  APP: {
    NAME: 'EduSIS',
    VERSION: '1.0.0',
    BUNDLE_ID: 'com.edunovaasia.edusis',
  },

  // Development Configuration
  DEV: {
    USE_DUMMY_DATA: false,
    ENABLE_LOGGING: false,
  },

  // Network Configuration
  NETWORK: {
    TIMEOUT: 10000,
    ENABLE_CLEARTEXT_TRAFFIC: true,
  },

  // Device Configuration
  DEVICE: {
    DEFAULT_TYPE: 'ios',
  },
};

// Helper functions to build URLs
export const buildApiUrl = (endpoint, params = {}) => {
  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  // Ensure base URL ends with slash
  const baseUrl = Config.API_BASE_URL.endsWith('/')
    ? Config.API_BASE_URL
    : Config.API_BASE_URL + '/';

  // Construct the full URL
  const fullUrl = baseUrl + cleanEndpoint;
  const url = new URL(fullUrl);

  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });

  return url.toString();
};

export const buildWebUrl = (endpoint, params = {}) => {
  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  // Ensure base URL ends with slash
  const baseUrl = Config.API_BASE_URL.endsWith('/')
    ? Config.API_BASE_URL
    : Config.API_BASE_URL + '/';

  // Construct the full URL
  const fullUrl = baseUrl + cleanEndpoint;
  const url = new URL(fullUrl);

  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });

  return url.toString();
};

// Export individual configurations for backward compatibility
export const API_BASE_URL_CONFIG = Config.API_BASE_URL;
export const USE_DUMMY_DATA_CONFIG = Config.DEV.USE_DUMMY_DATA;

export default Config;
