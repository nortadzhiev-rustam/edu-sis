# Notification API Integration Guide

This document provides a comprehensive guide for integrating and using the notification API system in the EduSIS mobile application.

## 📋 Overview

The notification system provides a complete solution for managing notifications in the mobile app, including:

- **API Integration**: Full integration with backend notification endpoints
- **Real-time Notifications**: Support for immediate notification delivery
- **Category Management**: Organized notification categories
- **Staff Tools**: Administrative tools for sending notifications
- **Statistics**: Notification analytics and reporting

## 🚀 Quick Start

### 1. Basic Usage

```javascript
import { useNotificationAPI } from '../hooks/useNotificationAPI';

const MyComponent = () => {
  const {
    fetchNotifications,
    markAsRead,
    sendAnnouncement,
    loading,
    error
  } = useNotificationAPI();

  // Fetch notifications
  const loadNotifications = async () => {
    const response = await fetchNotifications({ page: 1, limit: 20 });
    if (response?.success) {
      console.log('Notifications:', response.data);
    }
  };

  // Mark notification as read
  const handleMarkAsRead = async (notificationId) => {
    const response = await markAsRead(notificationId);
    if (response?.success) {
      console.log('Marked as read');
    }
  };

  // Send announcement (staff only)
  const sendMessage = async () => {
    const response = await sendAnnouncement(
      'Important Notice',
      'This is an important announcement for all students.',
      'all',
      'normal'
    );
    if (response?.success) {
      console.log('Announcement sent');
    }
  };
};
```

### 2. Using the Notification Context

```javascript
import { useNotifications } from '../contexts/NotificationContext';

const MyComponent = () => {
  const {
    notifications,
    unreadCount,
    fetchNotificationsFromAPI,
    markAPINotificationAsRead
  } = useNotifications();

  // Access local notifications and API functions
};
```

## 📁 File Structure

```
src/
├── services/
│   └── notificationService.js          # Core API service
├── hooks/
│   └── useNotificationAPI.js           # Custom hook for API operations
├── contexts/
│   └── NotificationContext.js          # Enhanced context with API integration
├── components/
│   ├── NotificationBadge.js           # Notification badge component
│   ├── NotificationItem.js            # Individual notification item
│   └── NotificationManager.js         # Staff notification management
├── screens/
│   ├── NotificationScreen.js          # Main notification screen
│   └── NotificationDemoScreen.js      # Demo/testing screen
└── docs/
    └── NOTIFICATION_API_INTEGRATION.md # This documentation
```

## 🔧 API Endpoints

### Basic Notification Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/mobile-api/notifications/list` | Get paginated notifications |
| POST | `/mobile-api/notifications/mark-read` | Mark notification as read |
| POST | `/mobile-api/notifications/mark-all-read` | Mark all notifications as read |
| GET | `/mobile-api/notifications/categories` | Get notification categories |
| POST | `/mobile-api/notifications/send` | Send notification (staff only) |
| GET | `/mobile-api/notifications/statistics` | Get notification statistics |

### Real-time Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/mobile-api/notifications/realtime/bps` | Send BPS notification |
| POST | `/mobile-api/notifications/realtime/attendance-reminder` | Send attendance reminder |
| POST | `/mobile-api/notifications/realtime/rich` | Send rich notification |
| POST | `/mobile-api/notifications/realtime/staff` | Send staff notification |

## 🎯 Key Features

### 1. Notification Service (`notificationService.js`)

Core API service that handles all HTTP requests to the backend:

```javascript
import {
  getNotifications,
  markNotificationAsRead,
  sendNotification,
  sendBPSNotification
} from '../services/notificationService';
```

### 2. Custom Hook (`useNotificationAPI.js`)

Provides easy-to-use functions with loading states and error handling:

```javascript
const {
  loading,
  error,
  fetchNotifications,
  markAsRead,
  sendGradeNotification,
  sendEmergencyNotification
} = useNotificationAPI();
```

### 3. Enhanced Context (`NotificationContext.js`)

Combines local notifications with API functionality:

```javascript
const {
  notifications,           // Local notifications
  fetchNotificationsFromAPI, // API function
  markAPINotificationAsRead  // API function
} = useNotifications();
```

### 4. Notification Manager (`NotificationManager.js`)

Staff interface for sending notifications:

```javascript
<NotificationManager
  visible={showManager}
  onClose={() => setShowManager(false)}
  userRole="staff"
/>
```

## 📱 Usage Examples

### Fetch Notifications with Pagination

```javascript
const loadNotifications = async (page = 1) => {
  const response = await fetchNotifications({
    page,
    limit: 20,
    category: 'announcement'
  });
  
  if (response?.success) {
    setNotifications(response.data);
    setHasMorePages(response.has_more_pages);
  }
};
```

### Send Different Types of Notifications

```javascript
// Grade notification
await sendGradeNotification(
  studentId,
  'Mathematics',
  'A+',
  'Excellent work on your test!'
);

// Homework notification
await sendHomeworkNotification(
  [studentId1, studentId2],
  'Science',
  '2024-01-20',
  'Complete Chapter 5 exercises'
);

// Emergency notification
await sendEmergencyNotification(
  'Weather Alert',
  'School closed due to heavy rain',
  'all'
);
```

### Mark Notifications as Read

```javascript
// Single notification
await markAsRead(notificationId);

// All notifications
await markAllAsRead();

// Multiple notifications
await markMultipleAsRead([id1, id2, id3]);
```

## 🎨 UI Components

### NotificationBadge

Shows unread notification count:

```javascript
<NotificationBadge count={unreadCount} />
```

### NotificationItem

Displays individual notification:

```javascript
<NotificationItem
  notification={notification}
  onPress={handleNotificationPress}
  onMarkAsRead={handleMarkAsRead}
/>
```

### NotificationManager

Staff tool for sending notifications:

```javascript
<NotificationManager
  visible={isVisible}
  onClose={handleClose}
  userRole="staff"
/>
```

## 🔐 Authentication

All API calls require authentication via `authCode`:

```javascript
// Automatically handled by the service
const authCode = await getAuthCode(); // From AsyncStorage
```

## 📊 Statistics and Analytics

Get notification statistics (staff only):

```javascript
const stats = await fetchStatistics({
  date_from: '2024-01-01',
  date_to: '2024-01-31'
});

console.log(stats.data);
// {
//   total: 150,
//   unread: 25,
//   sent_today: 10,
//   by_category: {...}
// }
```

## 🚨 Error Handling

The system provides comprehensive error handling:

```javascript
const { error, clearError } = useNotificationAPI();

if (error) {
  Alert.alert('Error', error);
  clearError(); // Clear the error state
}
```

## 🧪 Testing

Use the `NotificationDemoScreen` to test all notification features:

```javascript
import NotificationDemoScreen from '../screens/NotificationDemoScreen';

// Navigate to demo screen
navigation.navigate('NotificationDemo');
```

## 🔄 Real-time Updates

For real-time notification updates, integrate with WebSocket or push notifications:

```javascript
// Example WebSocket integration
const handleNewNotification = (notification) => {
  addNotification(notification);
  showLocalNotification(notification);
};
```

## 📝 Best Practices

1. **Always check response success**: `if (response?.success)`
2. **Handle loading states**: Use the `loading` state from the hook
3. **Implement error handling**: Display user-friendly error messages
4. **Cache notifications**: Store frequently accessed notifications locally
5. **Optimize API calls**: Use pagination and filtering to reduce data transfer
6. **Test thoroughly**: Use the demo screen to test all functionality

## 🔧 Configuration

Update `src/config/env.js` to configure API endpoints:

```javascript
API_ENDPOINTS: {
  GET_NOTIFICATIONS: '/notifications/list',
  MARK_NOTIFICATION_READ: '/notifications/mark-read',
  // ... other endpoints
}
```

## 🎯 Next Steps

1. Integrate push notifications for real-time delivery
2. Add notification preferences for users
3. Implement notification scheduling
4. Add rich media support (images, attachments)
5. Create notification templates for common scenarios

This integration provides a complete notification system that can handle all your app's notification needs while maintaining excellent user experience and performance.
