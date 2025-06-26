import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config, makeApiRequest, buildApiUrl } from '../config/env';


// Storage keys for families policy compliance
const STORAGE_KEYS = {
  AGE_VERIFICATION: 'families_policy_age_verification',
  PARENTAL_CONSENT: 'families_policy_parental_consent',
  COMPLIANCE_STATUS: 'families_policy_compliance_status',
  USER_PREFERENCES: 'families_policy_user_preferences',
};

// Age groups as defined by app store policies
export const AGE_GROUPS = {
  UNDER_5: 'ages_5_under',
  AGES_6_8: 'ages_6_8',
  AGES_9_12: 'ages_9_12',
  AGES_13_15: 'ages_13_15',
  AGES_16_17: 'ages_16_17',
  AGES_18_OVER: 'ages_18_over',
};

// Compliance requirements based on age
export const COMPLIANCE_REQUIREMENTS = {
  [AGE_GROUPS.UNDER_5]: {
    requiresParentalConsent: true,
    restrictedDataCollection: true,
    noAds: true,
    supervisedAccess: true,
  },
  [AGE_GROUPS.AGES_6_8]: {
    requiresParentalConsent: true,
    restrictedDataCollection: true,
    familySafeAdsOnly: true,
    supervisedAccess: true,
  },
  [AGE_GROUPS.AGES_9_12]: {
    requiresParentalConsent: true,
    restrictedDataCollection: true,
    familySafeAdsOnly: true,
    supervisedAccess: true,
  },
  [AGE_GROUPS.AGES_13_15]: {
    requiresParentalConsent: false, // May vary by jurisdiction
    restrictedDataCollection: false,
    familySafeAdsOnly: true,
    supervisedAccess: false,
  },
  [AGE_GROUPS.AGES_16_17]: {
    requiresParentalConsent: false,
    restrictedDataCollection: false,
    familySafeAdsOnly: false,
    supervisedAccess: false,
  },
  [AGE_GROUPS.AGES_18_OVER]: {
    requiresParentalConsent: false,
    restrictedDataCollection: false,
    familySafeAdsOnly: false,
    supervisedAccess: false,
  },
};

/**
 * Determine age group based on age
 * @param {number} age - User's age
 * @returns {string} Age group identifier
 */
export const getAgeGroup = (age) => {
  if (age <= 5) return AGE_GROUPS.UNDER_5;
  if (age <= 8) return AGE_GROUPS.AGES_6_8;
  if (age <= 12) return AGE_GROUPS.AGES_9_12;
  if (age <= 15) return AGE_GROUPS.AGES_13_15;
  if (age <= 17) return AGE_GROUPS.AGES_16_17;
  return AGE_GROUPS.AGES_18_OVER;
};

/**
 * Get compliance requirements for a specific age
 * @param {number} age - User's age
 * @returns {object} Compliance requirements
 */
export const getComplianceRequirements = (age) => {
  const ageGroup = getAgeGroup(age);
  return COMPLIANCE_REQUIREMENTS[ageGroup] || COMPLIANCE_REQUIREMENTS[AGE_GROUPS.AGES_18_OVER];
};

/**
 * Store age verification data
 * @param {object} verificationData - Age verification data
 */
export const storeAgeVerification = async (verificationData) => {
  try {
    const data = {
      ...verificationData,
      timestamp: new Date().toISOString(),
      ageGroup: getAgeGroup(verificationData.age),
      complianceRequirements: getComplianceRequirements(verificationData.age),
    };
    
    await AsyncStorage.setItem(STORAGE_KEYS.AGE_VERIFICATION, JSON.stringify(data));
    console.log('📋 FAMILIES POLICY: Age verification stored');
    return data;
  } catch (error) {
    console.error('Error storing age verification:', error);
    throw error;
  }
};

/**
 * Get stored age verification data
 * @returns {object|null} Age verification data or null
 */
export const getAgeVerification = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.AGE_VERIFICATION);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting age verification:', error);
    return null;
  }
};

/**
 * Store parental consent data
 * @param {object} consentData - Parental consent data
 */
export const storeParentalConsent = async (consentData) => {
  try {
    const data = {
      ...consentData,
      timestamp: new Date().toISOString(),
      consentVersion: '1.0', // Track consent version for policy updates
    };
    
    await AsyncStorage.setItem(STORAGE_KEYS.PARENTAL_CONSENT, JSON.stringify(data));
    console.log('📋 FAMILIES POLICY: Parental consent stored');
    
    // Also send to backend for compliance records
    await sendParentalConsentToBackend(data);
    
    return data;
  } catch (error) {
    console.error('Error storing parental consent:', error);
    throw error;
  }
};

/**
 * Get stored parental consent data
 * @returns {object|null} Parental consent data or null
 */
export const getParentalConsent = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PARENTAL_CONSENT);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting parental consent:', error);
    return null;
  }
};

/**
 * Check if user is compliant with families policy
 * @param {string} userId - User ID
 * @returns {object} Compliance status
 */
export const checkComplianceStatus = async (userId) => {
  try {
    const ageVerification = await getAgeVerification();
    const parentalConsent = await getParentalConsent();
    
    if (!ageVerification) {
      return {
        isCompliant: false,
        reason: 'age_verification_required',
        requiredActions: ['age_verification'],
      };
    }
    
    const requirements = getComplianceRequirements(ageVerification.age);
    
    if (requirements.requiresParentalConsent && !parentalConsent) {
      return {
        isCompliant: false,
        reason: 'parental_consent_required',
        requiredActions: ['parental_consent'],
      };
    }
    
    return {
      isCompliant: true,
      ageGroup: ageVerification.ageGroup,
      requirements,
      verificationDate: ageVerification.timestamp,
      consentDate: parentalConsent?.timestamp,
    };
  } catch (error) {
    console.error('Error checking compliance status:', error);
    return {
      isCompliant: false,
      reason: 'compliance_check_error',
      error: error.message,
    };
  }
};

/**
 * Send parental consent to backend for compliance records
 * @param {object} consentData - Consent data
 */
const sendParentalConsentToBackend = async (consentData) => {
  try {
    // Get auth code for API request
    const userData = await AsyncStorage.getItem('userData');
    if (!userData) {
      throw new Error('No user data found');
    }
    
    const user = JSON.parse(userData);
    const authCode = user.authCode || user.auth_code;
    
    if (!authCode) {
      throw new Error('No auth code found');
    }
    
    const url = buildApiUrl('/families-policy/parental-consent');
    const response = await makeApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        authCode,
        ...consentData,
      }),
    });
    
    if (response.success) {
      console.log('📋 FAMILIES POLICY: Parental consent sent to backend');
    } else {
      console.warn('📋 FAMILIES POLICY: Failed to send parental consent to backend');
    }
    
    return response;
  } catch (error) {
    console.error('Error sending parental consent to backend:', error);
    // Don't throw error - local storage is sufficient for now
  }
};

/**
 * Clear all families policy data (for logout/reset)
 */
export const clearFamiliesPolicyData = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AGE_VERIFICATION,
      STORAGE_KEYS.PARENTAL_CONSENT,
      STORAGE_KEYS.COMPLIANCE_STATUS,
      STORAGE_KEYS.USER_PREFERENCES,
    ]);
    console.log('📋 FAMILIES POLICY: All data cleared');
  } catch (error) {
    console.error('Error clearing families policy data:', error);
  }
};

/**
 * Check if ads can be shown to user
 * @param {number} age - User's age
 * @returns {object} Ad serving permissions
 */
export const getAdServingPermissions = (age) => {
  const requirements = getComplianceRequirements(age);
  
  return {
    canShowAds: !requirements.noAds,
    familySafeOnly: requirements.familySafeAdsOnly,
    requiresParentalConsent: requirements.requiresParentalConsent,
    ageGroup: getAgeGroup(age),
  };
};

/**
 * Get data collection permissions based on age
 * @param {number} age - User's age
 * @returns {object} Data collection permissions
 */
export const getDataCollectionPermissions = (age) => {
  const requirements = getComplianceRequirements(age);
  
  return {
    canCollectPersonalInfo: !requirements.restrictedDataCollection,
    requiresParentalConsent: requirements.requiresParentalConsent,
    allowedDataTypes: requirements.restrictedDataCollection 
      ? ['educational_progress', 'app_usage'] 
      : ['all'],
    ageGroup: getAgeGroup(age),
  };
};

/**
 * Validate compliance before allowing app access
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Whether user can access the app
 */
export const validateComplianceForAccess = async (userId) => {
  try {
    const complianceStatus = await checkComplianceStatus(userId);
    
    if (!complianceStatus.isCompliant) {
      console.log('📋 FAMILIES POLICY: User not compliant, access denied');
      return false;
    }
    
    console.log('📋 FAMILIES POLICY: User compliant, access granted');
    return true;
  } catch (error) {
    console.error('Error validating compliance for access:', error);
    // In case of error, deny access for safety
    return false;
  }
};

/**
 * Get user-friendly compliance status message
 * @param {object} complianceStatus - Compliance status object
 * @returns {string} User-friendly message
 */
export const getComplianceStatusMessage = (complianceStatus) => {
  if (complianceStatus.isCompliant) {
    return 'Your account is compliant with all privacy and safety requirements.';
  }
  
  switch (complianceStatus.reason) {
    case 'age_verification_required':
      return 'Please verify your age to continue using the app.';
    case 'parental_consent_required':
      return 'Parental consent is required for users under 13.';
    case 'compliance_check_error':
      return 'Unable to verify compliance status. Please try again.';
    default:
      return 'Additional verification is required to use the app.';
  }
};

export default {
  storeAgeVerification,
  getAgeVerification,
  storeParentalConsent,
  getParentalConsent,
  checkComplianceStatus,
  clearFamiliesPolicyData,
  getAdServingPermissions,
  getDataCollectionPermissions,
  validateComplianceForAccess,
  getComplianceStatusMessage,
  getAgeGroup,
  getComplianceRequirements,
};
