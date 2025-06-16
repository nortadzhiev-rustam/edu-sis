# Notification API Fix - Mark as Read

## 🐛 **Issue**
The `markAsRead` function was not calling the API properly for student notifications.

## 🔍 **Root Cause**
The `markAsRead` function in NotificationContext was only calling the API for notifications that had `_apiData.id`, but it wasn't properly handling the student context where a different `authCode` needs to be passed to the API.

## ✅ **Solution**

### 1. **Updated Notification Service**
- **File**: `src/services/notificationService.js`
- **Change**: Modified `markNotificationAsRead` to accept an optional `specificAuthCode` parameter

```javascript
// BEFORE: Only used current user's authCode
export const markNotificationAsRead = async (notificationId) => {
  const authCode = await getAuthCode();
  // ... API call with current user's authCode
};

// AFTER: Can use specific authCode for student context
export const markNotificationAsRead = async (notificationId, specificAuthCode = null) => {
  const authCode = specificAuthCode || (await getAuthCode());
  // ... API call with specified or current user's authCode
};
```

### 2. **Enhanced NotificationContext**
- **File**: `src/contexts/NotificationContext.js`
- **Change**: Updated `markAsRead` to properly call API with student's authCode when needed

```javascript
// Enhanced markAsRead function
const markAsRead = async (notificationId) => {
  // Find notification in both main and student notifications
  let targetNotification = notifications.find((n) => n.id === notificationId);
  let isStudentNotification = false;
  let studentAuthCode = null;

  // Check student notifications if not found in main notifications
  if (!targetNotification) {
    for (const [authCode, studentNotifs] of Object.entries(studentNotifications)) {
      const found = studentNotifs.find((n) => n.id === notificationId);
      if (found) {
        targetNotification = found;
        isStudentNotification = true;
        studentAuthCode = authCode;
        break;
      }
    }
  }

  // Call API with appropriate authCode
  if (targetNotification?._apiData?.id || targetNotification?._apiData?.notification_id) {
    const originalNotificationId = 
      targetNotification._apiData.notification_id || 
      targetNotification._apiData.id;

    let apiResponse;
    
    if (isStudentNotification && studentAuthCode) {
      // For student notifications, pass the student's authCode
      apiResponse = await markAPINotificationRead(originalNotificationId, studentAuthCode);
    } else {
      // For regular notifications, use current user's authCode
      apiResponse = await markAPINotificationRead(originalNotificationId);
    }

    if (apiResponse?.success) {
      // Update appropriate state based on notification type
      if (isStudentNotification && studentAuthCode) {
        // Update student notifications and unread count
        setStudentNotifications(prev => ({
          ...prev,
          [studentAuthCode]: prev[studentAuthCode].map(n =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
        }));
        setStudentUnreadCounts(prev => ({
          ...prev,
          [studentAuthCode]: Math.max(0, (prev[studentAuthCode] || 0) - 1),
        }));
      } else {
        // Update main notifications and unread count
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      return true;
    }
  }

  // Fallback to local method if API fails
  // ... local storage update logic
};
```

## 🔧 **API Call Details**

### Request Format
```javascript
// API Endpoint: /mobile-api/notifications/mark-read
// Method: POST
// Headers: { 'Content-Type': 'application/json' }
// Body:
{
  "authCode": "student_auth_code_or_current_user_auth_code",
  "notification_id": "original_notification_id_from_api"
}
```

### Response Format
```javascript
{
  "success": true,
  "message": "Notification marked as read"
}
```

## 🧪 **Testing**

### Test Cases

1. **Teacher Notification**:
   - Login as teacher
   - Tap notification → Should call API with teacher's authCode
   - Verify notification marked as read in UI and backend

2. **Student Notification (Parent Context)**:
   - Login as parent
   - Select student
   - Tap student notification → Should call API with student's authCode
   - Verify notification marked as read for that student

3. **Student Notification (Direct Access)**:
   - Access student screen directly
   - Tap notification → Should call API with student's authCode
   - Verify notification marked as read

### Debug Logging
To verify API calls are working, you can temporarily add logging:

```javascript
// In NotificationContext.js markAsRead function
console.log('Calling API with:', {
  notificationId: originalNotificationId,
  authCode: isStudentNotification ? studentAuthCode : 'current_user',
  isStudentNotification
});

const apiResponse = await markAPINotificationRead(originalNotificationId, studentAuthCode);
console.log('API Response:', apiResponse);
```

## 📋 **Files Modified**

1. `src/services/notificationService.js` - Added `specificAuthCode` parameter
2. `src/contexts/NotificationContext.js` - Enhanced `markAsRead` function

## 🎯 **Expected Behavior**

- ✅ **API calls made** for all notification types (teacher, student, parent)
- ✅ **Correct authCode used** based on notification context
- ✅ **Proper state updates** after successful API calls
- ✅ **Fallback to local storage** if API fails
- ✅ **Notification counts update** correctly

## 🔍 **Verification**

To verify the fix is working:

1. **Check Network Tab**: Look for POST requests to `/mobile-api/notifications/mark-read`
2. **Check Request Body**: Verify correct `authCode` and `notification_id` are sent
3. **Check Response**: Verify API returns `{"success": true}`
4. **Check UI**: Verify notification appears as read and count decreases
5. **Check Backend**: Verify notification is marked as read in database

The API should now be called correctly for all notification contexts! 🚀
