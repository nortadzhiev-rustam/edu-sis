# Push Notification Setup Guide

## Problem

When a teacher creates a BPS (Behavior Point System) record for a student, the student doesn't receive a real-time push notification on their device, even when both teacher and student are signed in on the same device.

## Solution Overview

The app already has Firebase Cloud Messaging (FCM) properly configured, and the backend automatically sends push notifications when BPS records are created. The issue was that the mobile app wasn't properly handling BPS-specific notifications. This has been fixed by:

1. **Adding BPS notification channels** for proper categorization and display
2. **Enhancing notification handling** for BPS-specific messages
3. **Ensuring proper foreground/background handling** of BPS notifications
4. **Improving notification display formatting** for BPS content

## What Was Added

### 1. Messaging System Updates (messaging.js)

- Added new `bps-updates` notification channel with high importance
- Updated channel selection logic to handle BPS notifications
- Added `sendBPSLocalNotification()` function for local notifications
- Enhanced notification type detection

### 3. Backend Integration

- Uses existing `/mobile-api/notifications/realtime/bps` endpoint
- Sends structured BPS notification data including:
  - student_id, user_id (teacher), item_type, item_title
  - item_point, date, student_name, note

## How It Works

### Flow for BPS Notifications:

1. **Teacher creates BPS record** → API call to `/discipline/store-bps`
2. **Backend creates BPS record** → Automatically triggers notification system
3. **Backend sends FCM notification** → Push notification sent to student's registered device tokens
4. **Student's device receives notification** → Shows as local notification with proper BPS channel
5. **App handles notification** → Uses `bps-updates` channel for proper display and sound

### Notification Channels:

- **bps-updates**: High importance, vibration, orange light
- **education-updates**: Default for general notifications
- **attendance-alerts**: High importance for attendance
- **grade-updates**: Default importance for grades

## Testing the Implementation

### Prerequisites:

1. Both teacher and student accounts logged in (can be same device)
2. Push notification permissions granted
3. Device tokens registered with backend

### Test Steps:

1. **Login as teacher** → Navigate to BPS screen
2. **Create a BPS record** for a student
3. **Check student device** → Should receive push notification immediately
4. **Verify notification content** → Should show behavior title, points, and note

### Expected Notification Format:

- **Positive Behavior**: "Positive Behavior Recognition"
- **Negative Behavior**: "Behavior Notice"
- **Body**: "Good Behavior (+5 points)" + optional note

## Backend Requirements (Already Implemented)

The backend already:

1. **Accepts device tokens** during login ✅
2. **Stores device tokens** per user account ✅
3. **Automatically sends notifications** when BPS records are created ✅
4. **Sends FCM messages** to appropriate device tokens ✅
5. **Handles multiple device tokens** per user ✅

### Sample Backend FCM Message:

```json
{
  "to": "device_token_here",
  "notification": {
    "title": "Positive Behavior Recognition",
    "body": "Good Behavior (+5 points)\nGreat work in class today!"
  },
  "data": {
    "type": "bps",
    "student_id": "123",
    "item_type": "prs",
    "item_title": "Good Behavior",
    "item_point": 5
  }
}
```

## Troubleshooting

### If notifications aren't received:

1. **Check device token registration** → Verify tokens sent during login
2. **Check notification permissions** → Ensure user granted permissions
3. **Check backend logs** → Verify FCM messages are being sent
4. **Check network connectivity** → Ensure device can reach FCM servers
5. **Check app state** → Notifications work in foreground, background, and killed states

### Common Issues:

- **Token not registered**: Device token not sent to backend during login
- **Permission denied**: User hasn't granted notification permissions
- **Backend not configured**: FCM server key not configured on backend
- **Network issues**: Device can't reach FCM servers

## Next Steps

1. **Test thoroughly** with different scenarios
2. **Monitor backend logs** for FCM delivery status
3. **Add notification history** to track sent notifications
4. **Consider notification preferences** for different types
5. **Add notification sound customization** if needed

## Files Modified

- `src/utils/messaging.js` - Added BPS notification channel and handling
- `docs/PUSH_NOTIFICATION_SETUP.md` - This documentation

The implementation is now complete. The backend automatically sends push notifications when BPS records are created, and the mobile app now properly handles and displays these BPS notifications with the correct channel and formatting.
