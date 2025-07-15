/**
 * Information Service
 * Handles all information-related API calls for About Us, Contacts, and FAQ data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config, buildApiUrl } from '../config/env';

// Flag to toggle between dummy data and real API
const USE_DUMMY_DATA = Config.DEV.USE_DUMMY_DATA;

/**
 * Get user's branch information from stored user data
 * @returns {Promise<Object>} Branch information object
 */
export const getUserBranchInfo = async () => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    if (!userData) {
      console.log('📍 INFO SERVICE: No user data found');
      return { branchId: null, branchName: null, userType: null };
    }

    const user = JSON.parse(userData);
    console.log('📍 INFO SERVICE: Raw user data:', user);

    // Extract branch information from various possible locations
    const branchId =
      user.branch_id || user.branchId || user.branch?.branch_id || null;

    const branchName =
      user.branch_name || user.branchName || user.branch?.branch_name || null;

    const userType = user.userType || user.user_type || user.type || null;

    console.log('📍 INFO SERVICE: Extracted branch info:', {
      branchId,
      branchName,
      userType,
    });

    return { branchId, branchName, userType };
  } catch (error) {
    console.error('📍 INFO SERVICE: Error getting user branch info:', error);
    return { branchId: null, branchName: null, userType: null };
  }
};

/**
 * Get selected branch ID for teachers (who can switch branches)
 * @returns {Promise<number|null>} Selected branch ID
 */
export const getSelectedBranchId = async () => {
  try {
    const savedBranchId = await AsyncStorage.getItem('selectedBranchId');
    if (savedBranchId) {
      return parseInt(savedBranchId, 10);
    }
    return null;
  } catch (error) {
    console.error('📍 INFO SERVICE: Error getting selected branch ID:', error);
    return null;
  }
};

/**
 * Get all available user data for school resources
 * @returns {Promise<Array>} Array of all user data objects
 */
export const getAllUserData = async () => {
  const allUsers = [];

  try {
    // Check for direct login userData (teacher or student)
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      allUsers.push(user);
    }

    // Check for student accounts in parent system
    const studentAccountsStr = await AsyncStorage.getItem('studentAccounts');
    if (studentAccountsStr) {
      const studentAccounts = JSON.parse(studentAccountsStr);
      allUsers.push(...studentAccounts);
    }
  } catch (error) {
    console.error('📍 INFO SERVICE: Error getting all user data:', error);
  }

  return allUsers;
};

/**
 * Get unique branches from all user data
 * @returns {Promise<Array>} Array of unique branch objects
 */
export const getUniqueBranches = async () => {
  try {
    const allUsers = await getAllUserData();
    const branchMap = new Map();

    allUsers.forEach((user) => {
      const branchId =
        user.branch_id || user.branchId || user.branch?.branch_id;
      const branchName =
        user.branch_name || user.branchName || user.branch?.branch_name;

      if (branchId && branchName) {
        branchMap.set(branchId, {
          branchId,
          branchName,
          userType: user.userType,
          userName: user.name,
        });
      }
    });

    const uniqueBranches = Array.from(branchMap.values());
    console.log('📍 INFO SERVICE: Found unique branches:', uniqueBranches);

    return uniqueBranches;
  } catch (error) {
    console.error('📍 INFO SERVICE: Error getting unique branches:', error);
    return [];
  }
};

/**
 * Helper function to make API requests with proper error handling
 */
const makeInfoApiRequest = async (url, options = {}) => {
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
    console.error('Information API request failed:', error);
    throw error;
  }
};

// Mock data for testing
const mockAboutData = {
  success: true,
  about_information: [
    {
      about_info_id: 1,
      branch_id: 5,
      branch_name: 'Main Campus',
      branch_logo: 'https://sis.bfi.edu.mm/uploads/logos/main.png',
      sections: [
        {
          header: 'Our Mission',
          body: 'To provide quality education and foster innovation in learning, preparing students for success in an ever-changing world.',
        },
        {
          header: 'Our Vision',
          body: 'To be a leading educational institution that empowers students to become responsible global citizens and lifelong learners.',
        },
        {
          header: 'Our Values',
          body: 'Excellence, Integrity, Innovation, Collaboration, and Respect for diversity are the core values that guide our educational approach.',
        },
      ],
    },
    {
      about_info_id: 2,
      branch_id: 2,
      branch_name: 'Secondary Campus',
      branch_logo: 'https://sis.bfi.edu.mm/uploads/logos/secondary.png',
      sections: [
        {
          header: 'Our Mission',
          body: 'To provide specialized secondary education that prepares students for higher education and future careers.',
        },
        {
          header: 'Our Vision',
          body: 'To be a leading secondary education institution that develops critical thinking and leadership skills.',
        },
        {
          header: 'Our Values',
          body: 'Academic Excellence, Character Development, Innovation, and Community Service are our core values.',
        },
      ],
    },
  ],
  total_branches: 2,
  generated_at: new Date().toISOString(),
};

const mockContactsData = {
  success: true,
  contacts: [
    {
      branch_id: 5,
      branch_name: 'Main Campus',
      branch_email: 'info@bfi.edu.mm',
      branch_address: '123 Education Street, Yangon, Myanmar',
      branch_website: 'https://bfi.edu.mm',
      branch_phone: '+95-1-234-5678',
      branch_logo: 'https://sis.bfi.edu.mm/uploads/logos/main.png',
    },
    {
      branch_id: 2,
      branch_name: 'Secondary Campus',
      branch_email: 'secondary@bfi.edu.mm',
      branch_address: '456 Secondary Street, Yangon, Myanmar',
      branch_website: 'https://secondary.bfi.edu.mm',
      branch_phone: '+95-1-234-5679',
      branch_logo: 'https://sis.bfi.edu.mm/uploads/logos/secondary.png',
    },
  ],
  total_branches: 2,
  generated_at: new Date().toISOString(),
};

const mockFAQData = {
  success: true,
  faq_data: [
    {
      branch_id: 5,
      branch_name: 'Main Campus',
      faqs: [
        {
          faq_id: 1,
          question: 'What are the admission requirements?',
          answer:
            'Students must have completed high school with good grades and pass our entrance examination.',
        },
        {
          faq_id: 2,
          question: 'What is the academic calendar?',
          answer:
            'Our academic year runs from June to March, divided into two semesters with breaks in December and April.',
        },
        {
          faq_id: 3,
          question: 'How can I access my grades online?',
          answer:
            'Students can access their grades through the mobile app or web portal using their student credentials.',
        },
        {
          faq_id: 4,
          question: 'What support services are available?',
          answer:
            'We offer academic counseling, career guidance, library services, and health support for all students.',
        },
      ],
      total_faqs: 4,
    },
    {
      branch_id: 2,
      branch_name: 'Secondary Campus',
      faqs: [
        {
          faq_id: 5,
          question: 'What programs are offered at Secondary Campus?',
          answer:
            'We offer specialized secondary education programs including Science, Arts, and Commerce streams.',
        },
        {
          faq_id: 6,
          question: 'What are the class timings?',
          answer:
            'Classes run from 8:00 AM to 3:00 PM, Monday through Friday, with additional activities until 5:00 PM.',
        },
        {
          faq_id: 7,
          question: 'How do I apply for scholarships?',
          answer:
            'Scholarship applications are available through the student portal and must be submitted before the deadline.',
        },
      ],
      total_faqs: 3,
    },
  ],
  total_branches: 2,
  generated_at: new Date().toISOString(),
};

/**
 * Get About Us information
 * @param {number|null} branchId - Optional branch ID to filter results
 * @returns {Promise<Object>} About Us data with sections organized by branch
 */
export const getAboutUsData = async (branchId = null) => {
  try {
    if (USE_DUMMY_DATA) {
      console.log('📖 INFO SERVICE: Using mock About Us data');
      return mockAboutData;
    }

    const params = branchId ? { branch_id: branchId } : {};
    const url = buildApiUrl(Config.API_ENDPOINTS.GET_ABOUT_DATA, params);
    console.log('📖 INFO SERVICE: Fetching About Us data from:', url);
    console.log('📖 INFO SERVICE: Branch filter:', branchId || 'All branches');

    const response = await makeInfoApiRequest(url);
    console.log('📖 INFO SERVICE: About Us data received:', response);

    return response;
  } catch (error) {
    console.error('📖 INFO SERVICE: Error fetching About Us data:', error);

    // Fallback to mock data if API fails
    console.log(
      '📖 INFO SERVICE: API failed, falling back to mock About Us data'
    );
    return mockAboutData;
  }
};

/**
 * Get Contacts information
 * @param {number|null} branchId - Optional branch ID to filter results
 * @returns {Promise<Object>} Contacts data with branch information
 */
export const getContactsData = async (branchId = null) => {
  try {
    if (USE_DUMMY_DATA) {
      console.log('📞 INFO SERVICE: Using mock Contacts data');
      return mockContactsData;
    }

    const params = branchId ? { branch_id: branchId } : {};
    const url = buildApiUrl(Config.API_ENDPOINTS.GET_CONTACTS_DATA, params);
    console.log('📞 INFO SERVICE: Fetching Contacts data from:', url);
    console.log('📞 INFO SERVICE: Branch filter:', branchId || 'All branches');

    const response = await makeInfoApiRequest(url);
    console.log('📞 INFO SERVICE: Contacts data received:', response);

    return response;
  } catch (error) {
    console.error('📞 INFO SERVICE: Error fetching Contacts data:', error);

    // Fallback to mock data if API fails
    console.log(
      '📞 INFO SERVICE: API failed, falling back to mock Contacts data'
    );
    return mockContactsData;
  }
};

/**
 * Get FAQ information
 * @param {number|null} branchId - Optional branch ID to filter results
 * @returns {Promise<Object>} FAQ data organized by branch
 */
export const getFAQData = async (branchId = null) => {
  try {
    if (USE_DUMMY_DATA) {
      console.log('❓ INFO SERVICE: Using mock FAQ data');
      return mockFAQData;
    }

    const params = branchId ? { branch_id: branchId } : {};
    const url = buildApiUrl(Config.API_ENDPOINTS.GET_FAQ_DATA, params);
    console.log('❓ INFO SERVICE: Fetching FAQ data from:', url);
    console.log('❓ INFO SERVICE: Branch filter:', branchId || 'All branches');

    const response = await makeInfoApiRequest(url);
    console.log('❓ INFO SERVICE: FAQ data received:', response);

    return response;
  } catch (error) {
    console.error('❓ INFO SERVICE: Error fetching FAQ data:', error);

    // Fallback to mock data if API fails
    console.log('❓ INFO SERVICE: API failed, falling back to mock FAQ data');
    return mockFAQData;
  }
};

/**
 * Information Service Export
 */
export default {
  getAboutUsData,
  getContactsData,
  getFAQData,
  getAllUserData,
  getUniqueBranches,
};
