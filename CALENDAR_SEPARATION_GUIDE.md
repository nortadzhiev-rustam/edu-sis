# Calendar Separation Implementation Guide

## Overview

The calendar system has been separated into two distinct modes to provide different experiences based on the entry point:

1. **Branch-Only Calendar** - Shows only school/branch events (no personal events)
2. **Combined Calendar** - Shows both branch events and personal events (homework, exams, birthdays)

## Implementation Details

### 1. Calendar Service Modes

The `CalendarService` now supports two modes:

```javascript
// Branch-only mode (default for home screen access)
const service = new CalendarService(schoolConfig, userData, { mode: 'branch-only' });

// Combined mode (default for user dashboard access)
const service = new CalendarService(schoolConfig, userData, { mode: 'combined' });
```

**Key Properties:**
- `calendarMode`: 'branch-only' or 'combined'
- `includePersonalEvents`: boolean flag based on mode

### 2. Screen Structure

#### CalendarScreen (src/screens/CalendarScreen.js)
- **Purpose**: Base calendar screen that supports both modes
- **Mode Detection**: Uses `route.params.mode` to determine calendar mode
- **Default**: 'combined' mode for backward compatibility
- **Usage**: Direct navigation with mode parameter

#### UserCalendarScreen (src/screens/UserCalendarScreen.js)
- **Purpose**: Wrapper for user dashboard calendar access
- **Mode**: Always forces 'combined' mode
- **Usage**: Navigation from user dashboards (Teacher, Parent screens)

### 3. Navigation Patterns

#### Home Screen Calendar (Branch-Only)
```javascript
// From HomeScreen.js
navigation.navigate('Calendar', { mode: 'branch-only' });
```

**Features:**
- Shows only school/branch calendar events
- No personal events (homework, exams, birthdays)
- Accessible without login (if student accounts exist)
- General school information focus

#### User Dashboard Calendar (Combined)
```javascript
// From TeacherScreen.js, ParentScreen.js
navigation.navigate('UserCalendar', { mode: 'combined' });
```

**Features:**
- Shows both branch events and personal events
- Includes homework due dates, exam schedules, student birthdays
- Requires user authentication
- Personalized experience

### 4. Entry Points

#### Branch-Only Calendar Access
1. **Home Screen** → Calendar button
   - Shows school events only
   - No personal information
   - Public/general access

#### Combined Calendar Access
1. **Teacher Dashboard** → "My Calendar" action
   - Shows school events + teacher-specific events
   - Homework reviews, exam conduct, student birthdays

2. **Parent Dashboard** → Calendar option for selected student
   - Shows school events + student-specific events
   - Student's homework, exams, assignments

3. **Direct Login** → Calendar navigation (maintains backward compatibility)
   - Uses combined mode by default

### 5. Service Logic Changes

#### Event Fetching Logic
```javascript
// In CalendarService methods
if (this.includePersonalEvents) {
  console.log('📅 CALENDAR SERVICE: Including personal events in calendar data');
  // Fetch and include personal events
} else {
  console.log('📅 CALENDAR SERVICE: Skipping personal events (branch-only mode)');
  // Skip personal events
}
```

#### Affected Methods
- `getAllEvents()` - Main event fetching
- `getUpcomingEvents()` - Upcoming events
- `getMonthlyEvents()` - Monthly view events

### 6. Console Logging

Enhanced logging helps track which mode is being used:

```
📅 CALENDAR SERVICE: Initialized in branch-only mode
📅 CALENDAR SERVICE: Personal events disabled
📅 CALENDAR SERVICE: Skipping personal events (branch-only mode)
```

```
📅 CALENDAR SERVICE: Initialized in combined mode
📅 CALENDAR SERVICE: Personal events enabled
📅 CALENDAR SERVICE: Including personal events in calendar data
```

## Usage Examples

### 1. Home Screen Access (Branch-Only)
```javascript
// User clicks calendar from home screen
handleCalendarPress = () => {
  navigation.navigate('Calendar', { mode: 'branch-only' });
};
```

**Result:**
- Shows school holidays, events, announcements
- No homework, exams, or personal events
- General school calendar view

### 2. Teacher Dashboard Access (Combined)
```javascript
// Teacher clicks "My Calendar" from dashboard
{
  id: 'calendar',
  title: 'My Calendar',
  subtitle: 'Personal & School Events',
  onPress: () => navigation.navigate('UserCalendar', { mode: 'combined' }),
}
```

**Result:**
- Shows school events + teacher events
- Homework review dates, exam conduct schedules
- Student birthdays (if homeroom teacher)

### 3. Parent Dashboard Access (Combined)
```javascript
// Parent selects calendar for specific student
case 'calendar':
  await AsyncStorage.setItem('calendarUserData', JSON.stringify(selectedStudent));
  navigation.navigate('UserCalendar', { mode: 'combined' });
```

**Result:**
- Shows school events + selected student events
- Student's homework due dates, exam schedules
- Personalized for the selected student

## Benefits

### 1. Clear Separation of Concerns
- **Public Calendar**: General school information
- **Personal Calendar**: User-specific events and deadlines

### 2. Improved User Experience
- **Home Screen**: Quick access to school events without login
- **User Dashboard**: Comprehensive personal calendar experience

### 3. Performance Optimization
- **Branch-Only**: Faster loading (fewer API calls)
- **Combined**: Complete information when needed

### 4. Security & Privacy
- **Branch-Only**: No personal information exposed
- **Combined**: Personal events only for authenticated users

## Testing

### 1. Branch-Only Calendar Testing
```javascript
// Test from home screen
1. Open app without login
2. Click Calendar from home screen
3. Verify only school events are shown
4. Verify no personal events (homework, exams)
```

### 2. Combined Calendar Testing
```javascript
// Test from teacher dashboard
1. Login as teacher
2. Navigate to teacher dashboard
3. Click "My Calendar"
4. Verify both school and personal events are shown

// Test from parent dashboard
1. Add student account
2. Select student
3. Click calendar option
4. Verify student's personal events are shown
```

### 3. Console Verification
Check console logs for mode confirmation:
```
📅 CALENDAR: Initializing calendar service in branch-only mode
📅 CALENDAR SERVICE: Personal events disabled
```

## Migration Notes

### Backward Compatibility
- Existing `Calendar` screen navigation still works
- Default mode is 'combined' to maintain current behavior
- No breaking changes for existing functionality

### New Navigation Patterns
- Use `Calendar` with `{ mode: 'branch-only' }` for public access
- Use `UserCalendar` for user dashboard access (always combined)

## Files Modified

1. **src/services/calendarService.js**
   - Added mode support in constructor
   - Updated event fetching methods to respect mode
   - Enhanced logging for mode tracking

2. **src/screens/CalendarScreen.js**
   - Added route parameter support for mode
   - Updated service initialization with mode

3. **src/screens/UserCalendarScreen.js** (NEW)
   - Wrapper for combined calendar access
   - Forces combined mode

4. **src/screens/HomeScreen.js**
   - Updated calendar navigation to use branch-only mode

5. **src/screens/TeacherScreen.js**
   - Added "My Calendar" action with combined mode

6. **src/screens/ParentScreen.js**
   - Updated calendar navigation to use combined mode

7. **App.js**
   - Added UserCalendarScreen to navigation stack

The implementation provides a clean separation between public school calendar access and personalized user calendar experiences while maintaining full backward compatibility.
