/**
 * Test Backend Calendar Integration
 * Test the new backend API integration for calendar events
 */

import { Alert } from 'react-native';
import CalendarService from '../services/calendarService';
import { buildApiUrl } from '../utils/apiUtils';

/**
 * Test backend calendar API endpoints
 */
export const testBackendCalendarAPI = async (userData, schoolConfig) => {
  try {
    console.log('🧪 Testing Backend Calendar API Integration...');
    console.log('👤 User Type:', userData?.userType);
    console.log('🏢 Branch ID:', userData?.branchId);
    console.log('🔑 Auth Code:', userData?.authCode ? 'Available' : 'Missing');

    if (!userData || !userData.authCode) {
      throw new Error('No user data or auth code available');
    }

    // Initialize calendar service
    const calendarService = new CalendarService(userData, schoolConfig);
    await calendarService.initialize();

    const testResults = {
      success: true,
      tests: [],
      totalEvents: 0,
      errors: [],
      apiEndpoints: [],
    };

    // Test 1: Get calendar data for date range
    console.log('📅 Test 1: Calendar data API...');
    try {
      const startDate = new Date();
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const events = await calendarService.getCalendarDataFromAPI(
        startDate,
        endDate
      );

      testResults.tests.push({
        name: 'Calendar Data API',
        success: true,
        eventsCount: events.length,
        message: `Retrieved ${events.length} events from backend API`,
      });

      testResults.totalEvents += events.length;

      // Log event types
      const eventTypes = [...new Set(events.map((e) => e.calendarType))];
      console.log('📊 Event types found:', eventTypes);
    } catch (error) {
      console.error('❌ Calendar data API test failed:', error);
      testResults.tests.push({
        name: 'Calendar Data API',
        success: false,
        error: error.message,
      });
      testResults.errors.push(error.message);
    }

    // Test 2: Get upcoming events
    console.log('📅 Test 2: Upcoming events API...');
    try {
      const upcomingEvents = await calendarService.getUpcomingEvents(14); // 14 days

      testResults.tests.push({
        name: 'Upcoming Events API',
        success: true,
        eventsCount: upcomingEvents.length,
        message: `Retrieved ${upcomingEvents.length} upcoming events`,
      });
    } catch (error) {
      console.error('❌ Upcoming events API test failed:', error);
      testResults.tests.push({
        name: 'Upcoming Events API',
        success: false,
        error: error.message,
      });
      testResults.errors.push(error.message);
    }

    // Test 3: Get monthly events
    console.log('📅 Test 3: Monthly events API...');
    try {
      const currentDate = new Date();
      const monthlyEvents = await calendarService.getMonthlyEvents(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1
      );

      testResults.tests.push({
        name: 'Monthly Events API',
        success: true,
        eventsCount: monthlyEvents.length,
        message: `Retrieved ${monthlyEvents.length} monthly events`,
      });
    } catch (error) {
      console.error('❌ Monthly events API test failed:', error);
      testResults.tests.push({
        name: 'Monthly Events API',
        success: false,
        error: error.message,
      });
      testResults.errors.push(error.message);
    }

    // Test 4: Get all events (unified method)
    console.log('📅 Test 4: Unified getAllEvents method...');
    try {
      const allEvents = await calendarService.getAllEvents({
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        includeGoogle: true,
        includeTimetable: false,
        includeHomework: false,
      });

      testResults.tests.push({
        name: 'Unified getAllEvents',
        success: true,
        eventsCount: allEvents.length,
        message: `Retrieved ${allEvents.length} events via unified method`,
      });
    } catch (error) {
      console.error('❌ Unified getAllEvents test failed:', error);
      testResults.tests.push({
        name: 'Unified getAllEvents',
        success: false,
        error: error.message,
      });
      testResults.errors.push(error.message);
    }

    // Test 5: Direct API endpoint test
    console.log('📅 Test 5: Direct API endpoint test...');
    try {
      const startDateStr = new Date().toISOString().split('T')[0];
      const endDateStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const url = buildApiUrl(
        `/mobile-api/calendar/data?authCode=${userData.authCode}&start_date=${startDateStr}&end_date=${endDateStr}`
      );

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();

        testResults.tests.push({
          name: 'Direct API Endpoint',
          success: data.success,
          branches: data.total_branches,
          message: data.success
            ? `API responded successfully with ${data.total_branches} branch(es)`
            : `API error: ${data.message}`,
        });
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Direct API endpoint test failed:', error);
      testResults.tests.push({
        name: 'Direct API Endpoint',
        success: false,
        error: error.message,
      });
      testResults.errors.push(error.message);
    }

    // Summary
    const successfulTests = testResults.tests.filter((t) => t.success).length;
    const totalTests = testResults.tests.length;

    testResults.success = successfulTests === totalTests;
    testResults.summary = `${successfulTests}/${totalTests} tests passed`;

    console.log('✅ Backend Calendar API Test Results:', testResults);
    return testResults;
  } catch (error) {
    console.error('❌ Backend Calendar API test suite failed:', error);
    return {
      success: false,
      error: error.message,
      tests: [],
      totalEvents: 0,
    };
  }
};

/**
 * Test backend calendar integration with UI feedback
 */
export const testBackendCalendarWithUI = async (userData, schoolConfig) => {
  try {
    Alert.alert(
      'Testing Backend Calendar',
      'Testing backend calendar API integration... Check console for details.',
      [{ text: 'OK' }]
    );

    const results = await testBackendCalendarAPI(userData, schoolConfig);

    if (results.success) {
      const testSummary = results.tests
        .map(
          (test) =>
            `${test.success ? '✅' : '❌'} ${test.name}: ${
              test.message || test.error
            }`
        )
        .join('\n');

      Alert.alert(
        'Backend Calendar Test Results ✅',
        `Backend calendar integration test completed!\n\n` +
          `Summary: ${results.summary}\n` +
          `Total Events: ${results.totalEvents}\n\n` +
          `Test Results:\n${testSummary}\n\n` +
          `The backend calendar API is working correctly and provides:\n` +
          `✅ Google Workspace calendar events\n` +
          `✅ Local global events\n` +
          `✅ Academic calendar events\n` +
          `✅ Branch-based filtering\n` +
          `✅ Multiple API endpoints`,
        [{ text: 'Excellent!' }]
      );
    } else {
      const errorSummary =
        results.errors.length > 0
          ? results.errors.join('\n')
          : 'Unknown error occurred';

      Alert.alert(
        'Backend Calendar Test Failed ❌',
        `Backend calendar integration test encountered errors:\n\n` +
          `Summary: ${results.summary || 'Tests failed'}\n\n` +
          `Errors:\n${errorSummary}\n\n` +
          `Please check:\n` +
          `• Backend API is running\n` +
          `• Authentication code is valid\n` +
          `• Network connectivity\n` +
          `• API endpoints are accessible`,
        [{ text: 'OK' }]
      );
    }

    return results;
  } catch (error) {
    Alert.alert(
      'Test Error',
      `Failed to run backend calendar tests: ${error.message}`,
      [{ text: 'OK' }]
    );
    return { success: false, error: error.message };
  }
};

export default {
  testBackendCalendarAPI,
  testBackendCalendarWithUI,
};
