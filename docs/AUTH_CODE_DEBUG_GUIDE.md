# Auth Code Debug Guide

## Issue Description

When navigating from the parent screen to the calendar, the API call was sending the teacher's auth code instead of the selected student's auth code.

## Solution Implemented

### 1. Fixed Calendar Screen Navigation Priority

Updated `src/screens/CalendarScreen.js` to prioritize user data in the correct order:

```javascript
// Priority order: calendarUserData (from parent screen) > selectedStudent > direct login userData
// This ensures when navigating from parent screen, we use the selected student's auth code
if (calendarUserDataStr) {
  console.log('📅 CALENDAR: Using calendar user data (from parent screen navigation)');
  userDataStr = calendarUserDataStr;
} else if (selectedStudentStr) {
  console.log('📅 CALENDAR: Using selected student data for calendar access');
  userDataStr = selectedStudentStr;
} else if (userDataStr) {
  console.log('📅 CALENDAR: Using direct login user data');
  // userDataStr is already set, no need to change it
}
```

### 2. Enhanced Logging

Added comprehensive logging to track which auth code is being used:

**Calendar Screen:**
```javascript
console.log('📅 CALENDAR: Initializing calendar for user:', {
  userType: user.userType,
  userId: user.id,
  username: user.username || user.name,
  hasAuthCode: !!user.authCode,
  authCodePreview: user.authCode ? `${user.authCode.substring(0, 8)}...` : 'none',
  dataSource: calendarUserDataStr ? 'parent_screen' : selectedStudentStr ? 'selected_student' : 'direct_login',
});
```

**Calendar Service:**
```javascript
console.log(`🔑 CALENDAR SERVICE: Using auth code: ${authCode.substring(0, 8)}... (${this.userData.userType || 'unknown'} user)`);
```

### 3. Debug Utilities

Added debug utilities to help identify auth code issues:

**CalendarService.debugAuthCode():**
```javascript
debugAuthCode() {
  const authCode = this.userData.authCode;
  return {
    hasAuthCode: !!authCode,
    authCodePreview: authCode ? `${authCode.substring(0, 8)}...` : 'none',
    userType: this.userData.userType || 'unknown',
    userId: this.userData.id,
    username: this.userData.username || this.userData.name || 'unknown',
    fullUserData: {
      id: this.userData.id,
      userType: this.userData.userType,
      name: this.userData.name,
      username: this.userData.username,
      authCode: authCode ? `${authCode.substring(0, 8)}...` : 'none',
    }
  };
}
```

## How to Test

### 1. Using the Example Component

1. Import and use `PersonalCalendarExample` component
2. Use the "Debug Auth Code" button to check which auth code is being used
3. Test navigation from parent screen to calendar
4. Compare auth codes before and after navigation

### 2. Console Logging

When navigating from parent screen to calendar, you should see logs like:

```
🔍 CALENDAR: User data check: {
  hasUserData: true,
  hasCalendarUserData: true,
  hasSelectedStudent: true
}
📅 CALENDAR: Using calendar user data (from parent screen navigation)
📅 CALENDAR: Initializing calendar for user: {
  userType: "student",
  userId: 123,
  username: "John Doe",
  hasAuthCode: true,
  authCodePreview: "abc12345...",
  dataSource: "parent_screen"
}
🔑 CALENDAR SERVICE: Using auth code: abc12345... (student user)
```

### 3. Manual Testing Steps

1. **Login as Teacher/Parent**
2. **Navigate to Parent Screen**
3. **Select a Student** (note the student's auth code preview)
4. **Navigate to Calendar** from parent screen
5. **Check Console Logs** to verify:
   - Calendar is using `calendarUserData` from parent screen
   - Auth code matches the selected student's auth code
   - API calls use the student's auth code, not the teacher's

### 4. Debug Commands

```javascript
// In console or component
const authDebug = calendarService.debugAuthCode();
console.log('Auth Debug:', authDebug);

// Check what's in AsyncStorage
const calendarUserData = await AsyncStorage.getItem('calendarUserData');
const selectedStudent = await AsyncStorage.getItem('selectedStudent');
const userData = await AsyncStorage.getItem('userData');

console.log('Storage Debug:', {
  calendarUserData: calendarUserData ? JSON.parse(calendarUserData) : null,
  selectedStudent: selectedStudent ? JSON.parse(selectedStudent) : null,
  userData: userData ? JSON.parse(userData) : null,
});
```

## Expected Behavior

### ✅ Correct Behavior (After Fix)

1. **Parent Screen Navigation:**
   - Teacher logs in with teacher auth code
   - Teacher selects student in parent screen
   - Student data (including student auth code) is saved to `calendarUserData`
   - Calendar screen uses student's auth code for API calls

2. **Direct Student Login:**
   - Student logs in directly
   - Calendar uses student's own auth code

3. **API Calls:**
   - Personal calendar API receives student's auth code
   - Returns student-specific events (homework, exams)

### ❌ Previous Incorrect Behavior

1. **Parent Screen Navigation:**
   - Teacher logs in with teacher auth code
   - Teacher selects student in parent screen
   - Calendar screen incorrectly used teacher's auth code
   - API calls sent teacher's auth code instead of student's

## Verification Checklist

- [ ] Calendar screen prioritizes `calendarUserData` over direct `userData`
- [ ] Console logs show correct data source (`parent_screen`, `selected_student`, or `direct_login`)
- [ ] Auth code preview in logs matches selected student's auth code
- [ ] API calls use student's auth code when navigating from parent screen
- [ ] Personal calendar events are student-specific, not teacher-specific
- [ ] Debug utilities work correctly and show expected auth code information

## Troubleshooting

### Issue: Still seeing teacher's auth code in API calls

**Check:**
1. Verify `calendarUserData` is being set correctly in parent screen
2. Check console logs for data source priority
3. Use debug utilities to verify which auth code is being used

**Solution:**
```javascript
// In parent screen, ensure this is called when navigating to calendar:
await AsyncStorage.setItem('calendarUserData', JSON.stringify(selectedStudent));
```

### Issue: No auth code available

**Check:**
1. Verify selected student has valid auth code
2. Check if student data is complete
3. Verify AsyncStorage is working correctly

**Solution:**
```javascript
// Verify student data before navigation
if (!selectedStudent.authCode) {
  Alert.alert('Authentication Error', 'Unable to authenticate student');
  return;
}
```

### Issue: Calendar shows wrong events

**Check:**
1. Verify correct auth code is being sent to API
2. Check backend logs to confirm which user's data is being returned
3. Verify API endpoint is working correctly

**Solution:**
Use the debug utilities to verify the auth code being sent matches the expected student's auth code.

## Files Modified

1. `src/screens/CalendarScreen.js` - Fixed navigation priority
2. `src/services/calendarService.js` - Added debug utilities and enhanced logging
3. `examples/PersonalCalendarExample.js` - Added debug functionality

The fix ensures that when navigating from parent screen to calendar, the selected student's auth code is used for all API calls, providing the correct personalized calendar events.
