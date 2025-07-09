# Calendar Events Until March 20 - Usage Guide

This guide explains how to fetch calendar events until March 20 using the enhanced CalendarService.

## Overview

The `CalendarService` has been enhanced with a new method `getEventsUntilMarch20()` that fetches all calendar events from today until March 20 of the specified year (or current year if not specified).

## Method Signature

```javascript
async getEventsUntilMarch20(year = null, forceRefresh = false)
```

### Parameters

- `year` (optional): Target year for March 20. If not provided, uses current year.
- `forceRefresh` (optional): If true, bypasses cache and fetches fresh data.

### Returns

- `Promise<Array>`: Array of calendar events until March 20

## Usage Examples

### 1. Basic Usage - Current Year

```javascript
import CalendarService from '../src/services/calendarService';

// Initialize calendar service (requires user to be logged in)
const userData = await AsyncStorage.getItem('userData');
const calendarService = await CalendarService.initialize(JSON.parse(userData));

// Fetch events until March 20 of current year
const events = await calendarService.getEventsUntilMarch20();
console.log(`Found ${events.length} events until March 20`);
```

### 2. Specific Year

```javascript
// Fetch events until March 20, 2025
const events = await calendarService.getEventsUntilMarch20(2025);
```

### 3. Force Refresh Cache

```javascript
// Fetch fresh data, bypassing cache
const events = await calendarService.getEventsUntilMarch20(null, true);
```

### 4. React Native Component Usage

```javascript
import React, { useState, useEffect } from 'react';
import CalendarService from '../src/services/calendarService';

const MyCalendarComponent = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const userData = await AsyncStorage.getItem('userData');
      const calendarService = await CalendarService.initialize(
        JSON.parse(userData)
      );
      const fetchedEvents = await calendarService.getEventsUntilMarch20();
      setEvents(fetchedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Render your events...
};
```

## Smart Date Handling

The method automatically handles the following scenarios:

### Current Year March 20 Not Yet Passed

- Fetches events from today until March 20 of current year

### Current Year March 20 Already Passed

- Automatically fetches events from today until March 20 of next year
- Logs the year adjustment for transparency

### Example Console Output

```
📅 CALENDAR SERVICE: Fetching events until March 20, 2024
📅 Date range: Mon Dec 09 2024 to Wed Mar 20 2024
📅 CALENDAR SERVICE: March 20 has passed, fetching for 2025
📅 Updated date range: Mon Dec 09 2024 to Thu Mar 20 2025
```

## Event Data Structure

Each event in the returned array contains:

```javascript
{
  id: "unique_event_id",
  title: "Event Title",
  description: "Event description",
  startTime: "2024-03-15T09:00:00.000Z",
  endTime: "2024-03-15T10:00:00.000Z",
  isAllDay: false,
  location: "Event location",
  source: "google_calendar", // or "academic_calendar", "local_global"
  calendarType: "google_workspace", // or "academic", "school_events"
  branchId: 1,
  branchName: "Main Branch",
  color: "#4285F4",
  status: "confirmed"
}
```

## Multi-Day Event Support

The calendar now properly handles events that span multiple days. When an event has different `startTime` and `endTime` dates, it will appear on all dates within that range.

### Multi-Day Event Features:

1. **Calendar View**: Events appear on all dates from start to end
2. **Visual Indicators**:
   - Multi-day events show rectangular dots instead of circular ones
   - Event titles include "(starts)", "(continues)", or "(ends)" indicators
3. **Time Display**: Shows appropriate time information based on which day you're viewing
4. **Date Range**: Shows the full date range for multi-day events

### Example Multi-Day Event:

```javascript
{
  id: "conference_2024",
  title: "Annual Conference",
  startTime: "2024-03-15T09:00:00.000Z",
  endTime: "2024-03-17T17:00:00.000Z", // 3-day event
  // ... other properties
}
```

This event will appear on March 15, 16, and 17 with different indicators:

- **March 15**: "Annual Conference (starts)" - Shows start time
- **March 16**: "Annual Conference (continues)" - Shows "All day (continues)"
- **March 17**: "Annual Conference (ends)" - Shows end time

## Event Sources

The method fetches events from multiple sources:

1. **Google Calendar** - Google Workspace events
2. **Academic Calendar** - School academic events
3. **Local Global Events** - School-specific events
4. **Sample Data** - Demo events (only in demo mode)

## Error Handling

```javascript
try {
  const events = await calendarService.getEventsUntilMarch20();
  // Handle success
} catch (error) {
  if (error.message.includes('Too many requests')) {
    // Handle rate limiting
  } else if (error.message.includes('authentication')) {
    // Handle auth errors
  } else {
    // Handle other errors
  }
}
```

## Performance Considerations

- **Caching**: Results are cached for 5 minutes by default
- **Rate Limiting**: API calls are rate-limited per user
- **Force Refresh**: Use sparingly to avoid hitting rate limits
- **Date Range**: Larger date ranges may take longer to fetch

## Script Usage

You can also use the provided script for testing:

```bash
# Fetch events until March 20 of current year
node scripts/fetchCalendarUntilMarch20.js

# Fetch events until March 20, 2025
node scripts/fetchCalendarUntilMarch20.js 2025

# Force refresh cache
node scripts/fetchCalendarUntilMarch20.js --force-refresh

# Specific year with force refresh
node scripts/fetchCalendarUntilMarch20.js 2025 --force-refresh
```

## Integration with Existing Calendar Views

This method can be easily integrated with existing calendar components:

```javascript
// In your calendar screen component
const refreshCalendarData = async () => {
  const events = await calendarService.getEventsUntilMarch20();
  // Update your calendar view with the events
  updateCalendarView(events);
};
```

## Troubleshooting

### Common Issues

1. **"No user data found"** - Ensure user is logged in
2. **"Too many requests"** - Wait before making another request
3. **"Calendar service not initialized"** - Check school configuration
4. **Empty results** - Check user permissions and date range

### Debug Logging

The method includes comprehensive logging. Check console for:

- Date range calculations
- API response summaries
- Event transformation details
- Error messages with context

## Files Created/Modified

- `src/services/calendarService.js` - Added `getEventsUntilMarch20()` method
- `scripts/fetchCalendarUntilMarch20.js` - Test script
- `examples/CalendarUntilMarch20Example.js` - React component example
- `docs/CalendarUntilMarch20Usage.md` - This usage guide
