/**
 * Health Service
 * Handles all health-related API calls and data management
 */

import { Config, buildApiUrl } from '../config/env';

// Flag to toggle between dummy data and real API
const USE_DUMMY_DATA = Config.DEV.USE_DUMMY_DATA;

/**
 * Helper function to make API requests with proper error handling
 */
const makeHealthApiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      timeout: Config.NETWORK.TIMEOUT,
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Health API request failed:', error);
    throw error;
  }
};

/**
 * Get student's own health records
 * @param {string} authCode - Student's authentication code
 * @returns {Promise<Object>} - Student health records
 */
export const getStudentHealthRecords = async (authCode) => {
  try {
    if (!authCode) {
      throw new Error('Authentication code is required');
    }

    // Check for demo mode
    if (authCode.startsWith('DEMO_AUTH_')) {
      console.log('🎭 DEMO MODE: Using demo student health records');
      return getDemoStudentHealthRecords();
    }

    if (USE_DUMMY_DATA) {
      return getDemoStudentHealthRecords();
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_STUDENT_HEALTH_RECORDS, {
      authCode,
    });

    return await makeHealthApiRequest(url);
  } catch (error) {
    console.error('Error fetching student health records:', error);
    throw error;
  }
};

/**
 * Get student's health information (medical conditions, allergies, etc.)
 * @param {string} authCode - Student's authentication code
 * @returns {Promise<Object>} - Student health information
 */
export const getStudentHealthInfo = async (authCode) => {
  try {
    if (!authCode) {
      throw new Error('Authentication code is required');
    }

    // Check for demo mode
    if (authCode.startsWith('DEMO_AUTH_')) {
      console.log('🎭 DEMO MODE: Using demo student health info');
      return getDemoStudentHealthInfo();
    }

    if (USE_DUMMY_DATA) {
      return getDemoStudentHealthInfo();
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_STUDENT_HEALTH_INFO, {
      authCode,
    });

    return await makeHealthApiRequest(url);
  } catch (error) {
    console.error('Error fetching student health info:', error);
    throw error;
  }
};

/**
 * Get teacher health data (role-based access)
 * @param {string} authCode - Staff authentication code
 * @returns {Promise<Object>} - Health data based on access level
 */
export const getTeacherHealthData = async (authCode) => {
  try {
    if (!authCode) {
      throw new Error('Authentication code is required');
    }

    // Check for demo mode
    if (authCode.startsWith('DEMO_AUTH_')) {
      console.log('🎭 DEMO MODE: Using demo teacher health data');
      return getDemoTeacherHealthData();
    }

    if (USE_DUMMY_DATA) {
      return getDemoTeacherHealthData();
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_TEACHER_HEALTH_DATA, {
      authCode,
    });

    return await makeHealthApiRequest(url);
  } catch (error) {
    console.error('Error fetching teacher health data:', error);
    throw error;
  }
};

/**
 * Create a new student health record (nurses only)
 * @param {string} authCode - Staff authentication code
 * @param {Object} recordData - Health record data
 * @returns {Promise<Object>} - Creation result
 */
export const createStudentHealthRecord = async (authCode, recordData) => {
  try {
    if (!authCode || !recordData) {
      throw new Error('Authentication code and record data are required');
    }

    // Validate required fields
    const requiredFields = ['student_id', 'date', 'time', 'reason'];
    for (const field of requiredFields) {
      if (!recordData[field]) {
        throw new Error(`${field} is required`);
      }
    }

    // Check for demo mode
    if (authCode.startsWith('DEMO_AUTH_')) {
      console.log('🎭 DEMO MODE: Simulating student health record creation');
      return getDemoCreateRecordResponse('student');
    }

    if (USE_DUMMY_DATA) {
      return getDemoCreateRecordResponse('student');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.CREATE_STUDENT_HEALTH_RECORD);

    return await makeHealthApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        authCode,
        ...recordData,
      }),
    });
  } catch (error) {
    console.error('Error creating student health record:', error);
    throw error;
  }
};

/**
 * Create a new staff health record (nurses only)
 * @param {string} authCode - Staff authentication code
 * @param {Object} recordData - Health record data
 * @returns {Promise<Object>} - Creation result
 */
export const createStaffHealthRecord = async (authCode, recordData) => {
  try {
    if (!authCode || !recordData) {
      throw new Error('Authentication code and record data are required');
    }

    // Validate required fields
    const requiredFields = ['user_id', 'date', 'time', 'reason'];
    for (const field of requiredFields) {
      if (!recordData[field]) {
        throw new Error(`${field} is required`);
      }
    }

    // Check for demo mode
    if (authCode.startsWith('DEMO_AUTH_')) {
      console.log('🎭 DEMO MODE: Simulating staff health record creation');
      return getDemoCreateRecordResponse('staff');
    }

    if (USE_DUMMY_DATA) {
      return getDemoCreateRecordResponse('staff');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.CREATE_STAFF_HEALTH_RECORD);

    return await makeHealthApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        authCode,
        ...recordData,
      }),
    });
  } catch (error) {
    console.error('Error creating staff health record:', error);
    throw error;
  }
};

/**
 * Create a new guest health record (nurses only)
 * @param {string} authCode - Staff authentication code
 * @param {Object} recordData - Health record data
 * @returns {Promise<Object>} - Creation result
 */
export const createGuestHealthRecord = async (authCode, recordData) => {
  try {
    if (!authCode || !recordData) {
      throw new Error('Authentication code and record data are required');
    }

    // Validate required fields
    const requiredFields = ['name', 'date', 'time', 'reason'];
    for (const field of requiredFields) {
      if (!recordData[field]) {
        throw new Error(`${field} is required`);
      }
    }

    // Check for demo mode
    if (authCode.startsWith('DEMO_AUTH_')) {
      console.log('🎭 DEMO MODE: Simulating guest health record creation');
      return getDemoCreateRecordResponse('guest');
    }

    if (USE_DUMMY_DATA) {
      return getDemoCreateRecordResponse('guest');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.CREATE_GUEST_HEALTH_RECORD);

    return await makeHealthApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        authCode,
        ...recordData,
      }),
    });
  } catch (error) {
    console.error('Error creating guest health record:', error);
    throw error;
  }
};

/**
 * Update student health information (nurses only)
 * @param {string} authCode - Staff authentication code
 * @param {number} studentId - Student ID
 * @param {Object} healthInfo - Health information data
 * @returns {Promise<Object>} - Update result
 */
export const updateStudentHealthInfo = async (
  authCode,
  studentId,
  healthInfo
) => {
  try {
    if (!authCode || !studentId || !healthInfo) {
      throw new Error(
        'Authentication code, student ID, and health info are required'
      );
    }

    // Check for demo mode
    if (authCode.startsWith('DEMO_AUTH_')) {
      console.log('🎭 DEMO MODE: Simulating student health info update');
      return getDemoUpdateResponse();
    }

    if (USE_DUMMY_DATA) {
      return getDemoUpdateResponse();
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.UPDATE_STUDENT_HEALTH_INFO);

    return await makeHealthApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        authCode,
        student_id: studentId,
        ...healthInfo,
      }),
    });
  } catch (error) {
    console.error('Error updating student health info:', error);
    throw error;
  }
};

/**
 * Delete a health record (nurses only)
 * @param {string} authCode - Staff authentication code
 * @param {string} recordType - Type of record ('student', 'staff', 'guest')
 * @param {number} recordId - Record ID to delete
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteHealthRecord = async (authCode, recordType, recordId) => {
  try {
    if (!authCode || !recordType || !recordId) {
      throw new Error(
        'Authentication code, record type, and record ID are required'
      );
    }

    // Check for demo mode
    if (authCode.startsWith('DEMO_AUTH_')) {
      console.log('🎭 DEMO MODE: Simulating health record deletion');
      return getDemoDeleteResponse();
    }

    if (USE_DUMMY_DATA) {
      return getDemoDeleteResponse();
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.DELETE_HEALTH_RECORD);

    return await makeHealthApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        authCode,
        record_type: recordType,
        record_id: recordId,
      }),
    });
  } catch (error) {
    console.error('Error deleting health record:', error);
    throw error;
  }
};

/**
 * Get staff's own health records
 * @param {string} authCode - Staff authentication code
 * @returns {Promise<Object>} - Staff health records
 */
export const getStaffHealthRecords = async (authCode) => {
  try {
    if (!authCode) {
      throw new Error('Authentication code is required');
    }

    // Check for demo mode
    if (authCode.startsWith('DEMO_AUTH_')) {
      console.log('🎭 DEMO MODE: Using demo staff health records');
      return getDemoStaffHealthRecords();
    }

    if (USE_DUMMY_DATA) {
      return getDemoStaffHealthRecords();
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_STAFF_HEALTH_RECORDS, {
      authCode,
    });

    return await makeHealthApiRequest(url);
  } catch (error) {
    console.error('Error fetching staff health records:', error);
    throw error;
  }
};

/**
 * Get homeroom students' health information (homeroom teachers and nurses)
 * @param {string} authCode - Staff authentication code
 * @returns {Promise<Object>} - Homeroom students health info
 */
export const getHomeroomStudentsHealthInfo = async (authCode) => {
  try {
    if (!authCode) {
      throw new Error('Authentication code is required');
    }

    // Check for demo mode
    if (authCode.startsWith('DEMO_AUTH_')) {
      console.log('🎭 DEMO MODE: Using demo homeroom students health info');
      return getDemoHomeroomStudentsHealthInfo();
    }

    if (USE_DUMMY_DATA) {
      return getDemoHomeroomStudentsHealthInfo();
    }

    const url = buildApiUrl(
      Config.API_ENDPOINTS.GET_HOMEROOM_STUDENTS_HEALTH_INFO,
      {
        authCode,
      }
    );

    return await makeHealthApiRequest(url);
  } catch (error) {
    console.error('Error fetching homeroom students health info:', error);
    throw error;
  }
};

/**
 * Get health lookup data (injuries, actions, medications)
 * @param {string} authCode - Authentication code
 * @returns {Promise<Object>} - Lookup data
 */
export const getHealthLookupData = async (authCode) => {
  try {
    if (!authCode) {
      throw new Error('Authentication code is required');
    }

    // Check for demo mode
    if (authCode.startsWith('DEMO_AUTH_')) {
      console.log('🎭 DEMO MODE: Using demo health lookup data');
      return getDemoHealthLookupData();
    }

    if (USE_DUMMY_DATA) {
      return getDemoHealthLookupData();
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_HEALTH_LOOKUP_DATA, {
      authCode,
    });

    return await makeHealthApiRequest(url);
  } catch (error) {
    console.error('Error fetching health lookup data:', error);
    throw error;
  }
};

/**
 * Get student health (legacy HTML view)
 * @param {string} authCode - Authentication code
 * @returns {Promise<Object>} - HTML health view
 */
export const getStudentHealthLegacy = async (authCode) => {
  try {
    if (!authCode) {
      throw new Error('Authentication code is required');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_STUDENT_HEALTH_LEGACY, {
      authCode,
    });

    return await makeHealthApiRequest(url);
  } catch (error) {
    console.error('Error fetching legacy student health:', error);
    throw error;
  }
};

// Demo data functions
const getDemoStudentHealthRecords = () => ({
  success: true,
  data: {
    student: {
      id: 123,
      name: 'Demo Student',
      branch_id: 1,
    },
    records: [
      {
        record_id: 456,
        date: '2024-01-15',
        time: '10:30',
        reason: 'Headache,Fever',
        action: 'Rest,Medication',
        parent_contact_time: '11:00',
        temperature: '38.5°C',
        medication: 'Paracetamol',
        comments: 'Student feeling better after rest',
        time_left_nurse_clinic: '12:00',
        created_by: 'Nurse Smith',
        created_at: '2024-01-15T10:30:00.000000Z',
        updated_at: '2024-01-15T12:00:00.000000Z',
      },
      {
        record_id: 457,
        date: '2024-01-10',
        time: '14:15',
        reason: 'Stomach ache',
        action: 'Rest',
        parent_contact_time: '14:30',
        temperature: '37.2°C',
        medication: 'Antacid',
        comments: 'Ate too quickly at lunch',
        time_left_nurse_clinic: '15:00',
        created_by: 'Nurse Johnson',
        created_at: '2024-01-10T14:15:00.000000Z',
        updated_at: '2024-01-10T15:00:00.000000Z',
      },
    ],
    total_count: 2,
  },
});

const getDemoStudentHealthInfo = () => ({
  success: true,
  data: {
    student: {
      id: 123,
      name: 'Demo Student',
    },
    health_info: {
      student_id: 123,
      medical_conditions: 'Asthma',
      regularly_used_medication: 'Inhaler',
      has_vision_problem: 'No',
      vision_check_date: '2023-09-01',
      hearing_issue: 'None',
      special_food_consideration: 'No nuts',
      allergies: 'Peanuts, Shellfish',
      allergy_symtoms: 'Swelling, difficulty breathing',
      allergy_first_aid: 'Use EpiPen, call emergency',
      allowed_drugs: 'Paracetamol,Ibuprofen',
      emergency_name_1: 'Jane Doe',
      emergency_name_2: 'Bob Doe',
      emergency_phone_1: '+1234567890',
      emergency_phone_2: '+0987654321',
    },
  },
});

const getDemoTeacherHealthData = () => ({
  success: true,
  data: {
    access_level: 'nurse',
    teacher: {
      id: 789,
      name: 'Demo Teacher',
      branch_id: 1,
      access_description:
        'Full access to all health records (nurse permissions)',
    },
    student_records: [
      {
        record_id: 456,
        student_id: 123,
        student_name: 'Demo Student',
        date: '2024-01-15',
        time: '10:30',
        reason: 'Headache,Fever',
        action: 'Rest,Medication',
        parent_contact_time: '11:00',
        temperature: '38.5°C',
        medication: 'Paracetamol',
        comments: 'Student feeling better after rest',
        created_by: 'Nurse Smith',
      },
    ],
    staff_records: [
      {
        record_id: 789,
        user_id: 456,
        staff_name: 'Demo Staff',
        date: '2024-01-14',
        time: '14:00',
        reason: 'Back pain',
        action: 'Rest recommended',
        temperature: null,
        medication: 'Pain relief',
        comments: 'Work-related strain',
      },
    ],
    guest_records: [
      {
        record_id: 101,
        guest_name: 'Demo Visitor',
        date: '2024-01-13',
        time: '09:15',
        reason: 'Minor cut',
        action: 'First aid applied',
        temperature: null,
        medication: 'Antiseptic',
        comments: 'Small cut on finger',
      },
    ],
    students: [
      {
        id: 123,
        name: 'Demo Student',
        email: 'demo.student@school.edu',
      },
    ],
    staff: [
      {
        id: 456,
        name: 'Demo Staff',
        email: 'demo.staff@school.edu',
      },
    ],
    statistics: {
      total_student_records: 1,
      total_staff_records: 1,
      total_guest_records: 1,
      records_today: 0,
      records_this_week: 3,
    },
  },
});

const getDemoStaffHealthRecords = () => ({
  success: true,
  data: {
    staff: {
      id: 789,
      name: 'Demo Teacher',
      branch_id: 1,
    },
    records: [
      {
        record_id: 790,
        date: '2024-01-16',
        time: '11:45',
        reason: 'Headache',
        action: 'Rest break',
        temperature: null,
        medication: 'Paracetamol',
        comments: 'Stress-related headache',
        time_left_nurse_clinic: '12:30',
        created_by: 'Nurse Smith',
        created_at: '2024-01-16T11:45:00.000000Z',
        updated_at: '2024-01-16T12:30:00.000000Z',
      },
    ],
    total_count: 1,
  },
});

const getDemoHomeroomStudentsHealthInfo = () => ({
  success: true,
  data: {
    teacher: {
      id: 456,
      name: 'Demo Homeroom Teacher',
      access_level: 'homeroom',
      access_description:
        "Read-only access to homeroom students' health records",
    },
    students_health_info: [
      {
        student_id: 123,
        student_name: 'Demo Student',
        student_email: 'demo.student@school.edu',
        health_info: {
          medical_conditions: 'Asthma',
          regularly_used_medication: 'Inhaler',
          has_vision_problem: 'No',
          vision_check_date: '2023-09-01',
          hearing_issue: 'None',
          special_food_consideration: 'No nuts',
          allergies: 'Peanuts, Shellfish',
          allergy_symtoms: 'Swelling, difficulty breathing',
          allergy_first_aid: 'Use EpiPen, call emergency',
          allowed_drugs: 'Paracetamol,Ibuprofen',
          emergency_name_1: 'Jane Doe',
          emergency_name_2: 'Bob Doe',
          emergency_phone_1: '+1234567890',
          emergency_phone_2: '+0987654321',
        },
      },
    ],
    total_count: 1,
  },
});

const getDemoHealthLookupData = () => ({
  success: true,
  data: {
    injuries: [
      {
        id: 1,
        value: 'Headache',
        description: 'Pain in head or neck area',
      },
      {
        id: 2,
        value: 'Fever',
        description: 'Elevated body temperature',
      },
      {
        id: 3,
        value: 'Stomach ache',
        description: 'Abdominal pain or discomfort',
      },
      {
        id: 4,
        value: 'Nausea',
        description: 'Feeling of sickness',
      },
      {
        id: 5,
        value: 'Dizziness',
        description: 'Feeling lightheaded or unsteady',
      },
    ],
    actions: [
      {
        id: 1,
        value: 'Rest',
        description: 'Allow patient to rest',
      },
      {
        id: 2,
        value: 'Medication',
        description: 'Administer appropriate medication',
      },
      {
        id: 3,
        value: 'First aid',
        description: 'Apply basic first aid treatment',
      },
      {
        id: 4,
        value: 'Ice pack',
        description: 'Apply cold compress',
      },
      {
        id: 5,
        value: 'Bandage',
        description: 'Apply protective bandaging',
      },
    ],
    medications: [
      {
        id: 1,
        value: 'Paracetamol',
        description: 'Pain and fever relief',
      },
      {
        id: 2,
        value: 'Ibuprofen',
        description: 'Anti-inflammatory pain relief',
      },
      {
        id: 3,
        value: 'Antiseptic',
        description: 'Wound cleaning and disinfection',
      },
      {
        id: 4,
        value: 'Antacid',
        description: 'Stomach acid relief',
      },
      {
        id: 5,
        value: 'Antihistamine',
        description: 'Allergy symptom relief',
      },
    ],
  },
});

const getDemoCreateRecordResponse = (recordType) => ({
  success: true,
  message: `${
    recordType.charAt(0).toUpperCase() + recordType.slice(1)
  } health record created successfully`,
  data: {
    record_id: Math.floor(Math.random() * 1000) + 100,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    }),
    reason: 'Demo reason',
    action: 'Demo action',
  },
});

const getDemoUpdateResponse = () => ({
  success: true,
  message: 'Student health information updated successfully',
});

const getDemoDeleteResponse = () => ({
  success: true,
  message: 'Health record deleted successfully',
});

// Export all functions
export default {
  getStudentHealthRecords,
  getStudentHealthInfo,
  getTeacherHealthData,
  createStudentHealthRecord,
  createStaffHealthRecord,
  createGuestHealthRecord,
  updateStudentHealthInfo,
  deleteHealthRecord,
  getStaffHealthRecords,
  getHomeroomStudentsHealthInfo,
  getHealthLookupData,
  getStudentHealthLegacy,
};
