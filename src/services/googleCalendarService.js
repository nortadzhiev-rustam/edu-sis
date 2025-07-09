/**
 * Google Calendar Service
 * Handles Google Calendar API integration with multi-tenant support
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import SchoolConfigService from './schoolConfigService';
import MockGoogleCalendarService from './mockGoogleCalendarService';

// Force mock service for development/testing
// TODO: Enable real Google Sign-In when properly configured for production
let GoogleSignin = null;
let useMockService = true; // Force mock service for now

console.log('🎭 GOOGLE CALENDAR: Using Mock Service for development/testing');
console.log(
  '💡 GOOGLE CALENDAR: To use real Google Calendar, configure OAuth properly and set useMockService = false'
);

// Storage keys
const STORAGE_KEYS = {
  GOOGLE_AUTH_STATE: 'googleAuthState',
  CALENDAR_CACHE: 'calendarCache',
};

/**
 * Google Calendar Service Class
 */
class GoogleCalendarService {
  constructor(schoolConfig) {
    this.schoolConfig = schoolConfig;
    this.isConfigured = false;
    this.isSignedIn = false;
  }

  /**
   * Initialize Google Calendar service for a specific school
   * @param {Object} schoolConfig - School configuration
   * @returns {Promise<GoogleCalendarService|MockGoogleCalendarService>} Configured service instance
   */
  static async initialize(schoolConfig) {
    // Use mock service if real Google Sign-In is not available
    if (useMockService) {
      console.log('🎭 Using Mock Google Calendar Service for testing');
      return await MockGoogleCalendarService.initialize(schoolConfig);
    }

    const service = new GoogleCalendarService(schoolConfig);

    if (schoolConfig.hasGoogleWorkspace && schoolConfig.googleConfig) {
      await service.configureGoogleSignIn();
    }

    return service;
  }

  /**
   * Configure Google Sign-In for the school
   */
  async configureGoogleSignIn() {
    try {
      if (!GoogleSignin) {
        throw new Error('Google Sign-In package not available');
      }

      if (!this.schoolConfig.googleConfig) {
        throw new Error('Google configuration not available for this school');
      }

      const config = {
        webClientId: this.schoolConfig.googleConfig.clientId,
        offlineAccess: false,
        hostedDomain: this.schoolConfig.domain, // Restrict to school domain
        scopes: [
          'https://www.googleapis.com/auth/calendar.readonly',
          'https://www.googleapis.com/auth/calendar.events.readonly',
        ],
      };

      await GoogleSignin.configure(config);
      this.isConfigured = true;

      console.log(
        '✅ GOOGLE CALENDAR: Configured for school:',
        this.schoolConfig.name
      );
      console.log(
        '🔒 GOOGLE CALENDAR: Domain restricted to:',
        this.schoolConfig.domain
      );
    } catch (error) {
      console.error('❌ GOOGLE CALENDAR: Configuration error:', error);
      throw error;
    }
  }

  /**
   * Sign in to Google account
   * @returns {Promise<Object>} User info
   */
  async signIn() {
    try {
      if (!GoogleSignin) {
        throw new Error('Google Sign-In package not available');
      }

      if (!this.isConfigured) {
        throw new Error('Google Sign-In not configured');
      }

      // Check if already signed in
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (isSignedIn) {
        const userInfo = await GoogleSignin.getCurrentUser();
        this.isSignedIn = true;
        console.log(
          '✅ GOOGLE CALENDAR: Already signed in:',
          userInfo.user.email
        );
        return userInfo;
      }

      // Sign in
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      this.isSignedIn = true;

      // Verify domain restriction
      if (!userInfo.user.email.endsWith(`@${this.schoolConfig.domain}`)) {
        await this.signOut();
        throw new Error(
          `Please sign in with your ${this.schoolConfig.domain} account`
        );
      }

      console.log(
        '✅ GOOGLE CALENDAR: Signed in successfully:',
        userInfo.user.email
      );

      // Save auth state
      await this.saveAuthState(userInfo);

      return userInfo;
    } catch (error) {
      console.error('❌ GOOGLE CALENDAR: Sign in error:', error);
      throw error;
    }
  }

  /**
   * Sign out from Google account
   */
  async signOut() {
    try {
      await GoogleSignin.signOut();
      this.isSignedIn = false;
      await this.clearAuthState();
      console.log('✅ GOOGLE CALENDAR: Signed out successfully');
    } catch (error) {
      console.error('❌ GOOGLE CALENDAR: Sign out error:', error);
    }
  }

  /**
   * Get calendar events from all school calendars
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Calendar events
   */
  async getCalendarEvents(options = {}) {
    try {
      if (!this.isSignedIn) {
        throw new Error('Not signed in to Google account');
      }

      const {
        timeMin = new Date().toISOString(),
        timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        maxResults = 50,
      } = options;

      const allEvents = [];
      const calendarIds = this.schoolConfig.googleConfig.calendarIds;

      // Fetch events from all school calendars
      for (const [calendarType, calendarId] of Object.entries(calendarIds)) {
        try {
          const events = await this.fetchCalendarEvents(calendarId, {
            timeMin,
            timeMax,
            maxResults,
            singleEvents: true,
            orderBy: 'startTime',
          });

          // Add calendar type to each event
          const typedEvents = events.map((event) => ({
            ...event,
            calendarType,
            schoolId: this.schoolConfig.schoolId,
            source: 'google_calendar',
          }));

          allEvents.push(...typedEvents);
        } catch (error) {
          console.error(
            `❌ GOOGLE CALENDAR: Error fetching ${calendarType} calendar:`,
            error
          );
          // Continue with other calendars even if one fails
        }
      }

      // Sort events by start time
      allEvents.sort((a, b) => {
        const aStart = new Date(a.start?.dateTime || a.start?.date);
        const bStart = new Date(b.start?.dateTime || b.start?.date);
        return aStart - bStart;
      });

      console.log(
        `✅ GOOGLE CALENDAR: Fetched ${allEvents.length} events from ${
          Object.keys(calendarIds).length
        } calendars`
      );

      // Cache the events
      await this.cacheEvents(allEvents);

      return allEvents;
    } catch (error) {
      console.error('❌ GOOGLE CALENDAR: Error getting events:', error);

      // Try to return cached events as fallback
      const cachedEvents = await this.getCachedEvents();
      if (cachedEvents && cachedEvents.length > 0) {
        console.log('🔄 GOOGLE CALENDAR: Returning cached events as fallback');
        return cachedEvents;
      }

      throw error;
    }
  }

  /**
   * Fetch events from a specific calendar
   * @param {string} calendarId - Calendar ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} Calendar events
   */
  async fetchCalendarEvents(calendarId, params) {
    try {
      const tokens = await GoogleSignin.getTokens();
      const accessToken = tokens.accessToken;

      const queryParams = new URLSearchParams(params).toString();
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        calendarId
      )}/events?${queryParams}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(
          `Calendar API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error(
        '❌ GOOGLE CALENDAR: Error fetching calendar events:',
        error
      );
      throw error;
    }
  }

  /**
   * Check if Google Calendar is available for this school
   * @returns {boolean} True if Google Calendar is available
   */
  isGoogleCalendarAvailable() {
    return (
      (GoogleSignin !== null || useMockService) &&
      this.schoolConfig.hasGoogleWorkspace &&
      this.schoolConfig.features.googleCalendar &&
      this.schoolConfig.googleConfig !== null
    );
  }

  /**
   * Save authentication state
   * @param {Object} userInfo - User information
   */
  async saveAuthState(userInfo) {
    try {
      const authState = {
        userInfo,
        schoolId: this.schoolConfig.schoolId,
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem(
        STORAGE_KEYS.GOOGLE_AUTH_STATE,
        JSON.stringify(authState)
      );
    } catch (error) {
      console.error('❌ GOOGLE CALENDAR: Error saving auth state:', error);
    }
  }

  /**
   * Clear authentication state
   */
  async clearAuthState() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.GOOGLE_AUTH_STATE);
    } catch (error) {
      console.error('❌ GOOGLE CALENDAR: Error clearing auth state:', error);
    }
  }

  /**
   * Cache calendar events
   * @param {Array} events - Events to cache
   */
  async cacheEvents(events) {
    try {
      const cacheData = {
        events,
        schoolId: this.schoolConfig.schoolId,
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem(
        `${STORAGE_KEYS.CALENDAR_CACHE}_${this.schoolConfig.schoolId}`,
        JSON.stringify(cacheData)
      );
    } catch (error) {
      console.error('❌ GOOGLE CALENDAR: Error caching events:', error);
    }
  }

  /**
   * Get cached calendar events
   * @returns {Promise<Array|null>} Cached events or null
   */
  async getCachedEvents() {
    try {
      const cached = await AsyncStorage.getItem(
        `${STORAGE_KEYS.CALENDAR_CACHE}_${this.schoolConfig.schoolId}`
      );

      if (cached) {
        const cacheData = JSON.parse(cached);
        // Check if cache is still valid (1 hour)
        const cacheAge = Date.now() - cacheData.timestamp;
        if (cacheAge < 60 * 60 * 1000) {
          return cacheData.events;
        }
      }

      return null;
    } catch (error) {
      console.error('❌ GOOGLE CALENDAR: Error getting cached events:', error);
      return null;
    }
  }

  /**
   * Clear cached events
   */
  async clearCache() {
    try {
      await AsyncStorage.removeItem(
        `${STORAGE_KEYS.CALENDAR_CACHE}_${this.schoolConfig.schoolId}`
      );
    } catch (error) {
      console.error('❌ GOOGLE CALENDAR: Error clearing cache:', error);
    }
  }
}

export default GoogleCalendarService;
