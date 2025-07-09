/**
 * Read-Only Google Calendar Service
 * Fetches calendar events without user authentication using service account
 * Events are read-only, managed by admins via Google Calendar web/app
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Read-Only Google Calendar Service Class
 */
class ReadOnlyGoogleCalendarService {
  constructor(schoolConfig, userData) {
    this.schoolConfig = schoolConfig;
    this.userData = userData;
    this.isConfigured = false;
    this.apiKey = null;
  }

  /**
   * Initialize Read-Only Google Calendar service
   * @param {Object} schoolConfig - School configuration
   * @param {Object} userData - User data with branchId
   * @returns {Promise<ReadOnlyGoogleCalendarService>} Configured service instance
   */
  static async initialize(schoolConfig, userData) {
    const service = new ReadOnlyGoogleCalendarService(schoolConfig, userData);

    if (schoolConfig.hasGoogleWorkspace && schoolConfig.googleConfig) {
      await service.configure();
    }

    return service;
  }

  /**
   * Configure the service with API key
   */
  async configure() {
    try {
      if (!this.schoolConfig.googleConfig) {
        throw new Error('Google configuration not available for this school');
      }

      // Use API key for read-only access (no OAuth required)
      this.apiKey = this.schoolConfig.googleConfig.apiKey;

      // For development/testing, use mock data if no real API key
      if (!this.apiKey || this.apiKey === 'your-google-api-key') {
        console.log(
          '🎭 READ-ONLY GOOGLE CALENDAR: Using mock data for development'
        );
        this.useMockData = true;
      } else {
        console.log('🔑 READ-ONLY GOOGLE CALENDAR: Using real API key');
        this.useMockData = false;
      }

      this.isConfigured = true;

      console.log(
        '✅ READ-ONLY GOOGLE CALENDAR: Configured for school:',
        this.schoolConfig.name
      );
      console.log(
        '📊 READ-ONLY GOOGLE CALENDAR: Branch ID:',
        this.userData.branchId || this.userData.branch_id || 'default'
      );
    } catch (error) {
      console.error(
        '❌ READ-ONLY GOOGLE CALENDAR: Configuration error:',
        error
      );
      throw error;
    }
  }

  /**
   * Get calendar events for user's branch
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Calendar events
   */
  async getCalendarEvents(options = {}) {
    try {
      if (!this.isConfigured) {
        throw new Error('Service not configured');
      }

      const {
        timeMin = new Date().toISOString(),
        timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        maxResults = 100,
      } = options;

      const allEvents = [];

      // Get calendars for user's branch
      const branchCalendars = this.getBranchCalendars();

      // Use mock data if no real API key available
      if (this.useMockData) {
        console.log(
          '🎭 READ-ONLY GOOGLE CALENDAR: Generating mock events for branch-based calendar'
        );
        allEvents.push(
          ...this.generateMockBranchEvents(
            timeMin,
            timeMax,
            maxResults,
            branchCalendars
          )
        );
      } else {
        // Fetch events from each relevant calendar using real API
        for (const [calendarType, calendarId] of Object.entries(
          branchCalendars
        )) {
          try {
            const events = await this.fetchCalendarEvents(calendarId, {
              timeMin,
              timeMax,
              maxResults: Math.floor(
                maxResults / Object.keys(branchCalendars).length
              ),
              singleEvents: true,
              orderBy: 'startTime',
            });

            // Add calendar type and branch info to each event
            const typedEvents = events.map((event) => ({
              ...event,
              calendarType,
              branchId: this.userData.branchId,
              schoolId: this.schoolConfig.schoolId,
              source: 'google_calendar_readonly',
              isReadOnly: true,
            }));

            allEvents.push(...typedEvents);
          } catch (error) {
            console.error(
              `❌ READ-ONLY GOOGLE CALENDAR: Error fetching ${calendarType} calendar:`,
              error
            );
            // Continue with other calendars even if one fails
          }
        }
      }

      // Sort events by start time
      allEvents.sort((a, b) => {
        const aStart = new Date(a.start?.dateTime || a.start?.date);
        const bStart = new Date(b.start?.dateTime || b.start?.date);
        return aStart - bStart;
      });

      console.log(
        `✅ READ-ONLY GOOGLE CALENDAR: Fetched ${allEvents.length} events for branch ${this.userData.branchId}`
      );

      // Cache the events
      await this.cacheEvents(allEvents);

      return allEvents;
    } catch (error) {
      console.error(
        '❌ READ-ONLY GOOGLE CALENDAR: Error getting events:',
        error
      );

      // Try to return cached events as fallback
      const cachedEvents = await this.getCachedEvents();
      if (cachedEvents && cachedEvents.length > 0) {
        console.log(
          '🔄 READ-ONLY GOOGLE CALENDAR: Returning cached events as fallback'
        );
        return cachedEvents;
      }

      throw error;
    }
  }

  /**
   * Get calendars relevant to user's branch
   * @returns {Object} Branch-specific calendar IDs
   */
  getBranchCalendars() {
    const userBranch =
      this.userData.branchId || this.userData.branch_id || 'default';
    const userType = this.userData.userType || this.userData.user_type;

    // Base calendars that everyone sees
    const baseCalendars = {
      main: this.schoolConfig.googleConfig.calendarIds.main,
      holidays:
        this.schoolConfig.googleConfig.calendarIds.holidays ||
        this.schoolConfig.googleConfig.calendarIds.main,
    };

    // Branch-specific calendars
    const branchCalendars = {};

    // Add branch-specific academic calendar if available
    if (
      this.schoolConfig.googleConfig.branchCalendars &&
      this.schoolConfig.googleConfig.branchCalendars[userBranch]
    ) {
      const branchConfig =
        this.schoolConfig.googleConfig.branchCalendars[userBranch];
      branchCalendars.academic = branchConfig.academic;
      branchCalendars.events = branchConfig.events;
    } else {
      // Fallback to general academic calendar
      branchCalendars.academic =
        this.schoolConfig.googleConfig.calendarIds.academic;
      branchCalendars.events =
        this.schoolConfig.googleConfig.calendarIds.events;
    }

    // Add sports calendar for all users
    branchCalendars.sports = this.schoolConfig.googleConfig.calendarIds.sports;

    // Teachers get additional calendars
    if (userType === 'teacher' || userType === 'staff') {
      branchCalendars.staff =
        this.schoolConfig.googleConfig.calendarIds.staff || baseCalendars.main;
    }

    return { ...baseCalendars, ...branchCalendars };
  }

  /**
   * Fetch events from a specific calendar using API key
   * @param {string} calendarId - Calendar ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} Calendar events
   */
  async fetchCalendarEvents(calendarId, params) {
    try {
      const queryParams = new URLSearchParams({
        ...params,
        key: this.apiKey, // Use API key for authentication
      }).toString();

      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        calendarId
      )}/events?${queryParams}`;

      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(
            'Calendar access forbidden. Check API key and calendar permissions.'
          );
        } else if (response.status === 404) {
          throw new Error('Calendar not found. Check calendar ID.');
        }
        throw new Error(
          `Calendar API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error(
        '❌ READ-ONLY GOOGLE CALENDAR: Error fetching calendar events:',
        error
      );
      throw error;
    }
  }

  /**
   * Check if read-only Google Calendar is available
   * @returns {boolean} True if available
   */
  isGoogleCalendarAvailable() {
    return (
      this.schoolConfig.hasGoogleWorkspace &&
      this.schoolConfig.features.googleCalendar &&
      this.schoolConfig.googleConfig !== null &&
      this.schoolConfig.googleConfig.apiKey !== null
    );
  }

  /**
   * Cache calendar events
   * @param {Array} events - Events to cache
   */
  async cacheEvents(events) {
    try {
      const cacheData = {
        events,
        branchId: this.userData.branchId,
        schoolId: this.schoolConfig.schoolId,
        timestamp: Date.now(),
      };

      const cacheKey = `readonly_calendar_cache_${this.schoolConfig.schoolId}_${
        this.userData.branchId || 'default'
      }`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));

      console.log(
        '💾 READ-ONLY GOOGLE CALENDAR: Cached events for branch:',
        this.userData.branchId
      );
    } catch (error) {
      console.error(
        '❌ READ-ONLY GOOGLE CALENDAR: Error caching events:',
        error
      );
    }
  }

  /**
   * Get cached calendar events
   * @returns {Promise<Array|null>} Cached events or null
   */
  async getCachedEvents() {
    try {
      const cacheKey = `readonly_calendar_cache_${this.schoolConfig.schoolId}_${
        this.userData.branchId || 'default'
      }`;
      const cached = await AsyncStorage.getItem(cacheKey);

      if (cached) {
        const cacheData = JSON.parse(cached);
        // Check if cache is still valid (30 minutes)
        const cacheAge = Date.now() - cacheData.timestamp;
        if (cacheAge < 30 * 60 * 1000) {
          return cacheData.events;
        }
      }

      return null;
    } catch (error) {
      console.error(
        '❌ READ-ONLY GOOGLE CALENDAR: Error getting cached events:',
        error
      );
      return null;
    }
  }

  /**
   * Clear cached events
   */
  async clearCache() {
    try {
      const cacheKey = `readonly_calendar_cache_${this.schoolConfig.schoolId}_${
        this.userData.branchId || 'default'
      }`;
      await AsyncStorage.removeItem(cacheKey);
      console.log(
        '🗑️ READ-ONLY GOOGLE CALENDAR: Cache cleared for branch:',
        this.userData.branchId
      );
    } catch (error) {
      console.error(
        '❌ READ-ONLY GOOGLE CALENDAR: Error clearing cache:',
        error
      );
    }
  }

  /**
   * Generate mock events for branch-based calendar (for development/testing)
   * @param {string} timeMin - Start time
   * @param {string} timeMax - End time
   * @param {number} maxResults - Maximum results
   * @param {Object} branchCalendars - Branch calendars configuration
   * @returns {Array} Mock events
   */
  generateMockBranchEvents(timeMin, timeMax, maxResults, branchCalendars) {
    const events = [];
    const startDate = new Date(timeMin);
    const endDate = new Date(timeMax);
    const userBranch =
      this.userData.branchId || this.userData.branch_id || 'default';

    // Event templates by calendar type with branch-specific content
    const eventTemplates = {
      main: [
        'School Assembly',
        'Parent-Teacher Conference',
        'School Board Meeting',
        'Open House',
      ],
      academic: [
        `${userBranch.charAt(0).toUpperCase() + userBranch.slice(1)} Exam`,
        `${userBranch} Academic Meeting`,
        `${userBranch} Study Session`,
      ],
      sports: [
        'Basketball Tournament',
        'Soccer Practice',
        'Swimming Competition',
      ],
      events: [
        `${userBranch} Cultural Festival`,
        `${userBranch} Science Fair`,
        `${userBranch} Art Exhibition`,
      ],
      holidays: ['School Holiday', 'Public Holiday'],
    };

    // Generate events for each calendar type
    Object.entries(branchCalendars).forEach(([calendarType, calendarId]) => {
      const templates = eventTemplates[calendarType] || eventTemplates.main;
      const eventsPerType = Math.floor(
        maxResults / Object.keys(branchCalendars).length
      );

      for (let i = 0; i < eventsPerType && templates.length > 0; i++) {
        const eventDate = new Date(
          startDate.getTime() +
            Math.random() * (endDate.getTime() - startDate.getTime())
        );

        const eventEndDate = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours

        events.push({
          id: `mock_readonly_${calendarType}_${i}`,
          summary: `${templates[i % templates.length]} ${i + 1}`,
          description: `Branch-specific event for ${userBranch}. Read-only calendar managed by admins.`,
          start: {
            dateTime: eventDate.toISOString(),
            timeZone: 'Asia/Yangon',
          },
          end: {
            dateTime: eventEndDate.toISOString(),
            timeZone: 'Asia/Yangon',
          },
          location: `${this.schoolConfig.name} - ${userBranch} Campus`,
          calendarType: calendarType,
          branchId: userBranch,
          source: 'google_calendar_readonly_mock',
          isReadOnly: true,
          status: 'confirmed',
        });
      }
    });

    events.sort(
      (a, b) => new Date(a.start.dateTime) - new Date(b.start.dateTime)
    );
    return events;
  }

  /**
   * Get user's branch information
   * @returns {Object} Branch information
   */
  getBranchInfo() {
    return {
      branchId: this.userData.branchId || this.userData.branch_id || 'default',
      branchName:
        this.userData.branchName ||
        this.userData.branch_name ||
        'Default Branch',
      userType: this.userData.userType || this.userData.user_type,
      calendarsAccess: Object.keys(this.getBranchCalendars()),
    };
  }
}

export default ReadOnlyGoogleCalendarService;
