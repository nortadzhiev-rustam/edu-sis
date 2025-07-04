/**
 * Health Permissions Utility
 * Handles role-based access control for health functionality
 */

/**
 * Health module ID in the system
 */
export const HEALTH_MODULE_ID = 42;

/**
 * User access levels for health functionality
 */
export const HEALTH_ACCESS_LEVELS = {
  NONE: 'none',
  STUDENT: 'student',
  STAFF_OWN: 'staff_own',
  HOMEROOM: 'homeroom',
  NURSE: 'nurse',
};

/**
 * Check if user has health module permissions
 * @param {Object} userData - User data object
 * @returns {boolean} - True if user has health module access
 */
export const hasHealthModuleAccess = (userData) => {
  if (!userData) return false;
  
  // Students always have access to their own health data
  if (userData.userType === 'student') {
    return true;
  }
  
  // Staff need health module permissions
  if (userData.userType === 'teacher' || userData.userType === 'staff') {
    // Check if user has health module permissions
    if (userData.modules && Array.isArray(userData.modules)) {
      return userData.modules.some(module => 
        module.module_id === HEALTH_MODULE_ID || module.id === HEALTH_MODULE_ID
      );
    }
    
    // Fallback: check if user is homeroom teacher (they get read access)
    return userData.is_homeroom === true;
  }
  
  return false;
};

/**
 * Get user's health access level
 * @param {Object} userData - User data object
 * @returns {string} - Access level constant
 */
export const getHealthAccessLevel = (userData) => {
  if (!userData) return HEALTH_ACCESS_LEVELS.NONE;
  
  // Students can only access their own health data
  if (userData.userType === 'student') {
    return HEALTH_ACCESS_LEVELS.STUDENT;
  }
  
  // Staff access levels
  if (userData.userType === 'teacher' || userData.userType === 'staff') {
    // Check for nurse permissions (health module access)
    if (userData.modules && Array.isArray(userData.modules)) {
      const hasHealthModule = userData.modules.some(module => 
        module.module_id === HEALTH_MODULE_ID || module.id === HEALTH_MODULE_ID
      );
      
      if (hasHealthModule) {
        return HEALTH_ACCESS_LEVELS.NURSE;
      }
    }
    
    // Homeroom teachers get read access to their students
    if (userData.is_homeroom === true) {
      return HEALTH_ACCESS_LEVELS.HOMEROOM;
    }
    
    // Regular staff can only access their own records
    return HEALTH_ACCESS_LEVELS.STAFF_OWN;
  }
  
  return HEALTH_ACCESS_LEVELS.NONE;
};

/**
 * Check if user can create health records
 * @param {Object} userData - User data object
 * @returns {boolean} - True if user can create records
 */
export const canCreateHealthRecords = (userData) => {
  const accessLevel = getHealthAccessLevel(userData);
  return accessLevel === HEALTH_ACCESS_LEVELS.NURSE;
};

/**
 * Check if user can edit health records
 * @param {Object} userData - User data object
 * @returns {boolean} - True if user can edit records
 */
export const canEditHealthRecords = (userData) => {
  const accessLevel = getHealthAccessLevel(userData);
  return accessLevel === HEALTH_ACCESS_LEVELS.NURSE;
};

/**
 * Check if user can delete health records
 * @param {Object} userData - User data object
 * @returns {boolean} - True if user can delete records
 */
export const canDeleteHealthRecords = (userData) => {
  const accessLevel = getHealthAccessLevel(userData);
  return accessLevel === HEALTH_ACCESS_LEVELS.NURSE;
};

/**
 * Check if user can update student health information
 * @param {Object} userData - User data object
 * @returns {boolean} - True if user can update health info
 */
export const canUpdateHealthInfo = (userData) => {
  const accessLevel = getHealthAccessLevel(userData);
  return accessLevel === HEALTH_ACCESS_LEVELS.NURSE;
};

/**
 * Check if user can view all health records
 * @param {Object} userData - User data object
 * @returns {boolean} - True if user can view all records
 */
export const canViewAllHealthRecords = (userData) => {
  const accessLevel = getHealthAccessLevel(userData);
  return accessLevel === HEALTH_ACCESS_LEVELS.NURSE;
};

/**
 * Check if user can view homeroom students' health data
 * @param {Object} userData - User data object
 * @returns {boolean} - True if user can view homeroom students' data
 */
export const canViewHomeroomHealthData = (userData) => {
  const accessLevel = getHealthAccessLevel(userData);
  return accessLevel === HEALTH_ACCESS_LEVELS.NURSE || 
         accessLevel === HEALTH_ACCESS_LEVELS.HOMEROOM;
};

/**
 * Check if user can view staff health records
 * @param {Object} userData - User data object
 * @returns {boolean} - True if user can view staff records
 */
export const canViewStaffHealthRecords = (userData) => {
  const accessLevel = getHealthAccessLevel(userData);
  return accessLevel === HEALTH_ACCESS_LEVELS.NURSE;
};

/**
 * Check if user can view guest health records
 * @param {Object} userData - User data object
 * @returns {boolean} - True if user can view guest records
 */
export const canViewGuestHealthRecords = (userData) => {
  const accessLevel = getHealthAccessLevel(userData);
  return accessLevel === HEALTH_ACCESS_LEVELS.NURSE;
};

/**
 * Check if user can access health statistics
 * @param {Object} userData - User data object
 * @returns {boolean} - True if user can access statistics
 */
export const canAccessHealthStatistics = (userData) => {
  const accessLevel = getHealthAccessLevel(userData);
  return accessLevel === HEALTH_ACCESS_LEVELS.NURSE;
};

/**
 * Get access description for user
 * @param {Object} userData - User data object
 * @returns {string} - Human-readable access description
 */
export const getHealthAccessDescription = (userData) => {
  const accessLevel = getHealthAccessLevel(userData);
  
  switch (accessLevel) {
    case HEALTH_ACCESS_LEVELS.STUDENT:
      return 'Read-only access to your own health records and information';
    
    case HEALTH_ACCESS_LEVELS.NURSE:
      return 'Full access to all health records (nurse permissions)';
    
    case HEALTH_ACCESS_LEVELS.HOMEROOM:
      return 'Read-only access to homeroom students\' health records';
    
    case HEALTH_ACCESS_LEVELS.STAFF_OWN:
      return 'Read-only access to your own health records';
    
    case HEALTH_ACCESS_LEVELS.NONE:
    default:
      return 'No health access permissions';
  }
};

/**
 * Check if user should see health menu item
 * @param {Object} userData - User data object
 * @returns {boolean} - True if health menu should be visible
 */
export const shouldShowHealthMenu = (userData) => {
  return hasHealthModuleAccess(userData);
};

/**
 * Get available health actions for user
 * @param {Object} userData - User data object
 * @returns {Object} - Object with available actions
 */
export const getAvailableHealthActions = (userData) => {
  const accessLevel = getHealthAccessLevel(userData);
  
  return {
    canCreate: canCreateHealthRecords(userData),
    canEdit: canEditHealthRecords(userData),
    canDelete: canDeleteHealthRecords(userData),
    canUpdateInfo: canUpdateHealthInfo(userData),
    canViewAll: canViewAllHealthRecords(userData),
    canViewHomeroom: canViewHomeroomHealthData(userData),
    canViewStaff: canViewStaffHealthRecords(userData),
    canViewGuests: canViewGuestHealthRecords(userData),
    canViewStats: canAccessHealthStatistics(userData),
    accessLevel,
    accessDescription: getHealthAccessDescription(userData),
  };
};

export default {
  HEALTH_MODULE_ID,
  HEALTH_ACCESS_LEVELS,
  hasHealthModuleAccess,
  getHealthAccessLevel,
  canCreateHealthRecords,
  canEditHealthRecords,
  canDeleteHealthRecords,
  canUpdateHealthInfo,
  canViewAllHealthRecords,
  canViewHomeroomHealthData,
  canViewStaffHealthRecords,
  canViewGuestHealthRecords,
  canAccessHealthStatistics,
  getHealthAccessDescription,
  shouldShowHealthMenu,
  getAvailableHealthActions,
};
