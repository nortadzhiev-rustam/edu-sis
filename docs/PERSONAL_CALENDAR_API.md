# Personal Calendar API Implementation

## Overview

This document describes the implementation of the new Personal Calendar API endpoint that provides personalized calendar events including homework due dates, exam schedules, and student birthdays with role-based filtering.

## API Endpoint

### GET /mobile-api/calendar/personal

**Parameters:**
- `authCode` (required): User authentication code
- `start_date` (optional): Start date in YYYY-MM-DD format (default: today)
- `end_date` (optional): End date in YYYY-MM-DD format (default: +30 days)

**Example Requests:**
```bash
# Get personal events (default 30 days)
GET /mobile-api/calendar/personal?authCode=student_auth_code

# Get events for specific date range
GET /mobile-api/calendar/personal?authCode=teacher_auth_code&start_date=2025-01-01&end_date=2025-01-31
```

## Response Format

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

## Event Categories & Types

### For Students:
- **📚 Homework Due Dates**: Shows upcoming homework deadlines with completion status
- **📝 Exam Schedules**: Shows scheduled assessments and exams
- **Priority Levels**: High priority for pending homework/exams, low for completed

### For Teachers/Staff:
- **📚 Homework Review Dates**: Shows when homework is due for review with submission counts
- **📝 Exam Conduct Dates**: Shows exams they need to conduct
- **🎂 Student Birthdays**: Shows birthdays of students in their homeroom classes

## Event Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique event identifier |
| `title` | string | Event title with emoji prefix |
| `description` | string | Detailed event description |
| `start_date` | string | Start date (YYYY-MM-DD) |
| `end_date` | string | End date (YYYY-MM-DD) |
| `start_time` | string/null | Start time (HH:MM:SS) or null for all-day |
| `end_time` | string/null | End time (HH:MM:SS) or null for all-day |
| `is_all_day` | boolean | Whether event is all-day |
| `location` | string | Event location |
| `status` | string | Event status (pending, completed, scheduled, etc.) |
| `source` | string | Event source identifier |
| `category` | string | Event category (homework, exam, birthday) |
| `priority` | string | Event priority (high, medium, low) |
| `metadata` | object | Additional event-specific data |

## Status Values

- `pending` - Not yet completed/submitted
- `completed` - Homework submitted/done
- `scheduled` - Exams and birthdays
- `pending_review` - Teacher homework reviews

## Priority Levels

- `high` - Pending homework, upcoming exams
- `medium` - Homework reviews for teachers
- `low` - Completed homework, birthdays

## Implementation Details

### Frontend Integration

The personal calendar functionality is integrated into the existing `CalendarService` class:

```javascript
// Fetch personal events
const personalEvents = await calendarService.getPersonalEvents(startDate, endDate);

// Events are automatically included in the main calendar view
const allEvents = await calendarService.getAllEvents(startDate, endDate);
```

### Configuration

Added new calendar endpoints to `src/config/env.js`:

```javascript
// Calendar API Endpoints
GET_CALENDAR_DATA: '/calendar/data',
GET_CALENDAR_PERSONAL: '/calendar/personal',
GET_CALENDAR_UPCOMING: '/calendar/upcoming',
GET_CALENDAR_MONTHLY: '/calendar/monthly',
```

### Demo Mode Support

The implementation includes comprehensive demo data for testing:

```javascript
import { getDemoPersonalCalendarData } from './demoModeService';

// Get demo data for testing
const demoData = getDemoPersonalCalendarData('student'); // or 'teacher'
```

### Event Transformation

Personal events are transformed to match the existing calendar event format:

```javascript
{
  id: event.id,
  title: this.getPersonalEventTitle(event), // Adds emoji prefixes
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
}
```

### Color Coding

Events are color-coded based on category and priority:

- **High Priority Homework**: Red (#FF3B30)
- **High Priority Exams**: Orange (#FF9500)
- **Regular Homework**: Blue (#007AFF)
- **Regular Exams**: Orange (#FF9500)
- **Birthdays**: Green (#34C759)
- **Other Events**: Gray (#8E8E93)

## Smart Features

### Automatic Filtering
- Students only see their own homework and exams
- Teachers see homework they assigned and exams they created
- Homeroom teachers see birthdays of their students

### Intelligent Descriptions
- Homework includes subject and completion status
- Exams include assessment type and subject
- Birthdays include class and age information
- Teacher views include submission counts

### Date Handling
- Birthdays automatically calculate next occurrence
- Overdue detection for homework
- Flexible date range filtering

## Testing

Use the provided example component to test the functionality:

```bash
# Run the example
import PersonalCalendarExample from './examples/PersonalCalendarExample';

# The example includes:
# - Demo data for both student and teacher views
# - Different date range options
# - User type switching
# - Event detail display
```

## Error Handling

The implementation includes comprehensive error handling:

- Graceful fallback to empty array on API errors
- Demo mode support for offline testing
- Detailed error logging for debugging
- User-friendly error messages

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live event updates
2. **Push Notifications**: Notify users of upcoming deadlines
3. **Event Actions**: Mark homework as complete, set reminders
4. **Filtering Options**: Filter by subject, priority, or status
5. **Calendar Integration**: Export to device calendar apps

## Backend Requirements

The backend API should implement the `/mobile-api/calendar/personal` endpoint with:

1. **Authentication**: Validate authCode parameter
2. **Role-based Filtering**: Return appropriate events based on user type
3. **Date Range Support**: Handle optional start_date and end_date parameters
4. **Data Sources**: Integrate with homework, exam, and student management systems
5. **Performance**: Efficient queries with proper indexing
6. **Caching**: Cache frequently requested data to improve response times

## Security Considerations

- Validate all input parameters
- Implement proper authentication and authorization
- Ensure users can only access their own data or data they have permission to view
- Use HTTPS for all API communications
- Implement rate limiting to prevent abuse
