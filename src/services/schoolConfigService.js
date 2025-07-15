/**
 * School Configuration Service
 * Manages multi-tenant school configurations for calendar integration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config, buildApiUrl } from '../config/env';

// Storage keys
const STORAGE_KEYS = {
  SCHOOL_CONFIG: 'schoolConfig',
  SCHOOL_LIST: 'schoolList',
};

// Default school configurations
const DEFAULT_SCHOOL_CONFIGS = {
  bfi_edu_mm: {
    schoolId: 'bfi_edu_mm',
    name: 'BFI International School',
    domain: 'bfi.edu.mm',
    hasGoogleWorkspace: true,
    googleConfig: {
      clientId: 'your-google-client-id.apps.googleusercontent.com',
      apiKey: 'your-google-api-key', // For read-only access
      calendarIds: {
        main: 'main@bfi.edu.mm',
        academic: 'academic@bfi.edu.mm',
        sports: 'sports@bfi.edu.mm',
        events: 'events@bfi.edu.mm',
        holidays: 'holidays@bfi.edu.mm',
        staff: 'staff@bfi.edu.mm',
      },
      // Branch-specific calendars
      branchCalendars: {
        primary: {
          academic: 'primary-academic@bfi.edu.mm',
          events: 'primary-events@bfi.edu.mm',
        },
        secondary: {
          academic: 'secondary-academic@bfi.edu.mm',
          events: 'secondary-events@bfi.edu.mm',
        },
        high_school: {
          academic: 'highschool-academic@bfi.edu.mm',
          events: 'highschool-events@bfi.edu.mm',
        },
      },
    },
    branding: {
      name: 'BFI International School',
      logo: {
        light: require('../../assets/app_logo.png'),
        dark: require('../../assets/app_logo_dark.png'),
      },
      colors: {
        primary: '#007AFF',
        secondary: '#5856D6',
        accent: '#FF9500',
      },
    },
    features: {
      googleCalendar: true,
      googleCalendarReadOnly: true, // Read-only access without sign-in
      nativeCalendar: false,
      customEvents: true,
      messaging: true,
      homework: true,
      attendance: true,
      bps: true,
      health: true,
    },
  },
  demo_school: {
    schoolId: 'demo_school',
    name: 'Demo School',
    domain: 'demo.edu',
    hasGoogleWorkspace: true, // Enable for read-only calendar demo
    googleConfig: {
      clientId: 'demo-google-client-id.apps.googleusercontent.com',
      apiKey: 'demo-google-api-key', // Mock API key for demo
      calendarIds: {
        main: 'main@demo.edu',
        academic: 'academic@demo.edu',
        sports: 'sports@demo.edu',
        events: 'events@demo.edu',
        holidays: 'holidays@demo.edu',
        staff: 'staff@demo.edu',
      },
      // Branch-specific calendars for demo
      branchCalendars: {
        primary: {
          academic: 'primary-academic@demo.edu',
          events: 'primary-events@demo.edu',
        },
        secondary: {
          academic: 'secondary-academic@demo.edu',
          events: 'secondary-events@demo.edu',
        },
        high_school: {
          academic: 'highschool-academic@demo.edu',
          events: 'highschool-events@demo.edu',
        },
      },
    },
    branding: {
      name: 'Demo School',
      logo: {
        light: require('../../assets/app_logo.png'),
        dark: require('../../assets/app_logo_dark.png'),
      },
      colors: {
        primary: '#007AFF',
        secondary: '#5856D6',
        accent: '#FF9500',
      },
    },
    features: {
      googleCalendar: true, // Enable Google Calendar
      googleCalendarReadOnly: true, // Enable read-only access
      nativeCalendar: false, // Disable native calendar in favor of Google
      customEvents: true,
      messaging: true,
      homework: true,
      attendance: true,
      bps: true,
      health: true,
    },
  },
};

/**
 * School Configuration Service Class
 */
class SchoolConfigService {
  /**
   * Detect school from user credentials during login
   * @param {string} username - User's username
   * @param {string} userType - User type (teacher/student)
   * @returns {Promise<Object>} School configuration
   */
  static async detectSchoolFromLogin(username, userType) {
    try {
      console.log('🏫 SCHOOL CONFIG: Detecting school for user:', username);

      // For demo mode, return demo school config
      if (username.startsWith('demo_')) {
        console.log('🎭 SCHOOL CONFIG: Demo mode detected');
        const demoConfig = DEFAULT_SCHOOL_CONFIGS.demo_school;
        console.log('🔍 SCHOOL CONFIG: Demo config details:');
        console.log('   hasGoogleWorkspace:', demoConfig.hasGoogleWorkspace);
        console.log('   googleCalendar:', demoConfig.features.googleCalendar);
        console.log(
          '   googleCalendarReadOnly:',
          demoConfig.features.googleCalendarReadOnly
        );
        return demoConfig;
      }

      // Try to detect from username pattern or API call
      const schoolId = await this.detectSchoolId(username, userType);
      const schoolConfig = await this.getSchoolConfig(schoolId);

      console.log('✅ SCHOOL CONFIG: School detected:', schoolConfig.name);
      return schoolConfig;
    } catch (error) {
      console.error('❌ SCHOOL CONFIG: Error detecting school:', error);
      // Fallback to default school
      return DEFAULT_SCHOOL_CONFIGS.bfi_edu_mm;
    }
  }

  /**
   * Detect school ID from username or API
   * @param {string} username - User's username
   * @param {string} userType - User type
   * @returns {Promise<string>} School ID
   */
  static async detectSchoolId(username, userType) {
    try {
      // Method 1: Try to detect from username pattern
      if (username.includes('@')) {
        const domain = username.split('@')[1];
        const schoolId = this.domainToSchoolId(domain);
        if (schoolId) {
          console.log(
            '🔍 SCHOOL CONFIG: Detected from email domain:',
            schoolId
          );
          return schoolId;
        }
      }

      // Method 2: Call backend API to detect school
      const response = await fetch(buildApiUrl('/detect-school'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          userType,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.schoolId) {
          console.log('🔍 SCHOOL CONFIG: Detected from API:', data.schoolId);
          return data.schoolId;
        }
      }

      // Method 3: Fallback - use default school
      console.log('🔍 SCHOOL CONFIG: Using default school (BFI)');
      return 'bfi_edu_mm';
    } catch (error) {
      console.error('❌ SCHOOL CONFIG: Error detecting school ID:', error);
      return 'bfi_edu_mm'; // Default fallback
    }
  }

  /**
   * Convert domain to school ID
   * @param {string} domain - Email domain
   * @returns {string|null} School ID or null
   */
  static domainToSchoolId(domain) {
    const domainMap = {
      'bfi.edu.mm': 'bfi_edu_mm',
      'yangon-international.edu': 'yangon_international',
      'horizon-academy.edu.mm': 'horizon_academy',
      'demo.edu': 'demo_school',
    };

    return domainMap[domain] || null;
  }

  /**
   * Get school configuration by ID
   * @param {string} schoolId - School identifier
   * @returns {Promise<Object>} School configuration
   */
  static async getSchoolConfig(schoolId) {
    try {
      // First try to get from local storage
      const cachedConfig = await this.getCachedSchoolConfig(schoolId);
      if (cachedConfig) {
        console.log('📱 SCHOOL CONFIG: Using cached config for:', schoolId);
        return cachedConfig;
      }

      // Try to get from API
      const apiConfig = await this.fetchSchoolConfigFromAPI(schoolId);
      if (apiConfig) {
        // Cache the config
        await this.cacheSchoolConfig(schoolId, apiConfig);
        console.log('🌐 SCHOOL CONFIG: Fetched from API for:', schoolId);
        return apiConfig;
      }

      // Fallback to default config
      const defaultConfig =
        DEFAULT_SCHOOL_CONFIGS[schoolId] || DEFAULT_SCHOOL_CONFIGS.bfi_edu_mm;
      console.log('🔄 SCHOOL CONFIG: Using default config for:', schoolId);
      return defaultConfig;
    } catch (error) {
      console.error('❌ SCHOOL CONFIG: Error getting school config:', error);
      return DEFAULT_SCHOOL_CONFIGS.bfi_edu_mm;
    }
  }

  /**
   * Get cached school configuration
   * @param {string} schoolId - School identifier
   * @returns {Promise<Object|null>} Cached configuration or null
   */
  static async getCachedSchoolConfig(schoolId) {
    try {
      const cached = await AsyncStorage.getItem(
        `${STORAGE_KEYS.SCHOOL_CONFIG}_${schoolId}`
      );
      if (cached) {
        const config = JSON.parse(cached);
        // Check if cache is still valid (24 hours)
        const cacheAge = Date.now() - config.cachedAt;
        if (cacheAge < 24 * 60 * 60 * 1000) {
          return config.data;
        }
      }
      return null;
    } catch (error) {
      console.error('❌ SCHOOL CONFIG: Error getting cached config:', error);
      return null;
    }
  }

  /**
   * Cache school configuration
   * @param {string} schoolId - School identifier
   * @param {Object} config - Configuration to cache
   */
  static async cacheSchoolConfig(schoolId, config) {
    try {
      const cacheData = {
        data: config,
        cachedAt: Date.now(),
      };
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.SCHOOL_CONFIG}_${schoolId}`,
        JSON.stringify(cacheData)
      );
      console.log('💾 SCHOOL CONFIG: Cached config for:', schoolId);
    } catch (error) {
      console.error('❌ SCHOOL CONFIG: Error caching config:', error);
    }
  }

  /**
   * Fetch school configuration from API
   * @param {string} schoolId - School identifier
   * @returns {Promise<Object|null>} API configuration or null
   */
  static async fetchSchoolConfigFromAPI(schoolId) {
    try {
      const response = await fetch(buildApiUrl(`/school-config/${schoolId}`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }

      return null;
    } catch (error) {
      console.error('❌ SCHOOL CONFIG: Error fetching from API:', error);
      return null;
    }
  }

  /**
   * Get current school configuration from storage
   * @returns {Promise<Object|null>} Current school configuration
   */
  static async getCurrentSchoolConfig() {
    try {
      const config = await AsyncStorage.getItem(STORAGE_KEYS.SCHOOL_CONFIG);
      return config ? JSON.parse(config) : null;
    } catch (error) {
      console.error('❌ SCHOOL CONFIG: Error getting current config:', error);
      return null;
    }
  }

  /**
   * Save current school configuration
   * @param {Object} config - School configuration to save
   */
  static async saveCurrentSchoolConfig(config) {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.SCHOOL_CONFIG,
        JSON.stringify(config)
      );
      console.log('💾 SCHOOL CONFIG: Saved current config for:', config.name);
    } catch (error) {
      console.error('❌ SCHOOL CONFIG: Error saving current config:', error);
    }
  }

  /**
   * Clear all cached school configurations
   */
  static async clearCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const schoolConfigKeys = keys.filter((key) =>
        key.startsWith(STORAGE_KEYS.SCHOOL_CONFIG)
      );

      await AsyncStorage.multiRemove(schoolConfigKeys);
      console.log('🗑️ SCHOOL CONFIG: Cleared all cached configurations');
    } catch (error) {
      console.error('❌ SCHOOL CONFIG: Error clearing cache:', error);
    }
  }
}

/**
 * Get the appropriate logo based on theme mode
 * @param {string} themeMode - 'light' or 'dark'
 * @returns {any} Logo image source
 */
export const getThemeLogo = (themeMode = 'light') => {
  // Use demo or production config based on environment
  const config = Config.DEMO_MODE ? demoSchoolConfig : bfiSchoolConfig;
  return config.branding.logo[themeMode] || config.branding.logo.light;
};

export default SchoolConfigService;
export { DEFAULT_SCHOOL_CONFIGS, STORAGE_KEYS };
