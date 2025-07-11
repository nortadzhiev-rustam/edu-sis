/**
 * Unified Calendar Service
 * Manages calendar data from multiple sources (Google Calendar, timetable, homework, etc.)
 */

import GoogleCalendarService from './googleCalendarService';
import ReadOnlyGoogleCalendarService from './readOnlyGoogleCalendarService';
import SchoolConfigService from './schoolConfigService';
import CalendarSecurityService from './calendarSecurityService';
import { Config, buildApiUrl } from '../config/env';

/**
 * Unified Calendar Service Class
 */
class CalendarService {
  constructor(schoolConfig, userData, options = {}) {
    this.schoolConfig = schoolConfig;
    this.userData = userData;
    this.googleCalendarService = null;
    this.readOnlyGoogleCalendarService = null;
    this.eventCache = new Map(); // In-memory cache for better performance
    this.lastFetchTime = null;
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes cache

    // Calendar mode configuration
    this.calendarMode = options.mode || 'combined'; // 'branch-only' or 'combined'
    this.includePersonalEvents = this.calendarMode === 'combined';

    console.log(
      `📅 CALENDAR SERVICE: Initialized in ${this.calendarMode} mode`
    );
    console.log(
      `📅 CALENDAR SERVICE: Personal events ${
        this.includePersonalEvents ? 'enabled' : 'disabled'
      }`
    );
  }

  /**
   * Initialize calendar service for a user
   * @param {Object} userData - User data from login
   * @param {Object} options - Service options (mode: 'branch-only' or 'combined')
   * @returns {Promise<CalendarService>} Configured service instance
   */
  static async initialize(userData, options = {}) {
    try {
      // Get school configuration
      const schoolConfig = await SchoolConfigService.getCurrentSchoolConfig();
      if (!schoolConfig) {
        throw new Error('School configuration not found');
      }

      const service = new CalendarService(schoolConfig, userData, options);

      // Initialize Google Calendar services if available
      console.log(
        '🔍 CALENDAR SERVICE: Checking Google Calendar configuration...'
      );
      console.log('   hasGoogleWorkspace:', schoolConfig.hasGoogleWorkspace);
      console.log('   googleCalendar:', schoolConfig.features.googleCalendar);
      console.log(
        '   googleCalendarReadOnly:',
        schoolConfig.features.googleCalendarReadOnly
      );

      if (
        schoolConfig.hasGoogleWorkspace &&
        schoolConfig.features.googleCalendar
      ) {
        // Always use read-only service for schools (preferred approach)
        const useReadOnly =
          schoolConfig.features.googleCalendarReadOnly !== false;
        console.log(
          '🎯 CALENDAR SERVICE: Should use read-only service:',
          useReadOnly
        );

        if (useReadOnly) {
          try {
            console.log(
              '🚀 CALENDAR SERVICE: Initializing read-only Google Calendar service...'
            );
            service.readOnlyGoogleCalendarService =
              await ReadOnlyGoogleCalendarService.initialize(
                schoolConfig,
                userData
              );
            console.log(
              '📖 CALENDAR SERVICE: Using read-only Google Calendar (no sign-in required)'
            );
            console.log(
              '🏢 CALENDAR SERVICE: Branch-based calendar access enabled'
            );
          } catch (error) {
            console.error(
              '❌ CALENDAR SERVICE: Read-only service initialization failed:',
              error
            );
            console.log(
              '🔄 CALENDAR SERVICE: Falling back to interactive service...'
            );
            service.googleCalendarService =
              await GoogleCalendarService.initialize(schoolConfig);
            console.log(
              '🔐 CALENDAR SERVICE: Using interactive Google Calendar (sign-in required) as fallback'
            );
          }
        } else {
          // Only use interactive service if explicitly disabled read-only
          console.log(
            '🚀 CALENDAR SERVICE: Initializing interactive Google Calendar service...'
          );
          service.googleCalendarService =
            await GoogleCalendarService.initialize(schoolConfig);
          console.log(
            '🔐 CALENDAR SERVICE: Using interactive Google Calendar (sign-in required)'
          );
        }
      } else {
        console.log(
          '❌ CALENDAR SERVICE: Google Calendar not available for this school'
        );
      }

      console.log(
        '✅ CALENDAR SERVICE: Initialized for school:',
        schoolConfig.name
      );
      console.log(
        '📅 CALENDAR SERVICE: Google Calendar available:',
        !!(
          service.googleCalendarService || service.readOnlyGoogleCalendarService
        )
      );
      // Get branch information - handle different user types
      const branchId =
        userData.branchId || userData.branch_id || userData.branch?.branch_id;
      const branchName =
        userData.branchName ||
        userData.branch_name ||
        userData.branch?.branch_name;

      console.log(
        '🏢 CALENDAR SERVICE: User branch:',
        branchId || 'default',
        branchName || 'Unknown'
      );

      return service;
    } catch (error) {
      console.error('❌ CALENDAR SERVICE: Initialization error:', error);
      throw error;
    }
  }

  /**
   * Get calendar events until March 20th
   * @param {number} year - Year (defaults to current year)
   * @param {boolean} forceRefresh - Force refresh cache
   * @returns {Promise<Array>} Calendar events until March 20
   */
  async getEventsUntilMarch20(year = null, forceRefresh = false) {
    try {
      const currentYear = year || new Date().getFullYear();
      const startDate = new Date(); // Start from today
      const endDate = new Date(currentYear, 2, 20); // March 20 (month is 0-indexed)

      console.log(
        `📅 CALENDAR SERVICE: Fetching events until March 20, ${currentYear}`
      );
      console.log(
        `📅 Date range: ${startDate.toDateString()} to ${endDate.toDateString()}`
      );

      // If March 20 has already passed this year, fetch for next year
      if (endDate < startDate) {
        const nextYear = currentYear + 1;
        const nextYearEndDate = new Date(nextYear, 2, 20);
        console.log(
          `📅 CALENDAR SERVICE: March 20 has passed, fetching for ${nextYear}`
        );
        console.log(
          `📅 Updated date range: ${startDate.toDateString()} to ${nextYearEndDate.toDateString()}`
        );

        return await this.getAllEvents({
          startDate,
          endDate: nextYearEndDate,
          forceRefresh,
        });
      }

      return await this.getAllEvents({
        startDate,
        endDate,
        forceRefresh,
      });
    } catch (error) {
      console.error(
        '❌ CALENDAR SERVICE: Error fetching events until March 20:',
        error
      );
      throw error;
    }
  }

  /**
   * Get all calendar events from multiple sources
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Unified calendar events
   */
  async getAllEvents(options = {}) {
    try {
      const {
        startDate = new Date(),
        endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        forceRefresh = false,
      } = options;

      // Check rate limiting
      const rateLimitOk = await CalendarSecurityService.checkRateLimit(
        this.userData.id,
        'fetch_events'
      );

      if (!rateLimitOk) {
        throw new Error('Too many requests. Please try again later.');
      }

      // Check cache first (unless force refresh)
      if (!forceRefresh && this.isCacheValid()) {
        const cacheKey = this.getCacheKey(options);
        const cachedEvents = this.eventCache.get(cacheKey);

        if (cachedEvents) {
          console.log('📱 CALENDAR SERVICE: Returning cached events');
          return cachedEvents;
        }
      }

      const allEvents = [];

      console.log(
        `📅 CALENDAR SERVICE: Starting getAllEvents for ${this.userData.userType} user`
      );
      console.log(
        `📅 Date range: ${startDate.toDateString()} to ${endDate.toDateString()}`
      );
      console.log(
        `🔑 Auth code available: ${this.userData.authCode ? 'Yes' : 'No'}`
      );

      // Fetch from different sources in parallel
      const promises = [];

      // Calendar events from backend API (Google Workspace + Local + Academic)
      promises.push(
        this.getCalendarDataFromAPI(startDate, endDate).catch((error) => {
          console.error(
            '❌ CALENDAR SERVICE: Backend API calendar error:',
            error
          );
          return []; // Return empty array on error
        })
      );

      // Personal events (homework, exams, birthdays) - only if enabled
      if (this.includePersonalEvents) {
        console.log(
          '📅 CALENDAR SERVICE: Including personal events in calendar data'
        );
        promises.push(
          this.getPersonalEvents(
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
          ).catch((error) => {
            console.error('❌ CALENDAR SERVICE: Personal events error:', error);
            return []; // Return empty array on error
          })
        );
      } else {
        console.log(
          '📅 CALENDAR SERVICE: Skipping personal events (branch-only mode)'
        );
      }

      // Skip timetable events for now - causing network errors
      // TODO: Enable when timetable API is fixed
      // if (includeTimetable) {
      //   promises.push(
      //     this.getTimetableEvents(startDate, endDate).catch((error) => {
      //       console.error('❌ CALENDAR SERVICE: Timetable error:', error);
      //       return [];
      //     })
      //   );
      // }

      // Skip homework events for now - causing 404 errors
      // TODO: Enable when homework API is fixed
      // if (includeHomework) {
      //   promises.push(
      //     this.getHomeworkEvents(startDate, endDate).catch((error) => {
      //       console.error('❌ CALENDAR SERVICE: Homework error:', error);
      //       return [];
      //     })
      //   );
      // }

      // Skip school events for now - may cause 404 errors
      // TODO: Enable when school events API is confirmed working
      // if (includeSchoolEvents) {
      //   promises.push(
      //     this.getSchoolEvents(startDate, endDate).catch((error) => {
      //       console.error('❌ CALENDAR SERVICE: School events error:', error);
      //       return [];
      //     })
      //   );
      // }

      // Skip notification events for now - may cause 404 errors
      // TODO: Enable when notification events API is confirmed working
      // if (includeNotifications) {
      //   promises.push(
      //     this.getNotificationEvents(startDate, endDate).catch((error) => {
      //       console.error('❌ CALENDAR SERVICE: Notification events error:', error);
      //       return [];
      //     })
      //   );
      // }

      // Wait for all promises to resolve
      const results = await Promise.all(promises);

      // Flatten and combine all events with error handling
      try {
        results.forEach((events, index) => {
          console.log(`🔍 CALENDAR SERVICE: Processing result ${index}:`, {
            isArray: Array.isArray(events),
            type: typeof events,
            length: events ? events.length : 'N/A',
          });

          if (Array.isArray(events)) {
            allEvents.push(...events);
          } else if (events) {
            console.warn(
              `⚠️ CALENDAR SERVICE: Result ${index} is not an array:`,
              events
            );
          }
        });
      } catch (error) {
        console.error('❌ CALENDAR SERVICE: Error processing results:', error);
      }

      console.log(
        `📅 CALENDAR SERVICE: Retrieved ${allEvents.length} total events from available sources`
      );

      // Only add sample events in demo mode
      try {
        if (allEvents.length === 0 && this.userData?.isDemoMode) {
          console.log('📅 CALENDAR SERVICE: Demo mode - adding sample events');
          const sampleEvents = this.generateSampleEvents(startDate, endDate);
          if (Array.isArray(sampleEvents)) {
            allEvents.push(...sampleEvents);
            console.log(
              `📅 CALENDAR SERVICE: Added ${sampleEvents.length} sample events for demo`
            );
          }
        } else if (allEvents.length === 0) {
          console.log(
            '📅 CALENDAR SERVICE: No events found - will show empty state'
          );
        }
      } catch (error) {
        console.error(
          '❌ CALENDAR SERVICE: Error in demo mode sample events:',
          error
        );
      }

      // Filter events based on user permissions
      let filteredEvents = [];
      try {
        filteredEvents = CalendarSecurityService.filterEventsForUser(
          allEvents,
          this.userData,
          this.schoolConfig
        );
        if (!Array.isArray(filteredEvents)) {
          console.warn(
            '⚠️ CALENDAR SERVICE: filterEventsForUser did not return array'
          );
          filteredEvents = [];
        }
      } catch (error) {
        console.error('❌ CALENDAR SERVICE: Error filtering events:', error);
        filteredEvents = allEvents; // Use unfiltered events as fallback
      }

      // Sanitize event data
      let sanitizedEvents = [];
      try {
        sanitizedEvents = filteredEvents.map((event) =>
          CalendarSecurityService.sanitizeEventData(event)
        );
      } catch (error) {
        console.error('❌ CALENDAR SERVICE: Error sanitizing events:', error);
        sanitizedEvents = filteredEvents; // Use unfiltered events as fallback
      }

      // Sort events by start time
      sanitizedEvents.sort((a, b) => {
        const aStart = new Date(
          a.startTime || a.start?.dateTime || a.start?.date
        );
        const bStart = new Date(
          b.startTime || b.start?.dateTime || b.start?.date
        );
        return aStart - bStart;
      });

      console.log(
        `✅ CALENDAR SERVICE: Retrieved ${allEvents.length} total events, ${sanitizedEvents.length} visible to user`
      );

      // Cache the results
      const cacheKey = this.getCacheKey(options);
      this.eventCache.set(cacheKey, sanitizedEvents);
      this.lastFetchTime = Date.now();

      // Log security event
      CalendarSecurityService.logSecurityEvent(
        'calendar_events_accessed',
        this.userData,
        {
          schoolId: this.schoolConfig.schoolId,
          totalEvents: allEvents.length,
          visibleEvents: sanitizedEvents.length,
          dateRange: { startDate, endDate },
        }
      );

      return sanitizedEvents;
    } catch (error) {
      console.error('❌ CALENDAR SERVICE: Error getting all events:', error);
      throw error;
    }
  }

  /**
   * Get calendar data from backend API
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Calendar events from all sources
   */
  async getCalendarDataFromAPI(startDate, endDate) {
    try {
      const authCode = this.userData.authCode;
      if (!authCode) {
        throw new Error('No authentication code available');
      }

      const startDateStr = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const endDateStr = endDate.toISOString().split('T')[0];

      const url = buildApiUrl(
        `/calendar/data?authCode=${authCode}&start_date=${startDateStr}&end_date=${endDateStr}`
      );

      console.log('� CALENDAR SERVICE: Fetching calendar data:', {
        url: url,
        authCode: authCode ? authCode.substring(0, 10) + '...' : 'null',
        userType: this.userData?.userType,
        username: this.userData?.username,
        startDate: startDateStr,
        endDate: endDateStr,
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(
          `Calendar API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      console.log('🔍 CALENDAR SERVICE: API Response structure:', {
        success: data.success,
        total_branches: data.total_branches,
        has_branches: !!data.branches,
        branches_type: Array.isArray(data.branches)
          ? 'array'
          : typeof data.branches,
        branches_length: data.branches ? data.branches.length : 'N/A',
        message: data.message,
        full_response: JSON.stringify(data).substring(0, 200) + '...',
      });

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch calendar data');
      }

      console.log(
        `✅ CALENDAR SERVICE: Retrieved calendar data for ${data.total_branches} branch(es)`
      );

      // Log summary of events by source
      if (data.branches && data.branches.length > 0) {
        data.branches.forEach((branch) => {
          const summary = branch.calendar_data.summary;
          console.log(
            `📊 Branch ${branch.branch_name}: ${summary.total_events} total events (Google: ${summary.google_events_count}, Local: ${summary.local_events_count}, Academic: ${summary.academic_events_count})`
          );
        });
      }

      // Transform API response to unified event format
      return this.transformAPIResponseToEvents(data);
    } catch (error) {
      console.error('❌ CALENDAR SERVICE: API calendar events error:', error);
      return [];
    }
  }

  /**
   * Test calendar connection (Staff only)
   * @param {number} branchId - Branch ID to test
   * @returns {Promise<Object>} Test results
   */
  async testCalendarConnection(branchId) {
    try {
      const authCode = this.userData.authCode;
      if (!authCode) {
        throw new Error('No authentication code available');
      }

      // Check if user is staff
      if (
        this.userData.userType !== 'staff' &&
        this.userData.userType !== 'teacher'
      ) {
        throw new Error(
          'Calendar connection test is only available for staff users'
        );
      }

      const url = buildApiUrl(
        `/mobile-api/calendar/test-connection?authCode=${authCode}&branch_id=${branchId}`
      );

      console.log('🧪 CALENDAR SERVICE: Testing calendar connection...');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(
          `Calendar test API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to test calendar connection');
      }

      console.log(
        `✅ CALENDAR SERVICE: Calendar connection test completed for branch ${branchId}`
      );
      console.log(
        `📊 Test Results: ${data.data.successful_connections}/${data.data.total_calendars} calendars accessible`
      );

      return data;
    } catch (error) {
      console.error(
        '❌ CALENDAR SERVICE: Calendar connection test error:',
        error
      );
      throw error;
    }
  }

  /**
   * Generate sample events for testing calendar view
   * TODO: Remove when backend APIs are ready
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Sample events
   */
  generateSampleEvents(startDate, endDate) {
    const events = [];
    const today = new Date();

    // Generate events for the next 14 days
    for (let i = 0; i < 14; i++) {
      const eventDate = new Date(today);
      eventDate.setDate(today.getDate() + i);

      // Skip if outside date range
      if (eventDate < startDate || eventDate > endDate) continue;

      // Add 1-2 random events per day
      const eventsPerDay = Math.floor(Math.random() * 2) + 1;

      for (let j = 0; j < eventsPerDay; j++) {
        const startHour = Math.floor(Math.random() * 8) + 9; // 9 AM to 5 PM
        const startMinute = Math.random() > 0.5 ? 0 : 30;

        const startTime = new Date(eventDate);
        startTime.setHours(startHour, startMinute, 0, 0);

        const endTime = new Date(startTime);
        endTime.setHours(startTime.getHours() + 1); // 1 hour duration

        const calendarTypes = [
          'academic',
          'school_events',
          'google_workspace',
          'timetable',
        ];
        const calendarType =
          calendarTypes[Math.floor(Math.random() * calendarTypes.length)];

        const eventTitles = {
          academic: [
            'Math Class',
            'Science Lab',
            'Literature Workshop',
            'History Lesson',
          ],
          school_events: [
            'School Assembly',
            'Parent Meeting',
            'Cultural Festival',
            'Sports Day',
          ],
          google_workspace: [
            'Staff Meeting',
            'Training Session',
            'Workshop',
            'Conference',
          ],
          timetable: ['Period 1', 'Period 2', 'Period 3', 'Break Time'],
        };

        const titles = eventTitles[calendarType] || eventTitles.academic; // Fallback to academic
        const title = titles[Math.floor(Math.random() * titles.length)];

        events.push({
          id: `sample_${i}_${j}_${Date.now()}`,
          title: `${title}`,
          description: `Sample ${calendarType} event for testing calendar view`,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          isAllDay: false,
          location: 'School Campus',
          source: 'sample_data',
          calendarType: calendarType,
          branchId: this.userData.branchId || 'primary',
          branchName: this.userData.branchName || 'Primary',
          isReadOnly: true,
          color: this.getEventColor(calendarType),
          status: 'confirmed',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return events.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }

  /**
   * Transform API response to unified event format
   * @param {Object} apiResponse - API response data
   * @returns {Array} Unified events array
   */
  transformAPIResponseToEvents(apiResponse) {
    const allEvents = [];

    // Check if apiResponse and branches exist
    if (
      !apiResponse ||
      !apiResponse.branches ||
      !Array.isArray(apiResponse.branches)
    ) {
      console.log('⚠️ CALENDAR SERVICE: No branches data in API response');
      return allEvents;
    }

    apiResponse.branches.forEach((branch) => {
      // Check if branch has required data
      if (!branch || !branch.calendar_data) {
        console.log(
          '⚠️ CALENDAR SERVICE: Branch missing calendar_data:',
          branch
        );
        return;
      }

      const branchId = branch.branch_id;
      const branchName = branch.branch_name;
      const calendarData = branch.calendar_data;

      // Transform Google Calendar events
      if (
        calendarData.google_calendar_events &&
        Array.isArray(calendarData.google_calendar_events)
      ) {
        calendarData.google_calendar_events.forEach((event) => {
          allEvents.push(
            this.transformGoogleCalendarEvent(event, branchId, branchName)
          );
        });
      }

      // Transform Local Global events
      if (
        calendarData.local_global_events &&
        Array.isArray(calendarData.local_global_events)
      ) {
        calendarData.local_global_events.forEach((event) => {
          allEvents.push(
            this.transformLocalGlobalEvent(event, branchId, branchName)
          );
        });
      }

      // Transform Academic Calendar events
      if (
        calendarData.academic_calendar_events &&
        Array.isArray(calendarData.academic_calendar_events)
      ) {
        calendarData.academic_calendar_events.forEach((event) => {
          allEvents.push(
            this.transformAcademicCalendarEvent(event, branchId, branchName)
          );
        });
      }
    });

    // Sort events by start time
    allEvents.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    console.log(
      `📊 CALENDAR SERVICE: Transformed ${allEvents.length} total events`
    );
    return allEvents;
  }

  /**
   * Transform Google Calendar event from API
   * @param {Object} event - Google Calendar event from API
   * @param {number} branchId - Branch ID
   * @param {string} branchName - Branch name
   * @returns {Object} Unified event object
   */
  transformGoogleCalendarEvent(event, branchId, branchName) {
    const startTime = event.is_all_day
      ? event.start_date
      : `${event.start_date}T${event.start_time || '00:00'}:00`;

    const endTime = event.is_all_day
      ? event.end_date
      : `${event.end_date}T${event.end_time || '23:59'}:59`;

    return {
      id: `google_${event.id}`,
      title: event.title || 'Untitled Event',
      description: event.description || '',
      startTime: startTime,
      endTime: endTime,
      isAllDay: event.is_all_day || false,
      location: event.location || '',
      source: 'google_calendar',
      calendarType: 'google_workspace',
      branchId: branchId,
      branchName: branchName,
      isReadOnly: true,
      color: this.getEventColor('google_workspace'),
      status: event.status || 'confirmed',
      calendarSource: event.calendar_source || {},
      createdAt: event.created_at,
      updatedAt: event.updated_at,
    };
  }

  /**
   * Transform Local Global event from API
   * @param {Object} event - Local Global event from API
   * @param {number} branchId - Branch ID
   * @param {string} branchName - Branch name
   * @returns {Object} Unified event object
   */
  transformLocalGlobalEvent(event, branchId, branchName) {
    const startTime = event.is_all_day
      ? event.start_date
      : `${event.start_date}T${event.start_time || '00:00'}:00`;

    const endTime = event.is_all_day
      ? event.end_date
      : `${event.end_date}T${event.end_time || '23:59'}:59`;

    return {
      id: `local_global_${event.id}`,
      title: event.title || 'School Event',
      description: event.description || '',
      startTime: startTime,
      endTime: endTime,
      isAllDay: event.is_all_day || false,
      location: event.location || '',
      source: 'local_global',
      calendarType: 'school_events',
      branchId: branchId,
      branchName: branchName,
      isReadOnly: true,
      color: this.getEventColor('school_events'),
      status: event.status || 'confirmed',
      createdAt: event.created_at,
      updatedAt: event.updated_at,
    };
  }

  /**
   * Transform Academic Calendar event from API
   * @param {Object} event - Academic Calendar event from API
   * @param {number} branchId - Branch ID
   * @param {string} branchName - Branch name
   * @returns {Object} Unified event object
   */
  transformAcademicCalendarEvent(event, branchId, branchName) {
    const startTime = event.is_all_day
      ? event.start_date
      : `${event.start_date}T${event.start_time || '00:00'}:00`;

    const endTime = event.is_all_day
      ? event.end_date
      : `${event.end_date}T${event.end_time || '23:59'}:59`;

    return {
      id: `academic_${event.id}`,
      title: event.title || 'Academic Event',
      description: event.description || '',
      startTime: startTime,
      endTime: endTime,
      isAllDay: event.is_all_day || false,
      location: event.location || '',
      source: 'academic_calendar',
      calendarType: 'academic',
      branchId: branchId,
      branchName: branchName,
      isReadOnly: true,
      color: this.getEventColor('academic'),
      status: event.status || 'confirmed',
      academicYearId: event.academic_year_id,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
    };
  }

  /**
   * Get upcoming calendar events from backend API (includes personal events)
   * @param {number} days - Number of days to look ahead (default: 30)
   * @returns {Promise<Array>} Upcoming calendar events
   */
  async getUpcomingEvents(days = 30) {
    try {
      const authCode = this.userData.authCode;
      if (!authCode) {
        throw new Error('No authentication code available');
      }

      // Fetch both regular calendar events and personal events
      const promises = [];

      // Regular upcoming events
      const upcomingUrl = buildApiUrl(
        `/mobile-api/calendar/upcoming?authCode=${authCode}&days=${days}`
      );

      promises.push(
        fetch(upcomingUrl, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        })
          .then(async (response) => {
            if (!response.ok) {
              throw new Error(
                `Upcoming calendar API error: ${response.status} ${response.statusText}`
              );
            }
            const data = await response.json();
            if (!data.success) {
              throw new Error(
                data.message || 'Failed to fetch upcoming calendar events'
              );
            }
            return this.transformAPIResponseToEvents(data);
          })
          .catch((error) => {
            console.error(
              '❌ CALENDAR SERVICE: Upcoming events API error:',
              error
            );
            return [];
          })
      );

      // Personal events for the same period - only if enabled
      let personalEventsPromise = Promise.resolve([]);
      if (this.includePersonalEvents) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);

        personalEventsPromise = this.getPersonalEvents(
          new Date().toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        ).catch((error) => {
          console.error(
            '❌ CALENDAR SERVICE: Personal upcoming events error:',
            error
          );
          return [];
        });

        promises.push(personalEventsPromise);
      }

      console.log(
        `📅 CALENDAR SERVICE: Fetching upcoming events for ${days} days ${
          this.includePersonalEvents
            ? '(including personal events)'
            : '(branch events only)'
        }...`
      );

      const results = await Promise.all(promises);
      const regularEvents = results[0] || [];
      const personalEvents = this.includePersonalEvents ? results[1] || [] : [];
      const allEvents = [...regularEvents, ...personalEvents];

      // Sort by date
      allEvents.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

      console.log(
        `✅ CALENDAR SERVICE: Retrieved ${regularEvents.length} regular + ${personalEvents.length} personal upcoming events`
      );

      return allEvents;
    } catch (error) {
      console.error('❌ CALENDAR SERVICE: Upcoming events error:', error);
      return [];
    }
  }

  /**
   * Get personal calendar events from backend API
   * Includes homework due dates, exam schedules, and student birthdays
   * @param {string} startDate - Start date in YYYY-MM-DD format (optional)
   * @param {string} endDate - End date in YYYY-MM-DD format (optional)
   * @returns {Promise<Array>} Personal calendar events
   */
  async getPersonalEvents(startDate = null, endDate = null) {
    try {
      // Check if demo mode is enabled
      if (Config.DEV.USE_DUMMY_DATA) {
        console.log('🎭 CALENDAR SERVICE: Using demo personal events data');
        const { getDemoPersonalCalendarData } = await import(
          './demoModeService'
        );
        const demoData = getDemoPersonalCalendarData(this.userData.userType);
        return this.transformPersonalEvents(demoData.personal_events || []);
      }

      const authCode = this.userData.authCode;
      if (!authCode) {
        throw new Error('No authentication code available');
      }

      // Build URL with parameters using buildApiUrl helper
      const params = { authCode };
      if (startDate) {
        params.start_date = startDate;
      }
      if (endDate) {
        params.end_date = endDate;
      }

      const url = buildApiUrl(
        Config.API_ENDPOINTS.GET_CALENDAR_PERSONAL,
        params
      );

      console.log(
        `📅 CALENDAR SERVICE: Fetching personal events${
          startDate && endDate ? ` from ${startDate} to ${endDate}` : ''
        }...`
      );
      console.log(`🔗 CALENDAR SERVICE: Request URL: ${url}`);
      console.log(
        `🔑 CALENDAR SERVICE: Using auth code: ${authCode.substring(
          0,
          8
        )}... (${this.userData.userType || 'unknown'} user)`
      );

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: Config.NETWORK.TIMEOUT,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `❌ CALENDAR SERVICE: Personal calendar API error: ${response.status} ${response.statusText}`,
          errorText
        );
        throw new Error(
          `Personal calendar API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log('📊 CALENDAR SERVICE: Personal events API response:', {
        success: data.success,
        user_type: data.user_type,
        total_events: data.total_events,
        events_count: data.personal_events?.length || 0,
      });

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch personal events');
      }

      console.log(
        `✅ CALENDAR SERVICE: Fetched ${
          data.personal_events?.length || 0
        } personal events for ${data.user_type || 'unknown'} user`
      );

      // Transform personal events to calendar format
      return this.transformPersonalEvents(data.personal_events || []);
    } catch (error) {
      console.error('❌ CALENDAR SERVICE: Personal events error:', error);

      // Fallback to demo data if API fails and demo mode is available
      if (!Config.DEV.USE_DUMMY_DATA) {
        console.log(
          '🔄 CALENDAR SERVICE: Falling back to demo data due to API error'
        );
        try {
          const { getDemoPersonalCalendarData } = await import(
            './demoModeService'
          );
          const demoData = getDemoPersonalCalendarData(this.userData.userType);
          return this.transformPersonalEvents(demoData.personal_events || []);
        } catch (demoError) {
          console.error(
            '❌ CALENDAR SERVICE: Demo data fallback failed:',
            demoError
          );
        }
      }

      // Return empty array if all else fails
      return [];
    }
  }

  /**
   * Transform personal events from API format to calendar format
   * @param {Array} personalEvents - Personal events from API
   * @returns {Array} Transformed calendar events
   */
  transformPersonalEvents(personalEvents) {
    return personalEvents.map((event) => {
      const startTime =
        event.start_date +
        (event.start_time ? `T${event.start_time}` : 'T00:00:00');
      const endTime =
        event.end_date + (event.end_time ? `T${event.end_time}` : 'T23:59:59');

      return {
        id: event.id,
        title: this.getPersonalEventTitle(event),
        description: event.description || '',
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        isAllDay: event.is_all_day || true,
        location: event.location || '',
        type: event.category || 'personal',
        subType: event.source || event.category,
        source: this.getPersonalEventSource(event.category),
        color: this.getPersonalEventColor(event.category, event.priority),
        canEdit: false,
        priority: event.priority || 'medium',
        status: event.status || 'scheduled',
        originalData: event,
      };
    });
  }

  /**
   * Get formatted title for personal events
   * @param {Object} event - Personal event
   * @returns {string} Formatted title
   */
  getPersonalEventTitle(event) {
    switch (event.category) {
      case 'homework':
        return `📚 ${event.title}`;
      case 'exam':
        return `📝 ${event.title}`;
      case 'birthday':
        return `🎂 ${event.title}`;
      default:
        return event.title;
    }
  }

  /**
   * Get source label for personal events
   * @param {string} category - Event category
   * @returns {string} Source label
   */
  getPersonalEventSource(category) {
    switch (category) {
      case 'homework':
        return 'Homework';
      case 'exam':
        return 'Exams';
      case 'birthday':
        return 'Birthdays';
      default:
        return 'Personal';
    }
  }

  /**
   * Get color for personal events based on category and priority
   * @param {string} category - Event category
   * @param {string} priority - Event priority
   * @returns {string} Color code
   */
  getPersonalEventColor(category, priority) {
    // High priority events get more urgent colors
    if (priority === 'high') {
      switch (category) {
        case 'homework':
          return '#FF3B30'; // Red for urgent homework
        case 'exam':
          return '#FF9500'; // Orange for urgent exams
        default:
          return '#FF3B30';
      }
    }

    // Default colors by category
    switch (category) {
      case 'homework':
        return '#007AFF'; // Blue for homework
      case 'exam':
        return '#FF9500'; // Orange for exams
      case 'birthday':
        return '#34C759'; // Green for birthdays
      default:
        return '#8E8E93'; // Gray for other events
    }
  }

  /**
   * Debug auth code usage - helps identify if correct auth code is being used
   * @returns {Object} Auth code debug information
   */
  debugAuthCode() {
    const authCode = this.userData.authCode;
    return {
      hasAuthCode: !!authCode,
      authCodePreview: authCode ? `${authCode.substring(0, 8)}...` : 'none',
      userType: this.userData.userType || 'unknown',
      userId: this.userData.id,
      username: this.userData.username || this.userData.name || 'unknown',
      fullUserData: {
        id: this.userData.id,
        userType: this.userData.userType,
        name: this.userData.name,
        username: this.userData.username,
        authCode: authCode ? `${authCode.substring(0, 8)}...` : 'none',
      },
    };
  }

  /**
   * Test personal calendar API connectivity
   * @param {boolean} useDemoMode - Whether to use demo mode for testing
   * @returns {Promise<Object>} Test results
   */
  async testPersonalCalendarAPI(useDemoMode = false) {
    const originalDemoMode = Config.DEV.USE_DUMMY_DATA;

    try {
      // Temporarily set demo mode for testing
      Config.DEV.USE_DUMMY_DATA = useDemoMode;

      console.log(
        `🧪 CALENDAR SERVICE: Testing personal calendar API (Demo: ${useDemoMode})`
      );

      const testResults = {
        success: true,
        demoMode: useDemoMode,
        tests: [],
        errors: [],
        apiEndpoint: buildApiUrl(Config.API_ENDPOINTS.GET_CALENDAR_PERSONAL, {
          authCode: this.userData.authCode,
        }),
      };

      // Test 1: Basic personal events fetch
      try {
        const startTime = Date.now();
        const events = await this.getPersonalEvents();
        const endTime = Date.now();

        testResults.tests.push({
          name: 'Basic Personal Events Fetch',
          success: true,
          eventCount: events.length,
          responseTime: endTime - startTime,
          sampleEvent: events[0] || null,
        });

        console.log(
          `✅ Test 1 passed: Fetched ${events.length} events in ${
            endTime - startTime
          }ms`
        );
      } catch (error) {
        testResults.tests.push({
          name: 'Basic Personal Events Fetch',
          success: false,
          error: error.message,
        });
        testResults.errors.push(error.message);
        console.error('❌ Test 1 failed:', error.message);
      }

      // Test 2: Date range filtering
      try {
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        const startTime = Date.now();
        const events = await this.getPersonalEvents(
          today.toISOString().split('T')[0],
          nextWeek.toISOString().split('T')[0]
        );
        const endTime = Date.now();

        testResults.tests.push({
          name: 'Date Range Filtering',
          success: true,
          eventCount: events.length,
          responseTime: endTime - startTime,
          dateRange: {
            start: today.toISOString().split('T')[0],
            end: nextWeek.toISOString().split('T')[0],
          },
        });

        console.log(
          `✅ Test 2 passed: Fetched ${
            events.length
          } events for date range in ${endTime - startTime}ms`
        );
      } catch (error) {
        testResults.tests.push({
          name: 'Date Range Filtering',
          success: false,
          error: error.message,
        });
        testResults.errors.push(error.message);
        console.error('❌ Test 2 failed:', error.message);
      }

      // Test 3: Event structure validation
      try {
        const events = await this.getPersonalEvents();
        if (events.length > 0) {
          const event = events[0];
          const requiredFields = [
            'id',
            'title',
            'description',
            'startTime',
            'endTime',
            'type',
            'source',
            'color',
          ];
          const missingFields = requiredFields.filter(
            (field) => !(field in event)
          );

          if (missingFields.length === 0) {
            testResults.tests.push({
              name: 'Event Structure Validation',
              success: true,
              validatedFields: requiredFields,
              sampleEvent: event,
            });
            console.log('✅ Test 3 passed: Event structure is valid');
          } else {
            throw new Error(
              `Missing required fields: ${missingFields.join(', ')}`
            );
          }
        } else {
          testResults.tests.push({
            name: 'Event Structure Validation',
            success: true,
            note: 'No events to validate',
          });
          console.log('⚠️ Test 3 skipped: No events to validate');
        }
      } catch (error) {
        testResults.tests.push({
          name: 'Event Structure Validation',
          success: false,
          error: error.message,
        });
        testResults.errors.push(error.message);
        console.error('❌ Test 3 failed:', error.message);
      }

      // Determine overall success
      testResults.success = testResults.errors.length === 0;

      console.log(
        `🏁 CALENDAR SERVICE: Personal calendar API test completed (${
          testResults.success ? 'PASSED' : 'FAILED'
        })`
      );

      return testResults;
    } finally {
      // Restore original demo mode setting
      Config.DEV.USE_DUMMY_DATA = originalDemoMode;
    }
  }

  /**
   * Get monthly calendar events from backend API (includes personal events)
   * @param {number} year - Year (2020-2030)
   * @param {number} month - Month (1-12)
   * @returns {Promise<Array>} Monthly calendar events
   */
  async getMonthlyEvents(year, month) {
    try {
      const authCode = this.userData.authCode;
      if (!authCode) {
        throw new Error('No authentication code available');
      }

      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      const targetYear = year || currentYear;
      const targetMonth = month || currentMonth;

      // Calculate start and end dates for the month
      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 0); // Last day of month

      // Fetch both regular calendar events and personal events
      const promises = [];

      // Regular monthly events
      const monthlyUrl = buildApiUrl(
        `/mobile-api/calendar/monthly?authCode=${authCode}&year=${targetYear}&month=${targetMonth}`
      );

      promises.push(
        fetch(monthlyUrl, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        })
          .then(async (response) => {
            if (!response.ok) {
              throw new Error(
                `Monthly calendar API error: ${response.status} ${response.statusText}`
              );
            }
            const data = await response.json();
            if (!data.success) {
              throw new Error(
                data.message || 'Failed to fetch monthly calendar events'
              );
            }
            return this.transformAPIResponseToEvents(data);
          })
          .catch((error) => {
            console.error(
              '❌ CALENDAR SERVICE: Monthly events API error:',
              error
            );
            return [];
          })
      );

      // Personal events for the same month - only if enabled
      let personalEventsPromise = Promise.resolve([]);
      if (this.includePersonalEvents) {
        personalEventsPromise = this.getPersonalEvents(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        ).catch((error) => {
          console.error(
            '❌ CALENDAR SERVICE: Personal monthly events error:',
            error
          );
          return [];
        });

        promises.push(personalEventsPromise);
      }

      console.log(
        `📅 CALENDAR SERVICE: Fetching monthly events for ${targetYear}-${targetMonth} ${
          this.includePersonalEvents
            ? '(including personal events)'
            : '(branch events only)'
        }...`
      );

      const results = await Promise.all(promises);
      const regularEvents = results[0] || [];
      const personalEvents = this.includePersonalEvents ? results[1] || [] : [];
      const allEvents = [...regularEvents, ...personalEvents];

      // Sort by date
      allEvents.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

      console.log(
        `✅ CALENDAR SERVICE: Retrieved ${regularEvents.length} regular + ${personalEvents.length} personal monthly events`
      );

      return allEvents;
    } catch (error) {
      console.error('❌ CALENDAR SERVICE: Monthly events error:', error);
      return [];
    }
  }

  /**
   * Get Google Calendar events (interactive - requires sign-in)
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Google Calendar events
   */
  async getGoogleCalendarEvents(startDate, endDate) {
    try {
      if (!this.googleCalendarService) {
        return [];
      }

      const events = await this.googleCalendarService.getCalendarEvents({
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        maxResults: 100,
      });

      // Transform Google Calendar events to unified format
      return events.map((event) => ({
        id: `google_${event.id}`,
        title: event.summary || 'Untitled Event',
        description: event.description || '',
        startTime: event.start?.dateTime || event.start?.date,
        endTime: event.end?.dateTime || event.end?.date,
        isAllDay: !event.start?.dateTime,
        location: event.location || '',
        type: 'google_calendar',
        subType: event.calendarType || 'general',
        source: 'Google Calendar',
        color: this.getEventColor('google_calendar', event.calendarType),
        canEdit: false,
        originalData: event,
      }));
    } catch (error) {
      console.error(
        '❌ CALENDAR SERVICE: Google Calendar events error:',
        error
      );
      return [];
    }
  }

  /**
   * Get timetable events
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Timetable events
   */
  async getTimetableEvents(startDate, endDate) {
    try {
      const endpoint =
        this.userData.userType === 'teacher'
          ? Config.API_ENDPOINTS.GET_TEACHER_TIMETABLE
          : Config.API_ENDPOINTS.GET_STUDENT_TIMETABLE;

      const url = buildApiUrl(endpoint, {
        authCode: this.userData.authCode,
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Timetable API error: ${response.status}`);
      }

      const data = await response.json();

      // Transform timetable data to calendar events
      return this.transformTimetableToEvents(data, startDate, endDate);
    } catch (error) {
      console.error('❌ CALENDAR SERVICE: Timetable events error:', error);
      return [];
    }
  }

  /**
   * Get homework events
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Homework events
   */
  async getHomeworkEvents(startDate, endDate) {
    try {
      const url = buildApiUrl(Config.API_ENDPOINTS.GET_STUDENT_HOMEWORK, {
        authCode: this.userData.authCode,
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Homework API error: ${response.status}`);
      }

      const data = await response.json();

      // Transform homework data to calendar events
      return this.transformHomeworkToEvents(data, startDate, endDate);
    } catch (error) {
      console.error('❌ CALENDAR SERVICE: Homework events error:', error);
      return [];
    }
  }

  /**
   * Get school events (announcements, holidays, etc.)
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} School events
   */
  async getSchoolEvents(startDate, endDate) {
    try {
      // This would be a new API endpoint for school events
      const url = buildApiUrl('/school-events', {
        schoolId: this.schoolConfig.schoolId,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // If endpoint doesn't exist yet, return empty array
        if (response.status === 404) {
          return [];
        }
        throw new Error(`School events API error: ${response.status}`);
      }

      const data = await response.json();

      // Transform school events data
      return this.transformSchoolEventsToEvents(data);
    } catch (error) {
      console.error('❌ CALENDAR SERVICE: School events error:', error);
      return [];
    }
  }

  /**
   * Transform timetable data to calendar events
   * @param {Object} timetableData - Timetable data from API
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Calendar events
   */
  transformTimetableToEvents(timetableData, startDate, endDate) {
    const events = [];

    if (!timetableData || !timetableData.success) {
      return events;
    }

    // Generate events for the date range
    const currentDate = new Date(startDate);
    const endDateTime = new Date(endDate);

    while (currentDate <= endDateTime) {
      const dayName = currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
      });

      // Get timetable for this day
      let dayTimetable = [];

      if (this.userData.userType === 'teacher' && timetableData.branches) {
        // Teacher timetable
        timetableData.branches.forEach((branch) => {
          if (branch.timetable) {
            const dayClasses = branch.timetable.filter(
              (item) =>
                item.day === dayName ||
                item.week_day === this.getDayNumber(dayName)
            );
            dayTimetable.push(...dayClasses);
          }
        });
      } else if (timetableData[dayName]) {
        // Student timetable
        dayTimetable = timetableData[dayName];
      }

      // Create events for each class
      dayTimetable.forEach((classItem, index) => {
        const eventDate = new Date(currentDate);
        const startTime = this.parseTimeSlot(
          classItem.time || `Period ${classItem.period || index + 1}`
        );

        events.push({
          id: `timetable_${eventDate.toISOString().split('T')[0]}_${index}`,
          title: classItem.subject || classItem.subject_name || 'Class',
          description: `Teacher: ${
            classItem.teacher || classItem.user?.name || 'TBA'
          }\nRoom: ${classItem.room || 'TBA'}`,
          startTime: new Date(
            eventDate.setHours(startTime.hour, startTime.minute)
          ).toISOString(),
          endTime: new Date(
            eventDate.setHours(startTime.hour + 1, startTime.minute)
          ).toISOString(),
          isAllDay: false,
          location: classItem.room || '',
          type: 'timetable',
          subType: 'class',
          source: 'Timetable',
          color: this.getEventColor('timetable', 'class'),
          canEdit: false,
          originalData: classItem,
        });
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return events;
  }

  /**
   * Transform homework data to calendar events
   * @param {Object} homeworkData - Homework data from API
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Calendar events
   */
  transformHomeworkToEvents(homeworkData, startDate, endDate) {
    const events = [];

    if (!homeworkData || !Array.isArray(homeworkData)) {
      return events;
    }

    homeworkData.forEach((homework) => {
      const dueDate = new Date(homework.deadline || homework.due_date);

      // Only include homework within date range
      if (dueDate >= startDate && dueDate <= endDate) {
        // Create due date event
        events.push({
          id: `homework_${homework.id}`,
          title: `📝 ${homework.title || homework.assignment_title}`,
          description: this.formatHomeworkDescription(homework),
          startTime: dueDate.toISOString(),
          endTime: dueDate.toISOString(),
          isAllDay: true,
          location: '',
          type: 'homework',
          subType: 'assignment',
          source: 'Homework',
          color: this.getEventColor('homework', 'assignment'),
          canEdit: false,
          priority: homework.priority || 'medium',
          status: homework.status || 'pending',
          originalData: homework,
        });

        // Add reminder event 1 day before due date if homework is important
        if (homework.priority === 'high' || homework.is_important) {
          const reminderDate = new Date(dueDate);
          reminderDate.setDate(reminderDate.getDate() - 1);

          if (reminderDate >= startDate && reminderDate <= endDate) {
            events.push({
              id: `homework_reminder_${homework.id}`,
              title: `⏰ Reminder: ${
                homework.title || homework.assignment_title
              }`,
              description: `Due tomorrow: ${
                homework.description || homework.assignment_description || ''
              }`,
              startTime: reminderDate.toISOString(),
              endTime: reminderDate.toISOString(),
              isAllDay: true,
              location: '',
              type: 'homework',
              subType: 'reminder',
              source: 'Homework Reminder',
              color: this.getEventColor('homework', 'reminder'),
              canEdit: false,
              originalData: homework,
            });
          }
        }
      }
    });

    return events;
  }

  /**
   * Format homework description with additional details
   * @param {Object} homework - Homework data
   * @returns {string} Formatted description
   */
  formatHomeworkDescription(homework) {
    let description =
      homework.description || homework.assignment_description || '';

    // Add subject information
    if (homework.subject || homework.subject_name) {
      description = `Subject: ${
        homework.subject || homework.subject_name
      }\n\n${description}`;
    }

    // Add teacher information
    if (homework.teacher || homework.teacher_name) {
      description += `\n\nTeacher: ${
        homework.teacher || homework.teacher_name
      }`;
    }

    // Add submission status
    if (homework.status) {
      description += `\nStatus: ${homework.status}`;
    }

    // Add file attachments info
    if (homework.homework_file || homework.attachments) {
      description += '\n\n📎 Has attachments';
    }

    return description.trim();
  }

  /**
   * Transform school events data to calendar events
   * @param {Array} schoolEventsData - School events data
   * @returns {Array} Calendar events
   */
  transformSchoolEventsToEvents(schoolEventsData) {
    if (!Array.isArray(schoolEventsData)) {
      return [];
    }

    return schoolEventsData.map((event) => ({
      id: `school_${event.id}`,
      title: event.title || event.name,
      description: event.description || '',
      startTime: event.start_date || event.date,
      endTime: event.end_date || event.date,
      isAllDay: event.is_all_day || false,
      location: event.location || '',
      type: 'school_event',
      subType: event.type || 'general',
      source: 'School Events',
      color: this.getEventColor('school_event', event.type),
      canEdit: false,
      originalData: event,
    }));
  }

  /**
   * Get event color based on type and subtype
   * @param {string} type - Event type
   * @param {string} subType - Event subtype
   * @returns {string} Color code
   */
  getEventColor(type, subType) {
    const colorMap = {
      google_calendar: {
        main: '#4285F4',
        academic: '#34A853',
        sports: '#EA4335',
        events: '#FBBC04',
        google_workspace: '#4285F4',
        holidays: '#9C27B0',
        staff: '#FF5722',
      },
      academic_calendar: {
        general: '#34A853',
        academic: '#34A853',
      },
      local_global: {
        general: '#2196F3',
        school_events: '#2196F3',
      },
      timetable: {
        class: '#007AFF',
      },
      homework: {
        assignment: '#FF9500',
        reminder: '#FF6B35',
      },
      school_event: {
        holiday: '#FF3B30',
        announcement: '#5856D6',
        general: '#8E8E93',
      },
      notification: {
        emergency: '#FF3B30',
        important: '#FF9500',
        bps: '#FF6B6B',
        health: '#4ECDC4',
        general: '#95A5A6',
      },
    };

    // Handle single parameter (backward compatibility)
    if (typeof type === 'string' && !subType) {
      const singleColorMap = {
        // Legacy single-parameter colors
        timetable: '#4CAF50',
        homework: '#FF9800',
        school_event: '#2196F3',
        notification: '#9C27B0',
        google_calendar: '#DB4437',

        // New API types
        google_workspace: '#4285F4',
        academic: '#34A853',
        school_events: '#2196F3',
        academic_calendar: '#34A853',
        local_global: '#2196F3',
        main: '#4285F4',
        sports: '#EA4335',
        events: '#FBBC04',
        holidays: '#9C27B0',
        staff: '#FF5722',
      };

      return singleColorMap[type] || '#8E8E93';
    }

    return colorMap[type]?.[subType] || colorMap[type]?.general || '#8E8E93';
  }

  /**
   * Get notification events from the notification system
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Notification events
   */
  async getNotificationEvents(startDate, endDate) {
    try {
      const url = buildApiUrl(Config.API_ENDPOINTS.GET_NOTIFICATIONS, {
        authCode: this.userData.authCode,
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Notifications API error: ${response.status}`);
      }

      const data = await response.json();

      // Transform notifications to calendar events
      return this.transformNotificationsToEvents(data, startDate, endDate);
    } catch (error) {
      console.error('❌ CALENDAR SERVICE: Notification events error:', error);
      return [];
    }
  }

  /**
   * Transform notifications to calendar events
   * @param {Object} notificationData - Notification data from API
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Calendar events
   */
  transformNotificationsToEvents(notificationData, startDate, endDate) {
    const events = [];

    if (!notificationData || !Array.isArray(notificationData)) {
      return events;
    }

    notificationData.forEach((notification) => {
      const notificationDate = new Date(
        notification.created_at || notification.date
      );

      // Only include notifications within date range
      if (notificationDate >= startDate && notificationDate <= endDate) {
        // Only add important notifications to calendar
        if (
          notification.priority === 'high' ||
          notification.type === 'emergency' ||
          notification.is_important
        ) {
          events.push({
            id: `notification_${notification.id}`,
            title: `🔔 ${notification.title || notification.message}`,
            description: this.formatNotificationDescription(notification),
            startTime: notificationDate.toISOString(),
            endTime: notificationDate.toISOString(),
            isAllDay: true,
            location: '',
            type: 'notification',
            subType: notification.type || 'general',
            source: 'Notifications',
            color: this.getEventColor('notification', notification.type),
            canEdit: false,
            priority: notification.priority || 'medium',
            originalData: notification,
          });
        }
      }
    });

    return events;
  }

  /**
   * Format notification description
   * @param {Object} notification - Notification data
   * @returns {string} Formatted description
   */
  formatNotificationDescription(notification) {
    let description = notification.message || notification.body || '';

    // Add category information
    if (notification.category) {
      description = `Category: ${notification.category}\n\n${description}`;
    }

    // Add sender information
    if (notification.sender || notification.from) {
      description += `\n\nFrom: ${notification.sender || notification.from}`;
    }

    // Add priority indicator
    if (notification.priority === 'high') {
      description = `⚠️ HIGH PRIORITY\n\n${description}`;
    }

    return description.trim();
  }

  /**
   * Parse time slot string to hour and minute
   * @param {string} timeSlot - Time slot string (e.g., "08:00-09:00" or "Period 1")
   * @returns {Object} Hour and minute
   */
  parseTimeSlot(timeSlot) {
    if (timeSlot.includes(':')) {
      const [time] = timeSlot.split('-');
      const [hour, minute] = time.split(':').map(Number);
      return { hour, minute };
    } else {
      // Default period times
      const periodTimes = {
        1: { hour: 8, minute: 0 },
        2: { hour: 9, minute: 15 },
        3: { hour: 10, minute: 30 },
        4: { hour: 11, minute: 45 },
        5: { hour: 13, minute: 30 },
        6: { hour: 14, minute: 45 },
        7: { hour: 16, minute: 0 },
      };

      const periodMatch = timeSlot.match(/(\d+)/);
      const period = periodMatch ? parseInt(periodMatch[1]) : 1;
      return periodTimes[period] || { hour: 8, minute: 0 };
    }
  }

  /**
   * Get day number (1 = Monday, 7 = Sunday)
   * @param {string} dayName - Day name
   * @returns {number} Day number
   */
  getDayNumber(dayName) {
    const dayMap = {
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
      Sunday: 7,
    };
    return dayMap[dayName] || 1;
  }

  /**
   * Sign in to Google Calendar (if available)
   * @returns {Promise<Object>} User info
   */
  async signInToGoogle() {
    // Check permissions
    if (
      !CalendarSecurityService.canAccessGoogleCalendar(
        this.userData,
        this.schoolConfig
      )
    ) {
      CalendarSecurityService.logSecurityEvent(
        'google_calendar_access_denied',
        this.userData,
        {
          reason: 'insufficient_permissions',
          schoolId: this.schoolConfig.schoolId,
        }
      );
      throw new Error('You do not have permission to access Google Calendar');
    }

    // Check rate limiting
    const rateLimitOk = await CalendarSecurityService.checkRateLimit(
      this.userData.id,
      'google_signin'
    );

    if (!rateLimitOk) {
      CalendarSecurityService.logSecurityEvent(
        'google_calendar_rate_limit_exceeded',
        this.userData,
        { action: 'google_signin', schoolId: this.schoolConfig.schoolId }
      );
      throw new Error('Too many sign-in attempts. Please try again later.');
    }

    if (!this.googleCalendarService) {
      throw new Error('Google Calendar not available for this school');
    }

    try {
      const userInfo = await this.googleCalendarService.signIn();

      // Validate domain restriction
      if (
        !CalendarSecurityService.validateGoogleCalendarDomain(
          userInfo.user.email,
          this.schoolConfig
        )
      ) {
        await this.googleCalendarService.signOut();
        CalendarSecurityService.logSecurityEvent(
          'google_calendar_domain_violation',
          this.userData,
          {
            attemptedEmail: userInfo.user.email,
            allowedDomain: this.schoolConfig.domain,
            schoolId: this.schoolConfig.schoolId,
          }
        );
        throw new Error(
          `Please sign in with your ${this.schoolConfig.domain} account`
        );
      }

      // Log successful sign-in
      CalendarSecurityService.logSecurityEvent(
        'google_calendar_signin_success',
        this.userData,
        {
          googleEmail: userInfo.user.email,
          schoolId: this.schoolConfig.schoolId,
        }
      );

      return userInfo;
    } catch (error) {
      CalendarSecurityService.logSecurityEvent(
        'google_calendar_signin_error',
        this.userData,
        {
          error: error.message,
          schoolId: this.schoolConfig.schoolId,
        }
      );
      throw error;
    }
  }

  /**
   * Sign out from Google Calendar
   */
  async signOutFromGoogle() {
    if (this.googleCalendarService) {
      await this.googleCalendarService.signOut();
    }
  }

  /**
   * Check if Google Calendar is available
   * @returns {boolean} True if available
   */
  isGoogleCalendarAvailable() {
    return !!(
      this.googleCalendarService?.isGoogleCalendarAvailable() ||
      this.readOnlyGoogleCalendarService?.isGoogleCalendarAvailable()
    );
  }

  /**
   * Check if cache is valid
   * @returns {boolean} True if cache is valid
   */
  isCacheValid() {
    if (!this.lastFetchTime) {
      return false;
    }

    const now = Date.now();
    return now - this.lastFetchTime < this.cacheDuration;
  }

  /**
   * Generate cache key for options
   * @param {Object} options - Query options
   * @returns {string} Cache key
   */
  getCacheKey(options) {
    const {
      startDate,
      endDate,
      includeGoogle,
      includeTimetable,
      includeHomework,
      includeSchoolEvents,
      includeNotifications,
    } = options;

    return `events_${
      this.userData.id
    }_${startDate?.toISOString()}_${endDate?.toISOString()}_${includeGoogle}_${includeTimetable}_${includeHomework}_${includeSchoolEvents}_${includeNotifications}`;
  }

  /**
   * Clear event cache
   */
  clearCache() {
    this.eventCache.clear();
    this.lastFetchTime = null;
    console.log('🗑️ CALENDAR SERVICE: Cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.eventCache.size,
      lastFetchTime: this.lastFetchTime,
      isValid: this.isCacheValid(),
      cacheDuration: this.cacheDuration,
    };
  }
}

export default CalendarService;
