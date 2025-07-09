/**
 * Mock Google Calendar Service
 * Simulates Google Calendar functionality for development/testing
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Mock Google Calendar Service Class
 */
class MockGoogleCalendarService {
  constructor(schoolConfig) {
    this.schoolConfig = schoolConfig;
    this.isConfigured = false;
    this.isSignedIn = false;
    this.mockUser = null;
  }

  /**
   * Initialize Mock Google Calendar service
   * @param {Object} schoolConfig - School configuration
   * @returns {Promise<MockGoogleCalendarService>} Configured service instance
   */
  static async initialize(schoolConfig) {
    const service = new MockGoogleCalendarService(schoolConfig);
    
    if (schoolConfig.hasGoogleWorkspace && schoolConfig.googleConfig) {
      await service.configureGoogleSignIn();
    }
    
    return service;
  }

  /**
   * Mock configure Google Sign-In
   */
  async configureGoogleSignIn() {
    try {
      if (!this.schoolConfig.googleConfig) {
        throw new Error('Google configuration not available for this school');
      }

      this.isConfigured = true;
      
      console.log('✅ MOCK GOOGLE CALENDAR: Configured for school:', this.schoolConfig.name);
      console.log('🔒 MOCK GOOGLE CALENDAR: Domain restricted to:', this.schoolConfig.domain);
      
    } catch (error) {
      console.error('❌ MOCK GOOGLE CALENDAR: Configuration error:', error);
      throw error;
    }
  }

  /**
   * Mock sign in to Google account
   * @returns {Promise<Object>} Mock user info
   */
  async signIn() {
    try {
      if (!this.isConfigured) {
        throw new Error('Google Sign-In not configured');
      }

      // Simulate sign-in delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create mock user based on school domain
      this.mockUser = {
        user: {
          email: `demo.user@${this.schoolConfig.domain}`,
          name: 'Demo User',
          id: 'mock_google_user_123',
          photo: null
        },
        idToken: 'mock_id_token_123',
        accessToken: 'mock_access_token_123'
      };

      this.isSignedIn = true;
      
      console.log('✅ MOCK GOOGLE CALENDAR: Signed in successfully:', this.mockUser.user.email);
      
      // Save mock auth state
      await this.saveAuthState(this.mockUser);
      
      return this.mockUser;
      
    } catch (error) {
      console.error('❌ MOCK GOOGLE CALENDAR: Sign in error:', error);
      throw error;
    }
  }

  /**
   * Mock sign out from Google account
   */
  async signOut() {
    try {
      this.isSignedIn = false;
      this.mockUser = null;
      await this.clearAuthState();
      console.log('✅ MOCK GOOGLE CALENDAR: Signed out successfully');
    } catch (error) {
      console.error('❌ MOCK GOOGLE CALENDAR: Sign out error:', error);
    }
  }

  /**
   * Mock get calendar events
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Mock calendar events
   */
  async getCalendarEvents(options = {}) {
    try {
      if (!this.isSignedIn) {
        throw new Error('Not signed in to Google account');
      }

      const {
        timeMin = new Date().toISOString(),
        timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        maxResults = 50
      } = options;

      // Generate mock events
      const mockEvents = this.generateMockEvents(timeMin, timeMax, maxResults);

      console.log(`✅ MOCK GOOGLE CALENDAR: Generated ${mockEvents.length} mock events`);
      
      return mockEvents;
      
    } catch (error) {
      console.error('❌ MOCK GOOGLE CALENDAR: Error getting events:', error);
      throw error;
    }
  }

  /**
   * Generate mock calendar events
   * @param {string} timeMin - Start time
   * @param {string} timeMax - End time
   * @param {number} maxResults - Maximum results
   * @returns {Array} Mock events
   */
  generateMockEvents(timeMin, timeMax, maxResults) {
    const events = [];
    const startDate = new Date(timeMin);
    const endDate = new Date(timeMax);
    const calendarTypes = Object.keys(this.schoolConfig.googleConfig.calendarIds);

    // Generate events for each calendar type
    calendarTypes.forEach((calendarType, typeIndex) => {
      const eventsPerType = Math.floor(maxResults / calendarTypes.length);
      
      for (let i = 0; i < eventsPerType; i++) {
        const eventDate = new Date(startDate.getTime() + 
          Math.random() * (endDate.getTime() - startDate.getTime()));
        
        const eventEndDate = new Date(eventDate.getTime() + 60 * 60 * 1000); // 1 hour later

        const eventTemplates = {
          main: [
            'School Assembly',
            'Parent Meeting',
            'Staff Development',
            'School Board Meeting'
          ],
          academic: [
            'Math Competition',
            'Science Fair',
            'Literature Workshop',
            'Academic Awards Ceremony'
          ],
          sports: [
            'Basketball Game',
            'Soccer Practice',
            'Swimming Competition',
            'Track and Field Event'
          ],
          events: [
            'Cultural Festival',
            'Art Exhibition',
            'Music Concert',
            'Drama Performance'
          ]
        };

        const templates = eventTemplates[calendarType] || eventTemplates.main;
        const eventTitle = templates[Math.floor(Math.random() * templates.length)];

        events.push({
          id: `mock_event_${calendarType}_${i}`,
          summary: `${eventTitle} ${i + 1}`,
          description: `This is a mock ${calendarType} event for testing purposes. Generated by MockGoogleCalendarService.`,
          start: {
            dateTime: eventDate.toISOString(),
            timeZone: 'Asia/Yangon'
          },
          end: {
            dateTime: eventEndDate.toISOString(),
            timeZone: 'Asia/Yangon'
          },
          location: `${this.schoolConfig.name} Campus`,
          creator: {
            email: `admin@${this.schoolConfig.domain}`,
            displayName: 'School Admin'
          },
          calendarType: calendarType,
          status: 'confirmed',
          htmlLink: `https://calendar.google.com/event?eid=mock_${calendarType}_${i}`
        });
      }
    });

    // Sort events by start time
    events.sort((a, b) => new Date(a.start.dateTime) - new Date(b.start.dateTime));

    return events.slice(0, maxResults);
  }

  /**
   * Check if Google Calendar is available (always true for mock)
   * @returns {boolean} True
   */
  isGoogleCalendarAvailable() {
    return this.schoolConfig.hasGoogleWorkspace && 
           this.schoolConfig.features.googleCalendar &&
           this.schoolConfig.googleConfig !== null;
  }

  /**
   * Save mock authentication state
   * @param {Object} userInfo - User information
   */
  async saveAuthState(userInfo) {
    try {
      const authState = {
        userInfo,
        schoolId: this.schoolConfig.schoolId,
        timestamp: Date.now(),
        isMock: true
      };
      
      await AsyncStorage.setItem('mockGoogleAuthState', JSON.stringify(authState));
    } catch (error) {
      console.error('❌ MOCK GOOGLE CALENDAR: Error saving auth state:', error);
    }
  }

  /**
   * Clear mock authentication state
   */
  async clearAuthState() {
    try {
      await AsyncStorage.removeItem('mockGoogleAuthState');
    } catch (error) {
      console.error('❌ MOCK GOOGLE CALENDAR: Error clearing auth state:', error);
    }
  }

  /**
   * Check if user is signed in (mock)
   * @returns {Promise<boolean>} Sign-in status
   */
  async isSignedInAsync() {
    try {
      const authState = await AsyncStorage.getItem('mockGoogleAuthState');
      if (authState) {
        const parsed = JSON.parse(authState);
        this.isSignedIn = true;
        this.mockUser = parsed.userInfo;
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ MOCK GOOGLE CALENDAR: Error checking sign-in status:', error);
      return false;
    }
  }

  /**
   * Get current user (mock)
   * @returns {Object|null} Current user or null
   */
  getCurrentUser() {
    return this.mockUser;
  }
}

export default MockGoogleCalendarService;
