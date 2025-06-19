# Notification Navigation Setup

This document explains how push notification navigation to the NotificationScreen is implemented in the app.

## Overview

When a user taps on a push notification (either Firebase Cloud Messaging or local Expo notifications), the app will automatically open and navigate to the NotificationScreen with the appropriate user context.

## Implementation Details

### 1. Navigation Reference Setup

**File: `App.js`**

- Added a navigation reference using `React.useRef()`
- Set the reference when NavigationContainer is ready using the `onReady` callback
- Imported and called `setNavigationRef` to make the reference available to the messaging utility

```javascript
const navigationRef = React.useRef();

<NavigationContainer
  ref={navigationRef}
  onReady={() => {
    setNavigationRef(navigationRef.current);
  }}
>
```

### 2. Messaging Utility Updates

**File: `src/utils/messaging.js`**

#### Added Navigation Reference Management:

- `setNavigationRef(ref)` - Sets the navigation reference for programmatic navigation
- `getUserType()` - Determines user type from stored data (teacher/parent/student)
- **Queue System** - Handles navigation actions before navigation is ready
- **Retry Mechanism** - Automatically retries failed navigation actions

#### Enhanced Notification Listeners:

- **Firebase messaging listeners** - Handle remote push notifications with delays for proper initialization
- **Expo notification listeners** - Handle local notifications and notification taps
- **Timing safeguards** - Different delays for background (500ms), quit state (1000ms), and local notifications (200ms)

#### Updated Navigation Handler:

- `handleNotificationNavigation(remoteMessage)` - Always navigates to NotificationScreen
- `safeNavigate(screenName, params)` - Safe navigation with readiness checks and error handling
- Automatically determines user type and auth code
- Passes appropriate parameters based on user context
- **Queue and retry system** for navigation actions that fail due to timing issues

### 3. User Type Detection

The system automatically detects the user type from stored data:

- **Teacher**: `userData.is_teacher` or `userData.role === 'teacher'`
- **Parent**: `userData.role === 'parent'` or `userData.is_parent`
- **Student**: Default fallback or explicit student role

### 4. Navigation Parameters

When navigating to NotificationScreen, the following parameters are passed:

```javascript
{
  userType: 'teacher' | 'parent' | 'student',
  authCode: 'student_auth_code' // Only for student notifications
}
```

## Supported Notification Sources

### 1. Firebase Cloud Messaging (FCM)

- Remote push notifications from the backend
- Handled when app is in background, foreground, or quit state
- Supports notification data payload for context

### 2. Expo Local Notifications

- Local notifications shown when app receives FCM in foreground
- BPS notifications and other local alerts
- Handled via `addNotificationResponseReceivedListener`

## Testing

### Manual Testing

Use the demo notification function to test navigation:

```javascript
import { sendTestNavigationNotification } from '../utils/demoNotifications';

// Send a test notification
await sendTestNavigationNotification();
```

### Test Flow

1. Call the test function from any screen
2. A local notification will appear immediately
3. Tap the notification
4. App should navigate to NotificationScreen
5. Check console logs for navigation details

## Console Logging

The implementation includes comprehensive logging:

- `🔔 FIREBASE BACKGROUND/QUIT STATE/FOREGROUND` - Firebase notification events
- `🔔 EXPO NOTIFICATION` - Expo notification taps
- `🧭 NAVIGATION` - Navigation reference setup and navigation attempts
- `👤 NAVIGATION` - User type detection
- `🔑 NAVIGATION` - Auth code availability
- `🚀 NAVIGATION` - Actual navigation calls
- `📊 ANALYTICS` - Notification type tracking

## Error Handling

- **Navigation readiness checks** - Multiple layers of validation before attempting navigation
- **Queue system** - Actions are queued if navigation isn't ready and retried automatically
- **Retry mechanism** - Failed navigation actions are retried every 2 seconds
- **Timing safeguards** - Different delays for different app states (background/quit/foreground)
- **User type detection** - Has fallback to 'student' if detection fails
- **Comprehensive error logging** - Detailed console logs for debugging navigation issues
- **Graceful degradation** - App continues to function even if navigation fails

### Navigation State Management

The implementation includes a sophisticated state management system:

1. **Navigation Reference Tracking** - Tracks when navigation is available
2. **Action Queuing** - Stores navigation actions until navigation is ready
3. **Automatic Processing** - Processes queued actions when navigation becomes available
4. **Retry Logic** - Automatically retries failed actions with exponential backoff
5. **Cleanup** - Stops retry mechanisms when no pending actions remain

## Integration with Existing Notification System

This implementation works seamlessly with the existing notification system:

- NotificationScreen already supports userType and authCode parameters
- Existing notification API calls remain unchanged
- Compatible with parent/student notification context switching
- Maintains existing notification filtering and display logic

## Future Enhancements

Potential improvements that could be added:

1. **Deep linking to specific notification types** - Navigate to attendance/grades screens based on notification type
2. **Notification action buttons** - Add quick actions directly in notifications
3. **Notification categories** - Group notifications by type with different behaviors
4. **Custom notification sounds** - Different sounds for different notification types
5. **Notification scheduling** - Schedule notifications for specific times
