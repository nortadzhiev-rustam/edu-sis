# Attendance Screen API Integration Guide

## Current Status
The AttendanceScreen is currently using dummy data for development purposes. This allows for UI testing and development without requiring a working API endpoint.

## Dummy Data Structure
The dummy data follows the expected API response format:
```javascript
{
  date: "2024-01-15",
  weekday: "Monday", 
  subject: "Mathematics",
  period: "1",
  status: "PRESENT", // PRESENT, ABSENT, LATE, EXCUSED
  attendance_note: null // Optional note
}
```

## Switching to Real API

When the attendance API is ready, follow these steps:

### 1. Update Imports
Add back the Alert import for error handling:
```javascript
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert, // Add this back
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
```

### 2. Update Component Parameters
Add back the authCode parameter:
```javascript
export default function AttendanceScreen({ navigation, route }) {
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const { studentName, authCode } = route.params || {}; // Add authCode back
```

### 3. Replace useEffect
Replace the dummy data loading with real API call:
```javascript
useEffect(() => {
  if (authCode) {
    fetchAttendanceData();
  }
}, [authCode]);
```

### 4. Add API Function
Uncomment and add the fetchAttendanceData function:
```javascript
const fetchAttendanceData = async () => {
  if (!authCode) {
    Alert.alert('Error', 'Authentication code is missing');
    return;
  }

  setLoading(true);
  try {
    const response = await fetch(
      'https://sis.bfi.edu.mm/mobile-api/get-student-attendance',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth_code: authCode,
        }),
      }
    );

    const result = await response.json();

    if (result.success && result.data) {
      setAttendance(result.data);
    } else {
      Alert.alert('Error', 'Failed to fetch attendance data');
    }
  } catch (error) {
    console.error('Error fetching attendance:', error);
    Alert.alert('Error', 'Failed to connect to server');
  } finally {
    setLoading(false);
  }
};
```

### 5. Remove Dummy Data Function
Remove the `loadDummyAttendanceData` function and its setTimeout logic.

## API Endpoint Details
- **URL**: `https://sis.bfi.edu.mm/mobile-api/get-student-attendance`
- **Method**: POST
- **Headers**: `Content-Type: application/json`
- **Body**: `{ auth_code: string }`
- **Expected Response**:
```javascript
{
  success: true,
  data: [
    {
      date: "2024-01-15",
      weekday: "Monday",
      subject: "Mathematics", 
      period: "1",
      status: "PRESENT",
      attendance_note: null
    }
    // ... more records
  ],
  total_records: number
}
```

## Testing
After implementing the real API:
1. Test with valid authCode
2. Test error handling with invalid authCode
3. Test network error scenarios
4. Verify pagination works with large datasets
5. Test responsive design in both orientations

## Features Already Implemented
- ✅ Responsive table design (portrait/landscape)
- ✅ Color-coded status indicators
- ✅ Pagination (10 items per page)
- ✅ Loading states
- ✅ Empty state handling
- ✅ Error handling structure
- ✅ Navigation integration
- ✅ Screen orientation support
