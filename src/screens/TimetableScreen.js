import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faCalendarAlt,
  faClock,
} from '@fortawesome/free-solid-svg-icons';
import timetableData from '../data/dummyTimetable.json';

const screenWidth = Dimensions.get('window').width;

export default function TimetableScreen({ navigation, route }) {
  const [timetable, setTimetable] = useState(null);
  const [availableDays, setAvailableDays] = useState([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ]);
  const { studentName, authCode } = route.params || {};
  const baseDays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  // Helper function to convert object response to array format
  const convertObjectToArrayFormat = (data) => {
    console.log('Original API Response:', data); // Debug log to see your data structure

    // If data is already in the correct format (object with day keys containing arrays), return as is
    if (
      data &&
      typeof data === 'object' &&
      data.Monday &&
      Array.isArray(data.Monday)
    ) {
      return data;
    }

    // If data is an object that needs conversion to day-based structure
    if (data && typeof data === 'object') {
      const convertedData = {};

      // Handle your specific API format with numeric keys (1=Monday, 2=Tuesday, etc.)
      const dayMapping = {
        1: 'Monday',
        2: 'Tuesday',
        3: 'Wednesday',
        4: 'Thursday',
        5: 'Friday',
        6: 'Saturday',
      };

      // Convert numeric keys to day names
      Object.keys(data).forEach((key) => {
        const dayName = dayMapping[key];
        if (dayName && Array.isArray(data[key])) {
          // Sort by week_time to ensure proper order, then by created_at to get latest first
          const sortedEntries = data[key].sort((a, b) => {
            if (a.week_time === b.week_time) {
              // If same period, sort by created_at (latest first)
              return new Date(b.created_at) - new Date(a.created_at);
            }
            return a.week_time - b.week_time;
          });

          // Remove duplicates - keep only the latest entry for each week_time
          const uniqueEntries = [];
          const seenPeriods = new Set();

          sortedEntries.forEach((item) => {
            if (!seenPeriods.has(item.week_time)) {
              seenPeriods.add(item.week_time);
              uniqueEntries.push(item);
            }
          });

          // Transform the data to match your component's expected format
          convertedData[dayName] = uniqueEntries.map((item) => ({
            subject:
              item.subject?.name ||
              item.subject?.subject_name ||
              'Unknown Subject',
            teacher:
              item.user?.name || item.user?.full_name || 'Unknown Teacher',
            period: item.week_time,
            time: `Period ${item.week_time}`, // You can customize this format
            // Keep original data for reference
            originalData: item,
          }));
        }
      });

      // Determine which days have data and update available days
      const daysWithData = Object.keys(convertedData).filter(
        (day) => convertedData[day] && convertedData[day].length > 0
      );

      // Set available days based on what's in the data
      const finalAvailableDays = baseDays.filter(
        (day) =>
          daysWithData.includes(day) ||
          ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day)
      );

      // Initialize empty arrays for days that don't have data but should be shown
      finalAvailableDays.forEach((day) => {
        if (!convertedData[day]) {
          convertedData[day] = [];
        }
      });

      console.log('Converted Data:', convertedData); // Debug log to see converted structure
      console.log('Available Days:', finalAvailableDays); // Debug log to see available days

      // Update available days state
      setAvailableDays(finalAvailableDays);

      return convertedData;
    }

    return data;
  };

  const fetchTimetable = async () => {
    try {
      console.log('Fetching timetable with authCode:', authCode);
      const url = `https://sis.bfi.edu.mm/mobile-api/get-student-timetable2?authCode=${authCode}`;
      console.log('Request URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        const data = await response.json();
        console.log('Raw response data:', data);

        // Convert object to array format if needed
        const convertedData = convertObjectToArrayFormat(data);
        return convertedData;
      } else {
        console.error(
          'Failed to fetch timetable:',
          response.status,
          response.statusText
        );
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        return null;
      }
    } catch (error) {
      console.error('Error fetching timetable:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });

      // Check if it's a network error
      if (error.message.includes('Network request failed')) {
        console.error('Network Error: This might be due to:');
        console.error('1. No internet connection');
        console.error('2. Server is down');
        console.error(
          '3. Android network security policy blocking HTTP requests'
        );
        console.error('4. Firewall or proxy blocking the request');
      }

      return null;
    }
  };
  useEffect(() => {
    const fetchAndSetTimetable = async () => {
      const data = await fetchTimetable();
      if (data) {
        console.log(data);
        setTimetable(data);
      }
    };

    fetchAndSetTimetable();
  }, []);

  const getCurrentDay = () => {
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const currentDayName = dayNames[today];

    // Return current day if it's in available days, otherwise return first available day
    return availableDays.includes(currentDayName)
      ? currentDayName
      : availableDays[0] || 'Monday';
  };

  const [selectedDay, setSelectedDay] = useState('Monday');

  // Update selected day when available days change
  useEffect(() => {
    const currentDay = getCurrentDay();
    setSelectedDay(currentDay);
  }, [availableDays]);

  const getPeriodColor = (period) => {
    const colors = {
      1: '#FF6B6B', // Period 1 - Red
      2: '#4ECDC4', // Period 2 - Teal
      3: '#45B7D1', // Period 3 - Blue
      4: '#96CEB4', // Period 4 - Green
      5: '#FFEAA7', // Period 5 - Yellow
      6: '#DDA0DD', // Period 6 - Purple
      7: '#98D8C8', // Period 7 - Light Green
      8: '#F7DC6F', // Period 8 - Light Yellow
      9: '#BB8FCE', // Period 9 - Light Purple
      10: '#85C1E9', // Period 10 - Light Blue
    };
    return colors[period] || '#BDC3C7';
  };

  const renderTimeSlot = ({ item, index }) => (
    <View style={styles.timeSlotContainer}>
      <View style={styles.periodContainer}>
        <Text style={styles.periodText}>{item.period || index + 1}</Text>
      </View>
      <View
        style={[
          styles.subjectContainer,
          { backgroundColor: getPeriodColor(item.period || index + 1) },
        ]}
      >
        <Text style={styles.subjectText}>{item.subject}</Text>
        <Text style={styles.teacherText}>{item.teacher}</Text>
      </View>
    </View>
  );

  const renderDayTab = (day) => (
    <TouchableOpacity
      key={day}
      style={[styles.dayTab, selectedDay === day && styles.selectedDayTab]}
      onPress={() => setSelectedDay(day)}
    >
      <Text
        style={[
          styles.dayTabText,
          selectedDay === day && styles.selectedDayTabText,
        ]}
      >
        {day.substring(0, 3)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesomeIcon icon={faArrowLeft} size={20} color='#fff' />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <FontAwesomeIcon icon={faCalendarAlt} size={20} color='#fff' />
          <Text style={styles.headerTitle}>Timetable</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        {/* Selected Day Schedule */}
        <View style={styles.scheduleContainer}>
          <Text style={styles.dayTitle}>{selectedDay}</Text>
          <FlatList
            data={
              timetable ? timetable[selectedDay] : timetableData[selectedDay]
            }
            renderItem={renderTimeSlot}
            keyExtractor={(item, index) => `${selectedDay}-${index}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scheduleList}
          />
        </View>
      </View>

      {/* Day Tabs at Bottom */}
      <View style={styles.bottomTabsContainer}>
        {availableDays.map(renderDayTab)}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#AF52DE',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  headerRight: {
    width: 36,
  },
  studentInfo: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  studentNameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  bottomTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  dayTab: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 15,
    marginHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedDayTab: {
    backgroundColor: '#AF52DE',
    borderColor: '#9A4BD4',
    shadowColor: '#AF52DE',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  dayTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textAlign: 'center',
  },
  selectedDayTabText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  scheduleContainer: {
    flex: 1,
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  scheduleList: {
    paddingBottom: 10,
  },
  timeSlotContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodContainer: {
    marginRight: 10,
    justifyContent: 'center',
  },
  periodText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  teacherContainer: {
    marginLeft: 'auto',
    justifyContent: 'center',
  },
  teacherText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  subjectContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  subjectText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});
