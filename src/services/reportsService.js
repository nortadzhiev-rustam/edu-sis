/**
 * Reports Service
 * Handles all reports-related API calls and data management
 */

import { Config, buildApiUrl } from '../config/env';
import { isDemoMode } from './authService';

// Flag to toggle between dummy data and real API
const USE_DUMMY_DATA = Config.DEV.USE_DUMMY_DATA;

/**
 * Helper function to make API requests with proper error handling
 */
const makeReportsApiRequest = async (url, options = {}) => {
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
    console.error('Reports API request failed:', error);
    throw error;
  }
};

/**
 * Get available reports for the authenticated user
 * @param {string} authCode - Authentication code
 * @returns {Promise<Object>} - Available reports based on user role
 */
export const getAvailableReports = async (authCode) => {
  try {
    if (!authCode) {
      throw new Error('Authentication code is required');
    }

    // Check for demo mode
    if (isDemoMode({ authCode })) {
      console.log('🎭 DEMO MODE: Using demo available reports data');
      return getDemoAvailableReports();
    }

    if (USE_DUMMY_DATA) {
      return getDemoAvailableReports();
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_AVAILABLE_REPORTS, {
      authCode,
    });

    return await makeReportsApiRequest(url);
  } catch (error) {
    console.error('Error fetching available reports:', error);
    throw error;
  }
};

// Student Reports

/**
 * Get student attendance report
 * @param {string} authCode - Authentication code
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} - Student attendance report data
 */
export const getStudentAttendanceReport = async (
  authCode,
  startDate = null,
  endDate = null
) => {
  try {
    if (!authCode) {
      throw new Error('Authentication code is required');
    }

    // Check for demo mode
    if (isDemoMode({ authCode })) {
      console.log('🎭 DEMO MODE: Using demo student attendance report');
      return getDemoStudentAttendanceReport();
    }

    if (USE_DUMMY_DATA) {
      return getDemoStudentAttendanceReport();
    }

    const params = { authCode };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const url = buildApiUrl(
      Config.API_ENDPOINTS.GET_STUDENT_ATTENDANCE_REPORT,
      params
    );

    return await makeReportsApiRequest(url);
  } catch (error) {
    console.error('Error fetching student attendance report:', error);
    throw error;
  }
};

/**
 * Get student grades report
 * @param {string} authCode - Authentication code
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} - Student grades report data
 */
export const getStudentGradesReport = async (
  authCode,
  startDate = null,
  endDate = null
) => {
  try {
    if (!authCode) {
      throw new Error('Authentication code is required');
    }

    // Check for demo mode
    if (isDemoMode({ authCode })) {
      console.log('🎭 DEMO MODE: Using demo student grades report');
      return getDemoStudentGradesReport();
    }

    if (USE_DUMMY_DATA) {
      return getDemoStudentGradesReport();
    }

    const params = { authCode };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const url = buildApiUrl(
      Config.API_ENDPOINTS.GET_STUDENT_GRADES_REPORT,
      params
    );

    return await makeReportsApiRequest(url);
  } catch (error) {
    console.error('Error fetching student grades report:', error);
    throw error;
  }
};

/**
 * Get student BPS report
 * @param {string} authCode - Authentication code
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} - Student BPS report data
 */
export const getStudentBPSReport = async (
  authCode,
  startDate = null,
  endDate = null
) => {
  try {
    if (!authCode) {
      throw new Error('Authentication code is required');
    }

    // Check for demo mode
    if (isDemoMode({ authCode })) {
      console.log('🎭 DEMO MODE: Using demo student BPS report');
      return getDemoStudentBPSReport();
    }

    if (USE_DUMMY_DATA) {
      return getDemoStudentBPSReport();
    }

    const params = { authCode };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const url = buildApiUrl(
      Config.API_ENDPOINTS.GET_STUDENT_BPS_REPORT,
      params
    );

    return await makeReportsApiRequest(url);
  } catch (error) {
    console.error('Error fetching student BPS report:', error);
    throw error;
  }
};

/**
 * Get student homework report
 * @param {string} authCode - Authentication code
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} - Student homework report data
 */
export const getStudentHomeworkReport = async (
  authCode,
  startDate = null,
  endDate = null
) => {
  try {
    if (!authCode) {
      throw new Error('Authentication code is required');
    }

    // Check for demo mode
    if (isDemoMode({ authCode })) {
      console.log('🎭 DEMO MODE: Using demo student homework report');
      return getDemoStudentHomeworkReport();
    }

    if (USE_DUMMY_DATA) {
      return getDemoStudentHomeworkReport();
    }

    const params = { authCode };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const url = buildApiUrl(
      Config.API_ENDPOINTS.GET_STUDENT_HOMEWORK_REPORT,
      params
    );

    return await makeReportsApiRequest(url);
  } catch (error) {
    console.error('Error fetching student homework report:', error);
    throw error;
  }
};

/**
 * Get student library report
 * @param {string} authCode - Authentication code
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} - Student library report data
 */
export const getStudentLibraryReport = async (
  authCode,
  startDate = null,
  endDate = null
) => {
  try {
    if (!authCode) {
      throw new Error('Authentication code is required');
    }

    // Check for demo mode
    if (isDemoMode({ authCode })) {
      console.log('🎭 DEMO MODE: Using demo student library report');
      return getDemoStudentLibraryReport();
    }

    if (USE_DUMMY_DATA) {
      return getDemoStudentLibraryReport();
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_STUDENT_LIBRARY_REPORT, {
      authCode,
      startDate,
      endDate,
    });

    return await makeReportsApiRequest(url);
  } catch (error) {
    console.error('Error fetching student library report:', error);
    throw error;
  }
};

// Staff Reports

/**
 * Get teacher classes for reports
 * @param {string} authCode - Authentication code
 * @returns {Promise<Object>} - Teacher classes data
 */
export const getStaffClasses = async (authCode) => {
  try {
    if (!authCode) {
      throw new Error('Authentication code is required');
    }

    // Check for demo mode
    if (isDemoMode({ authCode })) {
      console.log('🎭 DEMO MODE: Using demo staff classes data');
      return getDemoStaffClasses();
    }

    if (USE_DUMMY_DATA) {
      return getDemoStaffClasses();
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_STAFF_CLASSES, {
      authCode,
    });

    return await makeReportsApiRequest(url);
  } catch (error) {
    console.error('Error fetching staff classes:', error);
    throw error;
  }
};

/**
 * Get class attendance report
 * @param {string} authCode - Authentication code
 * @param {number} classroomId - Classroom ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} - Class attendance report data
 */
export const getClassAttendanceReport = async (
  authCode,
  classroomId,
  startDate = null,
  endDate = null
) => {
  try {
    if (!authCode || !classroomId) {
      throw new Error('Authentication code and classroom ID are required');
    }

    // Check for demo mode
    if (isDemoMode({ authCode })) {
      console.log('🎭 DEMO MODE: Using demo class attendance report');
      return getDemoClassAttendanceReport();
    }

    if (USE_DUMMY_DATA) {
      return getDemoClassAttendanceReport();
    }

    const params = { authCode, classroom_id: classroomId };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const url = buildApiUrl(
      Config.API_ENDPOINTS.GET_CLASS_ATTENDANCE_REPORT,
      params
    );

    return await makeReportsApiRequest(url);
  } catch (error) {
    console.error('Error fetching class attendance report:', error);
    throw error;
  }
};

/**
 * Get class assessment report
 * @param {string} authCode - Authentication code
 * @param {number} classroomId - Classroom ID
 * @param {number} subjectId - Subject ID (optional)
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} - Class assessment report data
 */
export const getClassAssessmentReport = async (
  authCode,
  classroomId,
  subjectId = null,
  startDate = null,
  endDate = null
) => {
  try {
    if (!authCode || !classroomId) {
      throw new Error('Authentication code and classroom ID are required');
    }

    // Check for demo mode
    if (isDemoMode({ authCode })) {
      console.log('🎭 DEMO MODE: Using demo class assessment report');
      return getDemoClassAssessmentReport();
    }

    if (USE_DUMMY_DATA) {
      return getDemoClassAssessmentReport();
    }

    const params = { authCode, classroom_id: classroomId };
    if (subjectId) params.subject_id = subjectId;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const url = buildApiUrl(
      Config.API_ENDPOINTS.GET_CLASS_ASSESSMENT_REPORT,
      params
    );

    return await makeReportsApiRequest(url);
  } catch (error) {
    console.error('Error fetching class assessment report:', error);
    throw error;
  }
};

/**
 * Get behavioral analytics report
 * @param {string} authCode - Authentication code
 * @param {number} classroomId - Classroom ID (optional)
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} - Behavioral analytics report data
 */
export const getBehavioralAnalyticsReport = async (
  authCode,
  classroomId = null,
  startDate = null,
  endDate = null
) => {
  try {
    if (!authCode) {
      throw new Error('Authentication code is required');
    }

    // Check for demo mode
    if (isDemoMode({ authCode })) {
      console.log('🎭 DEMO MODE: Using demo behavioral analytics report');
      return getDemoBehavioralAnalyticsReport();
    }

    if (USE_DUMMY_DATA) {
      return getDemoBehavioralAnalyticsReport();
    }

    const params = { authCode };
    if (classroomId) params.classroom_id = classroomId;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const url = buildApiUrl(
      Config.API_ENDPOINTS.GET_BEHAVIORAL_ANALYTICS_REPORT,
      params
    );

    return await makeReportsApiRequest(url);
  } catch (error) {
    console.error('Error fetching behavioral analytics report:', error);
    throw error;
  }
};

/**
 * Get homework analytics report
 * @param {string} authCode - Authentication code
 * @param {number} gradeId - Grade/Class ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} - Homework analytics report data
 */
export const getHomeworkAnalyticsReport = async (
  authCode,
  gradeId,
  startDate = null,
  endDate = null
) => {
  try {
    if (!authCode || !gradeId) {
      throw new Error('Authentication code and grade ID are required');
    }

    // Check for demo mode
    if (isDemoMode({ authCode })) {
      console.log('🎭 DEMO MODE: Using demo homework analytics report');
      return getDemoHomeworkAnalyticsReport();
    }

    if (USE_DUMMY_DATA) {
      return getDemoHomeworkAnalyticsReport();
    }

    const params = { authCode, grade_id: gradeId };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const url = buildApiUrl(
      Config.API_ENDPOINTS.GET_HOMEWORK_ANALYTICS_REPORT,
      params
    );

    return await makeReportsApiRequest(url);
  } catch (error) {
    console.error('Error fetching homework analytics report:', error);
    throw error;
  }
};

// Demo Data Functions

const getDemoAvailableReports = () => ({
  success: true,
  user_type: 'student',
  student_info: {
    id: 123,
    name: 'Demo User',
    branch_id: 1,
  },
  available_reports: [
    {
      id: 'attendance',
      name: 'My Attendance',
      description: 'View your attendance records and statistics',
      icon: 'calendar-check',
      category: 'academic',
    },
    {
      id: 'grades',
      name: 'My Grades',
      description: 'View your academic performance and grades',
      icon: 'chart-bar',
      category: 'academic',
    },
    {
      id: 'bps',
      name: 'My Behavior',
      description: 'View your behavioral points and records',
      icon: 'star',
      category: 'behavior',
    },
    {
      id: 'homework',
      name: 'Homework Analytics',
      description: 'View your homework completion statistics',
      icon: 'book-open',
      category: 'academic',
    },
    {
      id: 'library',
      name: 'Library Statistics',
      description: 'View your library usage and reading statistics',
      icon: 'library',
      category: 'academic',
    },
  ],
  total_reports: 5,
});

const getDemoStudentLibraryReport = () => ({
  success: true,
  report_type: 'student_library',
  student_info: {
    id: 123,
    name: 'Demo Student',
    branch_id: 1,
  },
  data: {
    summary: {
      total_books_borrowed: 15,
      books_returned: 12,
      books_overdue: 1,
      books_currently_borrowed: 2,
      total_reading_hours: 45,
      favorite_genre: 'Science Fiction',
    },
    chart_data: {
      labels: ['Returned', 'Currently Borrowed', 'Overdue'],
      datasets: [
        {
          data: [12, 2, 1],
          backgroundColor: ['#2ecc71', '#3498db', '#e74c3c'],
        },
      ],
      type: 'doughnut',
    },
    monthly_breakdown: [
      {
        month: '2024-01',
        books_borrowed: 5,
        books_returned: 4,
        reading_hours: 15,
      },
      {
        month: '2024-02',
        books_borrowed: 4,
        books_returned: 3,
        reading_hours: 12,
      },
      {
        month: '2024-03',
        books_borrowed: 6,
        books_returned: 5,
        reading_hours: 18,
      },
    ],
    recent_books: [
      {
        title: 'The Science of Everything',
        author: 'John Smith',
        borrowed_date: '2024-03-15',
        due_date: '2024-04-15',
        status: 'borrowed',
      },
      {
        title: 'Mathematics for Beginners',
        author: 'Jane Doe',
        borrowed_date: '2024-03-10',
        returned_date: '2024-03-25',
        status: 'returned',
      },
    ],
  },
  generated_at: new Date().toISOString(),
});

const getDemoStudentAttendanceReport = () => ({
  success: true,
  report_type: 'student_attendance',
  student_info: {
    id: 123,
    name: 'Demo Student',
    branch_id: 1,
  },
  data: {
    summary: {
      total_days: 30,
      present_days: 25,
      absent_days: 3,
      late_days: 2,
      attendance_rate: 83.33,
    },
    chart_data: {
      labels: ['Present', 'Absent', 'Late'],
      datasets: [
        {
          data: [25, 3, 2],
          backgroundColor: ['#2ecc71', '#e74c3c', '#f39c12'],
        },
      ],
      type: 'doughnut',
    },
    monthly_breakdown: [
      {
        month: '2024-01',
        present: 20,
        absent: 2,
        late: 1,
        attendance_rate: 86.96,
      },
    ],
  },
  generated_at: new Date().toISOString(),
});

const getDemoStudentGradesReport = () => ({
  success: true,
  report_type: 'student_grades',
  student_info: {
    id: 123,
    name: 'Demo Student',
    branch_id: 1,
  },
  data: {
    summary: {
      overall_average: 85.5,
      highest_grade: 95.0,
      lowest_grade: 72.0,
      total_subjects: 6,
      total_assessments: 24,
    },
    subject_breakdown: [
      {
        subject_id: 1,
        subject_name: 'Mathematics',
        summative_average: 88.5,
        formative_average: 82.0,
        overall_average: 86.5,
        total_assessments: 4,
      },
      {
        subject_id: 2,
        subject_name: 'English',
        summative_average: 84.2,
        formative_average: 80.1,
        overall_average: 82.8,
        total_assessments: 4,
      },
    ],
    chart_data: {
      labels: ['Mathematics', 'English', 'Science', 'History', 'Art', 'PE'],
      datasets: [
        {
          label: 'Overall Average',
          data: [86.5, 82.8, 87.8, 83.2, 89.1, 91.5],
          backgroundColor: '#3498db',
        },
      ],
      type: 'bar',
    },
  },
  generated_at: new Date().toISOString(),
});

const getDemoStudentBPSReport = () => ({
  success: true,
  report_type: 'student_bps',
  student_info: {
    id: 123,
    name: 'Demo Student',
    branch_id: 1,
  },
  data: {
    summary: {
      total_points: 15,
      positive_points: 20,
      negative_points: 5,
      total_records: 8,
      net_points: 15,
    },
    chart_data: {
      labels: ['Positive Points', 'Negative Points'],
      datasets: [
        {
          data: [20, 5],
          backgroundColor: ['#2ecc71', '#e74c3c'],
        },
      ],
      type: 'doughnut',
    },
    top_items: [
      {
        item_title: 'Good Behavior',
        count: 3,
        total_points: 15,
        type: 'PRS',
      },
      {
        item_title: 'Helping Others',
        count: 2,
        total_points: 10,
        type: 'PRS',
      },
    ],
  },
  generated_at: new Date().toISOString(),
});

const getDemoStudentHomeworkReport = () => ({
  success: true,
  report_type: 'student_homework',
  student_info: {
    id: 123,
    name: 'Demo Student',
    branch_id: 1,
  },
  data: {
    summary: {
      total_homework: 15,
      completed_homework: 12,
      pending_homework: 3,
      completion_rate: 80.0,
    },
    subject_breakdown: [
      {
        subject_name: 'Mathematics',
        total: 5,
        completed: 4,
        pending: 1,
        completion_rate: 80.0,
      },
      {
        subject_name: 'English',
        total: 4,
        completed: 4,
        pending: 0,
        completion_rate: 100.0,
      },
    ],
    chart_data: {
      labels: ['Completed', 'Pending'],
      datasets: [
        {
          data: [12, 3],
          backgroundColor: ['#2ecc71', '#f39c12'],
        },
      ],
      type: 'doughnut',
    },
  },
  generated_at: new Date().toISOString(),
});

const getDemoStaffClasses = () => ({
  success: true,
  staff_info: {
    id: 456,
    name: 'Demo Teacher',
    role: 'subject_teacher',
    access_level: 'class',
  },
  classes: [
    {
      classroom_id: 10,
      classroom_name: 'Year 10 Mathematics',
    },
    {
      classroom_id: 11,
      classroom_name: 'Year 9 Mathematics',
    },
  ],
  total_classes: 2,
});

const getDemoClassAttendanceReport = () => ({
  success: true,
  report_type: 'class_attendance',
  staff_info: {
    id: 456,
    name: 'Demo Teacher',
    role: 'subject_teacher',
  },
  data: {
    summary: {
      total_students: 25,
      total_days: 20,
      present_count: 480,
      absent_count: 15,
      late_count: 5,
      attendance_rate: 96.0,
    },
    daily_breakdown: [
      {
        date: '2024-01-15',
        present: 24,
        absent: 1,
        late: 0,
        attendance_rate: 96.0,
      },
      {
        date: '2024-01-16',
        present: 23,
        absent: 2,
        late: 0,
        attendance_rate: 92.0,
      },
    ],
    chart_data: {
      labels: ['Present', 'Absent', 'Late'],
      datasets: [
        {
          data: [480, 15, 5],
          backgroundColor: ['#2ecc71', '#e74c3c', '#f39c12'],
        },
      ],
      type: 'doughnut',
    },
  },
  generated_at: new Date().toISOString(),
});

const getDemoClassAssessmentReport = () => ({
  success: true,
  report_type: 'class_assessment',
  staff_info: {
    id: 456,
    name: 'Demo Teacher',
    role: 'subject_teacher',
  },
  data: {
    summary: {
      class_average: 78.5,
      highest_score: 95.0,
      lowest_score: 45.0,
      total_students: 25,
      total_assessments: 8,
    },
    grade_distribution: {
      A: 5,
      B: 8,
      C: 7,
      D: 3,
      F: 2,
    },
    chart_data: {
      labels: ['A (90-100)', 'B (80-89)', 'C (70-79)', 'D (60-69)', 'F (<60)'],
      datasets: [
        {
          data: [5, 8, 7, 3, 2],
          backgroundColor: [
            '#2ecc71',
            '#3498db',
            '#f39c12',
            '#e67e22',
            '#e74c3c',
          ],
        },
      ],
      type: 'doughnut',
    },
    subject_breakdown: [
      {
        subject_name: 'Mathematics',
        average: 82.3,
        total_assessments: 4,
        students_assessed: 25,
      },
    ],
  },
  generated_at: new Date().toISOString(),
});

const getDemoBehavioralAnalyticsReport = () => ({
  success: true,
  report_type: 'behavioral_analytics',
  staff_info: {
    id: 456,
    name: 'Demo Teacher',
    role: 'subject_teacher',
  },
  data: {
    summary: {
      total_records: 45,
      positive_records: 30,
      negative_records: 15,
      total_points: 125,
      positive_percentage: 66.67,
    },
    chart_data: {
      labels: ['Positive Records', 'Negative Records'],
      datasets: [
        {
          data: [30, 15],
          backgroundColor: ['#2ecc71', '#e74c3c'],
        },
      ],
      type: 'doughnut',
    },
    top_items: [
      {
        item_title: 'Good Behavior',
        count: 12,
        total_points: 60,
        type: 'PRS',
      },
      {
        item_title: 'Late to Class',
        count: 8,
        total_points: -40,
        type: 'NEG',
      },
    ],
    monthly_trend: [
      {
        month: '2024-01',
        positive: 15,
        negative: 8,
        total_points: 65,
      },
    ],
  },
  generated_at: new Date().toISOString(),
});

const getDemoHomeworkAnalyticsReport = () => ({
  success: true,
  report_type: 'homework_analytics',
  staff_info: {
    id: 456,
    name: 'Demo Teacher',
    role: 'subject_teacher',
  },
  data: {
    summary: {
      total_homework_assigned: 20,
      total_submissions: 450,
      completed_submissions: 380,
      completion_rate: 84.44,
    },
    chart_data: {
      labels: ['Completed', 'Pending'],
      datasets: [
        {
          data: [380, 70],
          backgroundColor: ['#2ecc71', '#f39c12'],
        },
      ],
      type: 'doughnut',
    },
    subject_breakdown: [
      {
        subject_name: 'Mathematics',
        total_assignments: 5,
        total_submissions: 125,
        completed_submissions: 110,
        completion_rate: 88.0,
      },
    ],
    daily_trend: [
      {
        date: '2024-01-15',
        assignments_due: 3,
        submissions: 68,
        completion_rate: 90.67,
      },
    ],
  },
  generated_at: new Date().toISOString(),
});
