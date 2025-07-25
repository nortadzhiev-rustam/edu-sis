# Personal Calendar API Integration Guide

## Overview

This guide explains how to integrate and test the new Personal Calendar API that provides personalized events including homework due dates, exam schedules, and student birthdays.

## Quick Start

### 1. Backend Integration

The frontend is ready and will automatically call the backend endpoint:

```
GET /mobile-api/calendar/personal?authCode={authCode}&start_date={start_date}&end_date={end_date}
```

**Expected Response Format:**
```json
{
  "success": true,
  "user_id": 456,
  "user_type": "student",
  "personal_events": [
    {
      "id": "homework_123",
      "title": "Math Assignment - Due",
      "description": "Complete exercises 1-10\nSubject: Mathematics",
      "start_date": "2025-01-15",
      "end_date": "2025-01-15",
      "start_time": null,
      "end_time": null,
      "is_all_day": true,
      "location": "",
      "status": "pending",
      "source": "homework_due",
      "category": "homework",
      "priority": "high",
      "metadata": {
        "homework_id": 123,
        "subject_name": "Mathematics",
        "is_completed": false
      }
    }
  ],
  "total_events": 3,
  "date_range": {
    "start_date": "2025-01-10",
    "end_date": "2025-02-10"
  },
  "generated_at": "2025-01-10T10:30:00.000000Z"
}
```

### 2. Frontend Usage

The personal calendar is automatically integrated into the existing calendar system:

```javascript
import CalendarService from '../src/services/calendarService';

// Initialize calendar service
const calendarService = new CalendarService(userData, schoolConfig);
await calendarService.initialize();

// Get personal events (automatically included in main calendar)
const allEvents = await calendarService.getAllEvents(startDate, endDate);

// Get only personal events
const personalEvents = await calendarService.getPersonalEvents(startDate, endDate);

// Get upcoming events (includes personal events)
const upcomingEvents = await calendarService.getUpcomingEvents(30);

// Get monthly events (includes personal events)
const monthlyEvents = await calendarService.getMonthlyEvents(2025, 1);
```

## Testing

### 1. Using the Example Component

Run the provided example component to test functionality:

```javascript
import PersonalCalendarExample from './examples/PersonalCalendarExample';

// The example includes:
// - Demo mode testing
// - Real API testing
// - User type switching (student/teacher)
// - Different date range options
// - Event detail display
```

### 2. API Testing Methods

#### Test Real API
```javascript
// Test the actual backend API
const testResults = await calendarService.testPersonalCalendarAPI(false);
console.log('API Test Results:', testResults);
```

#### Test Demo Mode
```javascript
// Test with demo data
const testResults = await calendarService.testPersonalCalendarAPI(true);
console.log('Demo Test Results:', testResults);
```

### 3. Manual Testing Steps

1. **Enable Demo Mode** (for initial testing):
   ```javascript
   Config.DEV.USE_DUMMY_DATA = true;
   ```

2. **Test Student View**:
   - Should see homework due dates
   - Should see exam schedules
   - Events should have appropriate priorities

3. **Test Teacher View**:
   - Should see homework review dates
   - Should see exam conduct dates
   - Should see student birthdays (if homeroom teacher)

4. **Test Real API** (once backend is ready):
   ```javascript
   Config.DEV.USE_DUMMY_DATA = false;
   ```

## Event Categories

### Student Events
- **📚 Homework**: Due dates with completion status
- **📝 Exams**: Scheduled assessments with details

### Teacher Events
- **📚 Homework Reviews**: Review deadlines with submission counts
- **📝 Exam Conduct**: Exam administration dates
- **🎂 Birthdays**: Student birthdays for homeroom classes

## Configuration

### API Endpoints
The following endpoints are configured in `src/config/env.js`:

```javascript
// Calendar API Endpoints
GET_CALENDAR_DATA: '/calendar/data',
GET_CALENDAR_PERSONAL: '/calendar/personal',
GET_CALENDAR_UPCOMING: '/calendar/upcoming',
GET_CALENDAR_MONTHLY: '/calendar/monthly',
```

### Demo Mode
Control demo mode via configuration:

```javascript
// Enable demo mode for testing
Config.DEV.USE_DUMMY_DATA = true;

// Disable demo mode for production
Config.DEV.USE_DUMMY_DATA = false;
```

## Error Handling

The implementation includes comprehensive error handling:

1. **API Failures**: Graceful fallback to demo data
2. **Network Issues**: Timeout handling and retry logic
3. **Invalid Data**: Data validation and sanitization
4. **User Feedback**: Clear error messages and logging

## Debugging

### Console Logging
The service provides detailed console logging:

```
📅 CALENDAR SERVICE: Fetching personal events from 2025-01-01 to 2025-01-31...
🔗 CALENDAR SERVICE: Request URL: https://sis.bfi.edu.mm/mobile-api/calendar/personal?authCode=...
📊 CALENDAR SERVICE: Personal events API response: { success: true, user_type: 'student', total_events: 3 }
✅ CALENDAR SERVICE: Fetched 3 personal events for student user
```

### Test Results
Use the built-in testing methods to get detailed results:

```javascript
const testResults = await calendarService.testPersonalCalendarAPI(false);
console.log('Test Results:', {
  success: testResults.success,
  tests: testResults.tests,
  errors: testResults.errors,
  apiEndpoint: testResults.apiEndpoint
});
```

## Integration Checklist

### Backend Requirements
- [ ] Implement `/mobile-api/calendar/personal` endpoint
- [ ] Support `authCode`, `start_date`, `end_date` parameters
- [ ] Return events in specified JSON format
- [ ] Implement role-based filtering (student vs teacher)
- [ ] Add proper error handling and validation

### Frontend Integration
- [x] Calendar service integration
- [x] Event transformation and formatting
- [x] Demo mode support
- [x] Error handling and fallbacks
- [x] Testing utilities
- [x] Example component

### Testing
- [x] Demo data generation
- [x] API connectivity testing
- [x] Event structure validation
- [x] User type scenarios
- [x] Date range filtering
- [x] Performance testing

## Troubleshooting

### Common Issues

1. **No Events Returned**
   - Check if backend endpoint is implemented
   - Verify authCode is valid
   - Check date range parameters
   - Enable demo mode for testing

2. **API Errors**
   - Check network connectivity
   - Verify API endpoint URL
   - Check authentication
   - Review server logs

3. **Event Display Issues**
   - Verify event structure matches expected format
   - Check date/time formatting
   - Validate color and priority values

### Debug Commands

```javascript
// Test API connectivity
await calendarService.testPersonalCalendarAPI(false);

// Check demo data
const demoData = getDemoPersonalCalendarData('student');
console.log('Demo Data:', demoData);

// Verify configuration
console.log('API Endpoint:', Config.API_ENDPOINTS.GET_CALENDAR_PERSONAL);
console.log('Demo Mode:', Config.DEV.USE_DUMMY_DATA);
```

## Support

For issues or questions:

1. Check console logs for detailed error messages
2. Use the built-in testing methods to diagnose problems
3. Verify backend API implementation matches specification
4. Test with demo mode first before using real API

## Next Steps

1. **Backend Implementation**: Implement the API endpoint according to specification
2. **Data Integration**: Connect with homework, exam, and student management systems
3. **Testing**: Use provided tools to test integration
4. **Deployment**: Deploy and monitor in production environment
