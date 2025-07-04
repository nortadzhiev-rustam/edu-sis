/**
 * Health Notification Handler
 * Handles navigation and actions for health-related notifications
 */

/**
 * Handle health notification tap/press
 * @param {Object} notification - Notification object
 * @param {Object} navigation - Navigation object
 * @param {Object} userData - Current user data
 */
export const handleHealthNotificationPress = (notification, navigation, userData) => {
  if (!notification || !navigation) return;

  const { type, data } = notification;

  switch (type) {
    case 'student_visit':
      handleStudentVisitNotification(notification, navigation, userData);
      break;
    
    case 'staff_visit':
      handleStaffVisitNotification(notification, navigation, userData);
      break;
    
    case 'guest_visit':
      handleGuestVisitNotification(notification, navigation, userData);
      break;
    
    case 'health_alert':
    case 'emergency':
      handleHealthAlertNotification(notification, navigation, userData);
      break;
    
    case 'health_reminder':
      handleHealthReminderNotification(notification, navigation, userData);
      break;
    
    case 'health_update':
      handleHealthUpdateNotification(notification, navigation, userData);
      break;
    
    default:
      // Default to health screen based on user type
      navigateToHealthScreen(navigation, userData);
      break;
  }
};

/**
 * Handle student visit notification
 */
const handleStudentVisitNotification = (notification, navigation, userData) => {
  const { data } = notification;
  
  if (userData.userType === 'student') {
    // Navigate to student's own health screen
    navigation.navigate('StudentHealthScreen', {
      authCode: userData.authCode,
      studentName: userData.name,
    });
  } else {
    // Navigate to teacher health screen
    navigation.navigate('TeacherHealthScreen', {
      authCode: userData.authCode,
      userData: userData,
    });
  }
};

/**
 * Handle staff visit notification
 */
const handleStaffVisitNotification = (notification, navigation, userData) => {
  const { data } = notification;
  
  // Navigate to teacher health screen
  navigation.navigate('TeacherHealthScreen', {
    authCode: userData.authCode,
    userData: userData,
  });
};

/**
 * Handle guest visit notification
 */
const handleGuestVisitNotification = (notification, navigation, userData) => {
  const { data } = notification;
  
  // Navigate to teacher health screen (guests tab)
  navigation.navigate('TeacherHealthScreen', {
    authCode: userData.authCode,
    userData: userData,
    initialTab: 'guests',
  });
};

/**
 * Handle health alert/emergency notification
 */
const handleHealthAlertNotification = (notification, navigation, userData) => {
  const { data } = notification;
  
  if (userData.userType === 'student' && data?.student_id === userData.id) {
    // Student's own emergency - go to their health screen
    navigation.navigate('StudentHealthScreen', {
      authCode: userData.authCode,
      studentName: userData.name,
    });
  } else {
    // Staff/teacher - go to health management screen
    navigation.navigate('TeacherHealthScreen', {
      authCode: userData.authCode,
      userData: userData,
    });
  }
};

/**
 * Handle health reminder notification
 */
const handleHealthReminderNotification = (notification, navigation, userData) => {
  const { data } = notification;
  
  if (userData.userType === 'student') {
    // Navigate to student health info
    navigation.navigate('StudentHealthScreen', {
      authCode: userData.authCode,
      studentName: userData.name,
      initialTab: 'info',
    });
  } else {
    // Navigate to teacher health screen
    navigation.navigate('TeacherHealthScreen', {
      authCode: userData.authCode,
      userData: userData,
    });
  }
};

/**
 * Handle health update notification
 */
const handleHealthUpdateNotification = (notification, navigation, userData) => {
  const { data } = notification;
  
  if (userData.userType === 'student' && data?.student_id === userData.id) {
    // Student's own health info updated
    navigation.navigate('StudentHealthScreen', {
      authCode: userData.authCode,
      studentName: userData.name,
      initialTab: 'info',
    });
  } else {
    // Staff/teacher - go to health management screen
    navigation.navigate('TeacherHealthScreen', {
      authCode: userData.authCode,
      userData: userData,
    });
  }
};

/**
 * Navigate to appropriate health screen based on user type
 */
const navigateToHealthScreen = (navigation, userData) => {
  if (userData.userType === 'student') {
    navigation.navigate('StudentHealthScreen', {
      authCode: userData.authCode,
      studentName: userData.name,
    });
  } else {
    navigation.navigate('TeacherHealthScreen', {
      authCode: userData.authCode,
      userData: userData,
    });
  }
};

/**
 * Get health notification icon based on type
 * @param {string} type - Notification type
 * @returns {string} - Icon name
 */
export const getHealthNotificationIcon = (type) => {
  switch (type) {
    case 'student_visit':
    case 'staff_visit':
    case 'guest_visit':
      return 'faHeartbeat';
    
    case 'health_alert':
    case 'emergency':
      return 'faExclamationTriangle';
    
    case 'health_reminder':
      return 'faBell';
    
    case 'health_update':
      return 'faInfoCircle';
    
    default:
      return 'faHeartbeat';
  }
};

/**
 * Get health notification color based on type and priority
 * @param {string} type - Notification type
 * @param {string} priority - Notification priority
 * @returns {string} - Color code
 */
export const getHealthNotificationColor = (type, priority = 'normal') => {
  if (priority === 'urgent' || type === 'emergency') {
    return '#FF3B30'; // Red for urgent/emergency
  }
  
  switch (type) {
    case 'health_alert':
      return '#FF9500'; // Orange for alerts
    
    case 'health_reminder':
      return '#007AFF'; // Blue for reminders
    
    case 'health_update':
      return '#34C759'; // Green for updates
    
    case 'student_visit':
    case 'staff_visit':
    case 'guest_visit':
    default:
      return '#028090'; // Teal for health visits
  }
};

/**
 * Format health notification message for display
 * @param {Object} notification - Notification object
 * @returns {string} - Formatted message
 */
export const formatHealthNotificationMessage = (notification) => {
  const { type, data, message } = notification;
  
  // Return custom message if provided
  if (message) return message;
  
  // Generate default message based on type
  switch (type) {
    case 'student_visit':
      return `Health visit recorded for student`;
    
    case 'staff_visit':
      return `Health visit recorded for staff member`;
    
    case 'guest_visit':
      return `Health visit recorded for guest`;
    
    case 'health_alert':
      return `Health alert: ${data?.description || 'Important health notification'}`;
    
    case 'emergency':
      return `Emergency health alert: ${data?.description || 'Immediate attention required'}`;
    
    case 'health_reminder':
      return `Health reminder: ${data?.reminder_type || 'Health checkup due'}`;
    
    case 'health_update':
      return `Health information updated`;
    
    default:
      return 'Health notification';
  }
};

export default {
  handleHealthNotificationPress,
  getHealthNotificationIcon,
  getHealthNotificationColor,
  formatHealthNotificationMessage,
};
