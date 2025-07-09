/**
 * Calendar Security Service
 * Handles permissions and security for calendar functionality
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Calendar Security Service Class
 */
class CalendarSecurityService {
  /**
   * Check if user has permission to access Google Calendar
   * @param {Object} userData - User data
   * @param {Object} schoolConfig - School configuration
   * @returns {boolean} True if user has permission
   */
  static canAccessGoogleCalendar(userData, schoolConfig) {
    // Check if school has Google Workspace
    if (
      !schoolConfig?.hasGoogleWorkspace ||
      !schoolConfig?.features?.googleCalendar
    ) {
      return false;
    }

    // Check user type permissions
    const userType = userData.userType || userData.user_type;

    switch (userType) {
      case 'teacher':
      case 'staff':
        // Teachers and staff can access Google Calendar
        return true;

      case 'student':
        // Students can access if school allows it
        return schoolConfig.features.studentGoogleCalendar !== false;

      case 'parent':
        // Parents can access if school allows it
        return schoolConfig.features.parentGoogleCalendar !== false;

      default:
        return false;
    }
  }

  /**
   * Check if user can create calendar events
   * @param {Object} userData - User data
   * @param {Object} schoolConfig - School configuration
   * @returns {boolean} True if user can create events
   */
  static canCreateCalendarEvents(userData, schoolConfig) {
    const userType = userData.userType || userData.user_type;

    switch (userType) {
      case 'teacher':
      case 'staff':
        // Teachers can create events in their subject calendars
        return (
          userData.permissions?.can_create_homework ||
          userData.permissions?.can_manage_events ||
          userData.role === 'admin'
        );

      case 'student':
        // Students typically cannot create calendar events
        return false;

      case 'parent':
        // Parents cannot create calendar events
        return false;

      default:
        return false;
    }
  }

  /**
   * Check if user can edit specific calendar event
   * @param {Object} userData - User data
   * @param {Object} event - Calendar event
   * @param {Object} schoolConfig - School configuration
   * @returns {boolean} True if user can edit event
   */
  static canEditCalendarEvent(userData, event, schoolConfig) {
    const userType = userData.userType || userData.user_type;

    // Admin can edit all events
    if (userData.role === 'admin' || userData.is_admin) {
      return true;
    }

    // Check event type permissions
    switch (event.type) {
      case 'google_calendar':
        // Google Calendar events - check if user created it
        return event.originalData?.creator?.email === userData.email;

      case 'homework':
        // Homework events - only teacher who created it
        return (
          userType === 'teacher' &&
          (event.originalData?.teacher_id === userData.id ||
            event.originalData?.created_by === userData.id)
        );

      case 'timetable':
        // Timetable events - only admin can edit
        return userData.role === 'admin';

      case 'school_event':
        // School events - admin or event creator
        return (
          userData.role === 'admin' ||
          event.originalData?.created_by === userData.id
        );

      default:
        return false;
    }
  }

  /**
   * Check if user can delete specific calendar event
   * @param {Object} userData - User data
   * @param {Object} event - Calendar event
   * @param {Object} schoolConfig - School configuration
   * @returns {boolean} True if user can delete event
   */
  static canDeleteCalendarEvent(userData, event, schoolConfig) {
    // Same permissions as edit for most cases
    return this.canEditCalendarEvent(userData, event, schoolConfig);
  }

  /**
   * Check if user can view specific calendar event
   * @param {Object} userData - User data
   * @param {Object} event - Calendar event
   * @param {Object} schoolConfig - School configuration
   * @returns {boolean} True if user can view event
   */
  static canViewCalendarEvent(userData, event, schoolConfig) {
    const userType = userData.userType || userData.user_type;

    // Check event type visibility
    switch (event.type) {
      case 'google_calendar':
        // Google Calendar events - check calendar access
        return this.canAccessGoogleCalendar(userData, schoolConfig);

      case 'homework':
        // Homework events - students see their own, teachers see their classes
        if (userType === 'student') {
          return (
            event.originalData?.student_id === userData.id ||
            event.originalData?.class_id === userData.class_id ||
            event.originalData?.grade === userData.grade
          );
        } else if (userType === 'teacher') {
          return true; // Teachers can see all homework
        }
        return false;

      case 'timetable':
        // Timetable events - users see their own schedule
        if (userType === 'student') {
          return (
            event.originalData?.class_id === userData.class_id ||
            event.originalData?.grade === userData.grade
          );
        } else if (userType === 'teacher') {
          return (
            event.originalData?.teacher_id === userData.id ||
            event.originalData?.subject_teacher === userData.id
          );
        }
        return false;

      case 'school_event':
        // School events - visible to all users of the school
        return true;

      case 'notification':
        // Notification events - check if user is recipient
        return (
          event.originalData?.recipient_id === userData.id ||
          event.originalData?.recipient_type === userType ||
          event.originalData?.is_public === true
        );

      default:
        return true; // Default to visible
    }
  }

  /**
   * Filter events based on user permissions
   * @param {Array} events - Array of calendar events
   * @param {Object} userData - User data
   * @param {Object} schoolConfig - School configuration
   * @returns {Array} Filtered events
   */
  static filterEventsForUser(events, userData, schoolConfig) {
    return events.filter((event) =>
      this.canViewCalendarEvent(userData, event, schoolConfig)
    );
  }

  /**
   * Validate Google Calendar domain restriction
   * @param {string} email - User email
   * @param {Object} schoolConfig - School configuration
   * @returns {boolean} True if email is from allowed domain
   */
  static validateGoogleCalendarDomain(email, schoolConfig) {
    if (!email || !schoolConfig?.domain) {
      return false;
    }

    // Check if email ends with school domain
    return email
      .toLowerCase()
      .endsWith(`@${schoolConfig.domain.toLowerCase()}`);
  }

  /**
   * Check rate limiting for calendar API calls
   * @param {string} userId - User ID
   * @param {string} action - Action type (e.g., 'fetch_events', 'create_event')
   * @returns {Promise<boolean>} True if action is allowed
   */
  static async checkRateLimit(userId, action) {
    try {
      const rateLimitKey = `rate_limit_${userId}_${action}`;
      const lastCallStr = await AsyncStorage.getItem(rateLimitKey);

      if (!lastCallStr) {
        // First call, allow it
        await AsyncStorage.setItem(
          rateLimitKey,
          JSON.stringify({
            count: 1,
            timestamp: Date.now(),
          })
        );
        return true;
      }

      const lastCall = JSON.parse(lastCallStr);
      const now = Date.now();
      const timeDiff = now - lastCall.timestamp;

      // Rate limits by action type
      const rateLimits = {
        fetch_events: { maxCalls: 10, windowMs: 60000 }, // 10 calls per minute
        create_event: { maxCalls: 5, windowMs: 300000 }, // 5 calls per 5 minutes
        edit_event: { maxCalls: 5, windowMs: 300000 },
        delete_event: { maxCalls: 3, windowMs: 300000 },
        google_signin: { maxCalls: 10, windowMs: 300000 }, // 10 calls per 5 minutes (more lenient for testing)
      };

      const limit = rateLimits[action] || { maxCalls: 10, windowMs: 60000 };

      if (timeDiff > limit.windowMs) {
        // Reset counter if window has passed
        await AsyncStorage.setItem(
          rateLimitKey,
          JSON.stringify({
            count: 1,
            timestamp: now,
          })
        );
        return true;
      }

      if (lastCall.count >= limit.maxCalls) {
        // Rate limit exceeded
        console.warn(
          `⚠️ SECURITY: Rate limit exceeded for user ${userId}, action ${action}`
        );
        return false;
      }

      // Increment counter
      await AsyncStorage.setItem(
        rateLimitKey,
        JSON.stringify({
          count: lastCall.count + 1,
          timestamp: lastCall.timestamp,
        })
      );

      return true;
    } catch (error) {
      console.error('❌ SECURITY: Rate limit check error:', error);
      // Allow action on error to avoid blocking users
      return true;
    }
  }

  /**
   * Sanitize event data before display
   * @param {Object} event - Calendar event
   * @returns {Object} Sanitized event
   */
  static sanitizeEventData(event) {
    // Remove sensitive fields
    const sanitized = { ...event };

    // Remove internal IDs and sensitive data
    if (sanitized.originalData) {
      const {
        internal_id,
        password,
        secret,
        private_notes,
        ...safeOriginalData
      } = sanitized.originalData;

      sanitized.originalData = safeOriginalData;
    }

    // Sanitize HTML content
    if (sanitized.description) {
      sanitized.description = this.sanitizeHtml(sanitized.description);
    }

    if (sanitized.title) {
      sanitized.title = this.sanitizeHtml(sanitized.title);
    }

    return sanitized;
  }

  /**
   * Basic HTML sanitization
   * @param {string} html - HTML string
   * @returns {string} Sanitized string
   */
  static sanitizeHtml(html) {
    if (typeof html !== 'string') {
      return '';
    }

    // Remove script tags and their content
    html = html.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ''
    );

    // Remove dangerous attributes
    html = html.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    html = html.replace(/\s*javascript\s*:/gi, '');

    // Remove style attributes (optional, for security)
    html = html.replace(/\s*style\s*=\s*["'][^"']*["']/gi, '');

    return html;
  }

  /**
   * Clear rate limiting for a specific user and action (for testing/debugging)
   * @param {string} userId - User ID
   * @param {string} action - Action type
   */
  static async clearRateLimit(userId, action) {
    try {
      const rateLimitKey = `rate_limit_${userId}_${action}`;
      await AsyncStorage.removeItem(rateLimitKey);
      console.log(
        `🗑️ SECURITY: Cleared rate limit for user ${userId}, action ${action}`
      );
    } catch (error) {
      console.error('❌ SECURITY: Error clearing rate limit:', error);
    }
  }

  /**
   * Clear all rate limits for a user (for testing/debugging)
   * @param {string} userId - User ID
   */
  static async clearAllRateLimits(userId) {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const rateLimitKeys = keys.filter((key) =>
        key.startsWith(`rate_limit_${userId}_`)
      );

      await AsyncStorage.multiRemove(rateLimitKeys);
      console.log(`🗑️ SECURITY: Cleared all rate limits for user ${userId}`);
    } catch (error) {
      console.error('❌ SECURITY: Error clearing all rate limits:', error);
    }
  }

  /**
   * Log security event
   * @param {string} event - Security event type
   * @param {Object} userData - User data
   * @param {Object} details - Additional details
   */
  static logSecurityEvent(event, userData, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      userId: userData.id,
      userType: userData.userType,
      schoolId: details.schoolId,
      details,
    };

    console.log('🔒 SECURITY LOG:', JSON.stringify(logEntry));

    // In production, send to security monitoring service
    // await sendToSecurityService(logEntry);
  }
}

export default CalendarSecurityService;
