# Homework Notification Navigation Fix Guide

## Issue Description

When a student user tapped on a homework notification from the notification screen, it was incorrectly navigating to the teacher homework screen instead of the student assignments screen.

## Root Cause

The notification navigation logic was determining user type solely from the main `userData` in AsyncStorage, without considering:
1. The context of the notification (student-specific vs. teacher-specific)
2. The user type passed from the notification screen
3. Whether the notification had a specific student auth code (from parent context)

## Solution Implemented

### 1. Enhanced User Context Detection

Updated `NotificationItem.js` to properly handle user context:

```javascript
// Determine the effective user type (prioritize passed userType prop)
let effectiveUserType = userType;
if (!effectiveUserType && homeworkUserData) {
  const user = JSON.parse(homeworkUserData);
  effectiveUserType = user.userType || user.user_type || user.type;
}

// Check if this notification has a specific student auth code (from parent context)
const isStudentNotification = notification.studentAuthCode;
```

### 2. Improved Navigation Logic

Updated homework notification navigation with proper priority:

```javascript
// If this is a student-specific notification (from parent screen) or user is a student,
// always navigate to AssignmentsScreen
if (isStudentNotification || effectiveUserType === 'student' || effectiveUserType === 'parent') {
  console.log('📚 NOTIFICATION: Navigating to student assignments screen');
  navigation.navigate('AssignmentsScreen', navigationParams);
}
// Only navigate to teacher homework screen if user is actually a teacher AND 
// this is not a student-specific notification
else if (
  (effectiveUserType === 'teacher' || effectiveUserType === 'staff') &&
  !isStudentNotification
) {
  console.log('📚 NOTIFICATION: Navigating to teacher homework screen');
  navigation.navigate('TeacherHomework', { ... });
} else {
  // Default to student assignments screen for any other case
  console.log('📚 NOTIFICATION: Defaulting to student assignments screen');
  navigation.navigate('AssignmentsScreen', navigationParams);
}
```

### 3. User Type Prop Passing

Updated `NotificationScreen.js` to pass user type context:

```javascript
const renderNotificationItem = ({ item }) => (
  <NotificationItem
    notification={item}
    userType={userType}
    // NotificationItem will handle navigation automatically
  />
);
```

## Navigation Flow

### Before Fix (Incorrect)
```
Student User → Notification Screen → Homework Notification
├── Check userData.userType from AsyncStorage
├── If teacher found in userData → Navigate to TeacherHomework
└── ❌ Student sees teacher homework screen
```

### After Fix (Correct)
```
Student User → Notification Screen → Homework Notification
├── Check passed userType prop (priority)
├── Check notification.studentAuthCode (student-specific)
├── Check userData.userType (fallback)
├── If student context detected → Navigate to AssignmentsScreen
└── ✅ Student sees assignments screen
```

## Console Logging

### Student Homework Notification (Correct)
```
📚 NOTIFICATION: Homework navigation context: {
  effectiveUserType: 'student',
  isStudentNotification: false,
  hasStudentAuthCode: false,
  passedUserType: 'student'
}
📚 NOTIFICATION: Navigating to student assignments screen
```

### Teacher Homework Notification (Still Works)
```
📚 NOTIFICATION: Homework navigation context: {
  effectiveUserType: 'teacher',
  isStudentNotification: false,
  hasStudentAuthCode: false,
  passedUserType: 'teacher'
}
📚 NOTIFICATION: Navigating to teacher homework screen
```

### Parent Viewing Student Notification (Correct)
```
📚 NOTIFICATION: Homework navigation context: {
  effectiveUserType: 'parent',
  isStudentNotification: true,
  hasStudentAuthCode: true,
  passedUserType: 'parent'
}
📚 NOTIFICATION: Navigating to student assignments screen
```

## Testing Instructions

### 1. Test Student Direct Access

1. **Login as Student**
   ```
   - Use student credentials
   - Navigate to notification screen
   ```

2. **Tap Homework Notification**
   ```
   - Find a homework notification
   - Tap on it
   - Verify it navigates to AssignmentsScreen
   - Verify console shows: "Navigating to student assignments screen"
   ```

### 2. Test Teacher Access (Ensure Still Works)

1. **Login as Teacher**
   ```
   - Use teacher credentials
   - Navigate to notification screen
   ```

2. **Tap Homework Notification**
   ```
   - Find a homework notification
   - Tap on it
   - Verify it navigates to TeacherHomework screen
   - Verify console shows: "Navigating to teacher homework screen"
   ```

### 3. Test Parent Context (Student-Specific)

1. **Parent Viewing Student Notifications**
   ```
   - Navigate to parent screen
   - Select a student
   - Go to notification screen for that student
   ```

2. **Tap Student's Homework Notification**
   ```
   - Find a homework notification for the student
   - Tap on it
   - Verify it navigates to AssignmentsScreen (not TeacherHomework)
   - Verify console shows: "Navigating to student assignments screen"
   ```

### 4. Test Mixed Context

1. **Teacher with Student Notifications**
   ```
   - Login as teacher
   - View student-specific notifications (if any)
   - Tap homework notification
   - Should navigate to AssignmentsScreen if student-specific
   - Should navigate to TeacherHomework if teacher-specific
   ```

## Debug Information

### Check User Context
```javascript
// In NotificationItem, the console will show:
console.log('📚 NOTIFICATION: Homework navigation context:', {
  effectiveUserType,
  isStudentNotification,
  hasStudentAuthCode: !!notification.studentAuthCode,
  passedUserType: userType,
});
```

### Verify Navigation Parameters
```javascript
// Check what parameters are being passed
console.log('Navigating with params:', navigationParams);
```

## Priority Logic

The fix implements a clear priority system:

1. **Highest Priority**: Student-specific notifications (has `studentAuthCode`)
   - Always navigate to AssignmentsScreen
   - Regardless of main user type

2. **High Priority**: Passed `userType` prop from NotificationScreen
   - Uses context from notification screen
   - More accurate than AsyncStorage data

3. **Medium Priority**: User type from AsyncStorage
   - Fallback when no userType prop passed
   - Traditional method

4. **Lowest Priority**: Default behavior
   - Always defaults to AssignmentsScreen
   - Safe fallback for students

## Edge Cases Handled

1. **No User Data**: Defaults to AssignmentsScreen
2. **Mixed User Types**: Prioritizes notification context
3. **Parent Context**: Treats as student navigation
4. **Teacher with Student Notifications**: Uses notification-specific logic
5. **Invalid User Type**: Defaults to AssignmentsScreen

## Files Modified

1. **src/components/NotificationItem.js**
   - Enhanced homework navigation logic
   - Added userType prop support
   - Improved context detection
   - Enhanced logging

2. **src/screens/NotificationScreen.js**
   - Pass userType prop to NotificationItem
   - Maintain existing functionality

## Expected Behavior

### ✅ Correct Behavior (After Fix)

1. **Student Notifications:**
   - Always navigate to AssignmentsScreen
   - Show student's homework assignments

2. **Teacher Notifications:**
   - Navigate to TeacherHomework for teacher-specific notifications
   - Navigate to AssignmentsScreen for student-specific notifications

3. **Parent Context:**
   - Always navigate to AssignmentsScreen for selected student
   - Show student's assignments, not teacher interface

### ❌ Previous Incorrect Behavior

1. **Student Notifications:**
   - Sometimes navigated to TeacherHomework
   - Showed teacher interface to students
   - Confusing and inappropriate access

The fix ensures that students always see the appropriate assignments screen when tapping homework notifications, while maintaining all existing functionality for teachers and parent contexts.
