/**
 * Calendar Test Runner
 * Easy way to run all calendar tests from the app
 */

import { Alert } from 'react-native';
import { runAllCalendarTests, demoCalendarFunctionality } from './calendarTestUtils';

/**
 * Run calendar tests with UI feedback
 * @param {boolean} showDemo - Whether to show demo after tests
 */
export const runCalendarTestsWithUI = async (showDemo = true) => {
  try {
    console.log('🚀 Starting calendar test suite...');
    
    // Show loading alert
    Alert.alert(
      'Running Tests',
      'Calendar tests are running. Check console for detailed results.',
      [{ text: 'OK' }]
    );

    // Run all tests
    await runAllCalendarTests();

    // Show demo if requested
    if (showDemo) {
      console.log('\n' + '='.repeat(50));
      await demoCalendarFunctionality();
    }

    // Show success alert
    Alert.alert(
      'Tests Complete',
      'All calendar tests have completed successfully! Check the console for detailed results.',
      [{ text: 'Great!' }]
    );

    return true;

  } catch (error) {
    console.error('❌ Calendar test suite failed:', error);
    
    Alert.alert(
      'Tests Failed',
      `Calendar tests encountered an error: ${error.message}`,
      [{ text: 'OK' }]
    );

    return false;
  }
};

/**
 * Quick health check for calendar system
 */
export const quickHealthCheck = async () => {
  try {
    console.log('🏥 CALENDAR HEALTH CHECK: Starting...');
    
    const results = {
      schoolDetection: false,
      serviceInit: false,
      security: false,
      performance: false,
      overall: false
    };

    // Test 1: School Detection
    try {
      const { testSchoolDetection } = await import('./calendarTestUtils');
      await testSchoolDetection();
      results.schoolDetection = true;
      console.log('✅ School detection: PASS');
    } catch (error) {
      console.log('❌ School detection: FAIL -', error.message);
    }

    // Test 2: Service Initialization
    try {
      const { testCalendarServiceInit } = await import('./calendarTestUtils');
      const service = await testCalendarServiceInit();
      results.serviceInit = !!service;
      console.log('✅ Service initialization: PASS');
    } catch (error) {
      console.log('❌ Service initialization: FAIL -', error.message);
    }

    // Test 3: Security
    try {
      const { testSecurityAndPermissions } = await import('./calendarTestUtils');
      await testSecurityAndPermissions();
      results.security = true;
      console.log('✅ Security and permissions: PASS');
    } catch (error) {
      console.log('❌ Security and permissions: FAIL -', error.message);
    }

    // Test 4: Performance
    try {
      const { testPerformance } = await import('./calendarTestUtils');
      await testPerformance();
      results.performance = true;
      console.log('✅ Performance: PASS');
    } catch (error) {
      console.log('❌ Performance: FAIL -', error.message);
    }

    // Overall health
    const passedTests = Object.values(results).filter(Boolean).length - 1; // -1 for overall
    results.overall = passedTests >= 3; // At least 3 out of 4 tests should pass

    console.log('\n🏥 CALENDAR HEALTH CHECK SUMMARY:');
    console.log(`School Detection: ${results.schoolDetection ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Service Init: ${results.serviceInit ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Security: ${results.security ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Performance: ${results.performance ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Overall Health: ${results.overall ? '✅ HEALTHY' : '❌ NEEDS ATTENTION'}`);

    return results;

  } catch (error) {
    console.error('❌ Health check failed:', error);
    return { overall: false, error: error.message };
  }
};

/**
 * Test specific user scenario
 * @param {string} userType - User type to test (teacher/student/parent)
 * @param {string} schoolType - School type (google_workspace/native)
 */
export const testUserScenario = async (userType = 'teacher', schoolType = 'google_workspace') => {
  try {
    console.log(`🎭 TESTING USER SCENARIO: ${userType} at ${schoolType} school`);

    const SchoolConfigService = (await import('../services/schoolConfigService')).default;
    const CalendarService = (await import('../services/calendarService')).default;

    // Set up test scenario
    const mockUser = {
      id: `test_${userType}_001`,
      username: schoolType === 'google_workspace' ? `${userType}@bfi.edu.mm` : `demo_${userType}`,
      userType: userType,
      authCode: `TEST_AUTH_${userType.toUpperCase()}_001`,
    };

    // Detect school
    const schoolConfig = await SchoolConfigService.detectSchoolFromLogin(
      mockUser.username,
      mockUser.userType
    );

    console.log(`📍 Detected school: ${schoolConfig.name}`);
    console.log(`🔧 Google Workspace: ${schoolConfig.hasGoogleWorkspace ? 'Available' : 'Not Available'}`);

    // Save school config
    await SchoolConfigService.saveCurrentSchoolConfig(schoolConfig);

    // Initialize calendar service
    const calendarService = await CalendarService.initialize(mockUser);
    console.log(`📅 Calendar service initialized: ${!!calendarService}`);
    console.log(`📊 Google Calendar available: ${calendarService.isGoogleCalendarAvailable()}`);

    // Test event fetching (without Google to avoid auth issues)
    const events = await calendarService.getAllEvents({
      includeGoogle: false,
      includeTimetable: true,
      includeHomework: true,
      includeSchoolEvents: true,
      includeNotifications: true,
    });

    console.log(`📋 Retrieved ${events.length} events for ${userType}`);

    // Test cache
    const cacheStats = calendarService.getCacheStats();
    console.log(`💾 Cache stats:`, cacheStats);

    console.log(`✅ User scenario test completed successfully for ${userType}`);
    
    return {
      success: true,
      userType,
      schoolType,
      schoolName: schoolConfig.name,
      hasGoogleWorkspace: schoolConfig.hasGoogleWorkspace,
      eventsCount: events.length,
      cacheStats
    };

  } catch (error) {
    console.error(`❌ User scenario test failed for ${userType}:`, error);
    return {
      success: false,
      userType,
      schoolType,
      error: error.message
    };
  }
};

/**
 * Benchmark calendar performance
 */
export const benchmarkCalendarPerformance = async () => {
  try {
    console.log('⚡ CALENDAR PERFORMANCE BENCHMARK: Starting...');

    const results = {
      schoolDetection: [],
      eventFiltering: [],
      caching: [],
      overall: {}
    };

    // Benchmark 1: School Detection Speed
    console.log('📊 Benchmarking school detection...');
    const SchoolConfigService = (await import('../services/schoolConfigService')).default;
    
    const testUsers = [
      'demo_teacher',
      'teacher@bfi.edu.mm',
      'student123',
      'demo_student'
    ];

    for (const username of testUsers) {
      const startTime = performance.now();
      await SchoolConfigService.detectSchoolFromLogin(username, 'teacher');
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      results.schoolDetection.push({ username, duration });
      console.log(`  ${username}: ${duration.toFixed(2)}ms`);
    }

    // Benchmark 2: Event Filtering Performance
    console.log('📊 Benchmarking event filtering...');
    const { testPerformance } = await import('./calendarTestUtils');
    
    const filterStartTime = performance.now();
    await testPerformance();
    const filterEndTime = performance.now();
    
    results.eventFiltering.push({
      operation: 'filter_large_dataset',
      duration: filterEndTime - filterStartTime
    });

    // Benchmark 3: Caching Performance
    console.log('📊 Benchmarking caching...');
    const { testSchoolConfigCaching } = await import('./calendarTestUtils');
    
    const cacheStartTime = performance.now();
    await testSchoolConfigCaching();
    const cacheEndTime = performance.now();
    
    results.caching.push({
      operation: 'config_caching',
      duration: cacheEndTime - cacheStartTime
    });

    // Calculate overall performance
    const avgSchoolDetection = results.schoolDetection.reduce((sum, r) => sum + r.duration, 0) / results.schoolDetection.length;
    const avgEventFiltering = results.eventFiltering.reduce((sum, r) => sum + r.duration, 0) / results.eventFiltering.length;
    const avgCaching = results.caching.reduce((sum, r) => sum + r.duration, 0) / results.caching.length;

    results.overall = {
      avgSchoolDetection: avgSchoolDetection.toFixed(2),
      avgEventFiltering: avgEventFiltering.toFixed(2),
      avgCaching: avgCaching.toFixed(2),
      totalBenchmarkTime: (performance.now() - performance.now()).toFixed(2)
    };

    console.log('\n⚡ PERFORMANCE BENCHMARK RESULTS:');
    console.log(`Average School Detection: ${results.overall.avgSchoolDetection}ms`);
    console.log(`Average Event Filtering: ${results.overall.avgEventFiltering}ms`);
    console.log(`Average Caching: ${results.overall.avgCaching}ms`);

    return results;

  } catch (error) {
    console.error('❌ Performance benchmark failed:', error);
    return { error: error.message };
  }
};

export default {
  runCalendarTestsWithUI,
  quickHealthCheck,
  testUserScenario,
  benchmarkCalendarPerformance,
};
