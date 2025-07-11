/**
 * Personal Calendar API Example
 * Demonstrates the new personal calendar functionality
 * including homework due dates, exam schedules, and student birthdays
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CalendarService from '../src/services/calendarService';
import { Config } from '../src/config/env';

const PersonalCalendarExample = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calendarService, setCalendarService] = useState(null);

  // Mock user data for testing
  const mockUserData = {
    authCode: 'demo_auth_code',
    userType: 'student', // Change to 'teacher' to test teacher view
    id: 123,
    name: 'Demo Student',
    branchId: 1,
  };

  const mockSchoolConfig = {
    schoolId: 'demo_school',
    name: 'Demo School',
    hasGoogleWorkspace: false,
  };

  useEffect(() => {
    initializeCalendarService();
  }, []);

  const initializeCalendarService = async () => {
    try {
      // Enable demo mode for testing
      Config.DEV.USE_DUMMY_DATA = true;

      const service = new CalendarService(mockUserData, mockSchoolConfig);
      await service.initialize();
      setCalendarService(service);

      console.log('✅ Personal Calendar Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize calendar service:', error);
      Alert.alert('Error', 'Failed to initialize calendar service');
    }
  };

  const fetchPersonalEvents = async (dateRange = 'default') => {
    if (!calendarService) {
      Alert.alert('Error', 'Calendar service not initialized');
      return;
    }

    setLoading(true);
    try {
      let startDate = null;
      let endDate = null;

      // Set date range based on selection
      const today = new Date();
      switch (dateRange) {
        case 'week': {
          startDate = today.toISOString().split('T')[0];
          const nextWeek = new Date(today);
          nextWeek.setDate(today.getDate() + 7);
          endDate = nextWeek.toISOString().split('T')[0];
          break;
        }
        case 'month': {
          startDate = today.toISOString().split('T')[0];
          const nextMonth = new Date(today);
          nextMonth.setMonth(today.getMonth() + 1);
          endDate = nextMonth.toISOString().split('T')[0];
          break;
        }
        default:
          // Use default range (30 days)
          break;
      }

      console.log(`Fetching personal events for ${dateRange} range...`);
      const personalEvents = await calendarService.getPersonalEvents(
        startDate,
        endDate
      );

      setEvents(personalEvents);

      Alert.alert(
        'Success',
        `Fetched ${personalEvents.length} personal events for ${dateRange} range`
      );
    } catch (error) {
      console.error('Error fetching personal events:', error);
      Alert.alert('Error', `Failed to fetch personal events: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderEvent = (event, index) => {
    const eventDate = new Date(event.startTime);
    const isToday = eventDate.toDateString() === new Date().toDateString();

    return (
      <TouchableOpacity
        key={event.id || index}
        style={[
          styles.eventCard,
          isToday && styles.todayEvent,
          { borderLeftColor: event.color, borderLeftWidth: 4 },
        ]}
        onPress={() => showEventDetails(event)}
      >
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: getPriorityColor(event.priority) },
            ]}
          >
            <Text style={styles.priorityText}>
              {event.priority?.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.eventDescription}>{event.description}</Text>

        <View style={styles.eventFooter}>
          <Text style={styles.eventDate}>
            {eventDate.toLocaleDateString()}{' '}
            {!event.isAllDay && eventDate.toLocaleTimeString()}
          </Text>
          <Text style={styles.eventSource}>{event.source}</Text>
        </View>

        {event.status && (
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(event.status) },
            ]}
          >
            <Text style={styles.statusText}>{event.status}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const showEventDetails = (event) => {
    const details = `
Title: ${event.title}
Description: ${event.description}
Date: ${new Date(event.startTime).toLocaleDateString()}
Time: ${
      event.isAllDay
        ? 'All Day'
        : new Date(event.startTime).toLocaleTimeString()
    }
Priority: ${event.priority}
Status: ${event.status}
Source: ${event.source}
Category: ${event.type}
    `.trim();

    Alert.alert('Event Details', details);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#FF3B30';
      case 'medium':
        return '#FF9500';
      case 'low':
        return '#34C759';
      default:
        return '#8E8E93';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'completed':
        return '#34C759';
      case 'scheduled':
        return '#007AFF';
      case 'pending_review':
        return '#AF52DE';
      default:
        return '#8E8E93';
    }
  };

  const switchUserType = async () => {
    const newUserType =
      mockUserData.userType === 'student' ? 'teacher' : 'student';
    mockUserData.userType = newUserType;

    // Clear any existing calendar data to simulate fresh navigation
    try {
      await AsyncStorage.removeItem('calendarUserData');
      await AsyncStorage.removeItem('teacherCalendarData');
      await AsyncStorage.removeItem('selectedStudent');

      // If switching to teacher, set teacher calendar data
      if (newUserType === 'teacher') {
        await AsyncStorage.setItem(
          'teacherCalendarData',
          JSON.stringify(mockUserData)
        );
        console.log('🧪 TEST: Set teacher calendar data for testing');
      }
    } catch (error) {
      console.error('Error managing calendar data:', error);
    }

    // Reinitialize service with new user type
    initializeCalendarService();
    setEvents([]);

    Alert.alert('User Type Changed', `Now viewing as: ${newUserType}`);
  };

  const testRealAPI = async () => {
    if (!calendarService) {
      Alert.alert('Error', 'Calendar service not initialized');
      return;
    }

    setLoading(true);
    try {
      console.log('🧪 Testing real Personal Calendar API...');

      // Debug auth code usage
      const authDebug = calendarService.debugAuthCode();
      console.log('🔑 Auth Code Debug Info:', authDebug);

      // Test with real API (demo mode disabled)
      const testResults = await calendarService.testPersonalCalendarAPI(false);

      const resultMessage = `
API Test Results:
${testResults.success ? '✅ PASSED' : '❌ FAILED'}

Tests Run: ${testResults.tests.length}
Errors: ${testResults.errors.length}

API Endpoint: ${testResults.apiEndpoint}

Test Details:
${testResults.tests
  .map(
    (test) =>
      `• ${test.name}: ${test.success ? '✅' : '❌'} ${
        test.eventCount !== undefined ? `(${test.eventCount} events)` : ''
      }`
  )
  .join('\n')}

${
  testResults.errors.length > 0
    ? `\nErrors:\n${testResults.errors.join('\n')}`
    : ''
}
      `.trim();

      Alert.alert('API Test Results', resultMessage, [
        { text: 'OK' },
        {
          text: 'View Console',
          onPress: () => console.log('📊 Full test results:', testResults),
        },
      ]);

      // If test passed and returned events, display them
      if (
        testResults.success &&
        testResults.tests.some((t) => t.eventCount > 0)
      ) {
        await fetchPersonalEvents('default');
      }
    } catch (error) {
      console.error('❌ API test failed:', error);
      Alert.alert('API Test Failed', `Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testDemoMode = async () => {
    if (!calendarService) {
      Alert.alert('Error', 'Calendar service not initialized');
      return;
    }

    setLoading(true);
    try {
      console.log('🎭 Testing Demo Mode...');

      // Test with demo mode enabled
      const testResults = await calendarService.testPersonalCalendarAPI(true);

      const resultMessage = `
Demo Mode Test Results:
${testResults.success ? '✅ PASSED' : '❌ FAILED'}

Tests Run: ${testResults.tests.length}
Demo Events: ${
        testResults.tests.find((t) => t.name === 'Basic Personal Events Fetch')
          ?.eventCount || 0
      }

Test Details:
${testResults.tests
  .map(
    (test) =>
      `• ${test.name}: ${test.success ? '✅' : '❌'} ${
        test.eventCount !== undefined ? `(${test.eventCount} events)` : ''
      }`
  )
  .join('\n')}
      `.trim();

      Alert.alert('Demo Test Results', resultMessage);

      // Display demo events
      await fetchPersonalEvents('default');
    } catch (error) {
      console.error('❌ Demo test failed:', error);
      Alert.alert('Demo Test Failed', `Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const debugAuthCode = () => {
    if (!calendarService) {
      Alert.alert('Error', 'Calendar service not initialized');
      return;
    }

    const authDebug = calendarService.debugAuthCode();
    console.log('🔑 Auth Code Debug Info:', authDebug);

    const debugMessage = `
Auth Code Debug Info:

User Type: ${authDebug.userType}
User ID: ${authDebug.userId}
Username: ${authDebug.username}
Has Auth Code: ${authDebug.hasAuthCode ? 'Yes' : 'No'}
Auth Code Preview: ${authDebug.authCodePreview}

Full User Data:
${JSON.stringify(authDebug.fullUserData, null, 2)}
    `.trim();

    Alert.alert('Auth Code Debug', debugMessage, [
      { text: 'OK' },
      {
        text: 'Copy to Console',
        onPress: () => console.log('🔑 Auth Debug:', authDebug),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Personal Calendar Example</Text>
        <Text style={styles.subtitle}>
          User Type: {mockUserData.userType} | Demo Mode:{' '}
          {Config.DEV.USE_DUMMY_DATA ? 'ON' : 'OFF'}
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => fetchPersonalEvents('default')}
        >
          <Text style={styles.buttonText}>Default Range</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => fetchPersonalEvents('week')}
        >
          <Text style={styles.buttonText}>Next Week</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => fetchPersonalEvents('month')}
        >
          <Text style={styles.buttonText}>Next Month</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={testRealAPI}
        >
          <Text style={styles.buttonText}>Test Real API</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.demoButton]}
          onPress={testDemoMode}
        >
          <Text style={styles.buttonText}>Test Demo Mode</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.debugButton]}
          onPress={debugAuthCode}
        >
          <Text style={styles.buttonText}>Debug Auth Code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.switchButton]}
          onPress={switchUserType}
        >
          <Text style={styles.buttonText}>Switch User Type</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#007AFF' />
          <Text style={styles.loadingText}>Loading personal events...</Text>
        </View>
      ) : (
        <ScrollView style={styles.eventsContainer}>
          {events.length > 0 ? (
            events.map((event, index) => renderEvent(event, index))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No personal events found</Text>
              <Text style={styles.emptySubtext}>
                Try fetching events with different date ranges
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#007AFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    gap: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
  },
  switchButton: {
    backgroundColor: '#FF9500',
  },
  testButton: {
    backgroundColor: '#34C759',
  },
  demoButton: {
    backgroundColor: '#AF52DE',
  },
  debugButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  eventsContainer: {
    flex: 1,
    padding: 15,
  },
  eventCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  todayEvent: {
    backgroundColor: '#FFF9E6',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventDate: {
    fontSize: 12,
    color: '#999',
  },
  eventSource: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default PersonalCalendarExample;
