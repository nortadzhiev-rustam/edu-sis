/**
 * Calendar Test Utilities
 * Helper functions to test the multi-tenant calendar system
 */

import SchoolConfigService from '../services/schoolConfigService';
import CalendarService from '../services/calendarService';

/**
 * Test school configuration detection
 */
export const testSchoolDetection = async () => {
  console.log('🧪 CALENDAR TEST: Testing school detection...');

  const testCases = [
    {
      username: 'demo_teacher',
      userType: 'teacher',
      expectedSchool: 'Demo School',
    },
    {
      username: 'demo_student',
      userType: 'student',
      expectedSchool: 'Demo School',
    },
    {
      username: 'teacher@bfi.edu.mm',
      userType: 'teacher',
      expectedSchool: 'BFI International School',
    },
    {
      username: 'student123',
      userType: 'student',
      expectedSchool: 'BFI International School',
    }, // fallback
  ];

  for (const testCase of testCases) {
    try {
      const schoolConfig = await SchoolConfigService.detectSchoolFromLogin(
        testCase.username,
        testCase.userType
      );

      const success = schoolConfig.name === testCase.expectedSchool;
      console.log(
        `${success ? '✅' : '❌'} ${testCase.username} -> ${
          schoolConfig.name
        } (expected: ${testCase.expectedSchool})`
      );
    } catch (error) {
      console.error(`❌ Error testing ${testCase.username}:`, error);
    }
  }
};

/**
 * Test calendar service initialization
 */
export const testCalendarServiceInit = async () => {
  console.log('🧪 CALENDAR TEST: Testing calendar service initialization...');

  const mockUserData = {
    id: 'TEST_001',
    username: 'demo_teacher',
    authCode: 'DEMO_AUTH_T001',
    userType: 'teacher',
  };

  try {
    // Set up demo school config
    const schoolConfig = await SchoolConfigService.detectSchoolFromLogin(
      'demo_teacher',
      'teacher'
    );
    await SchoolConfigService.saveCurrentSchoolConfig(schoolConfig);

    // Initialize calendar service
    const calendarService = await CalendarService.initialize(mockUserData);

    console.log('✅ Calendar service initialized successfully');
    console.log(
      '📅 Google Calendar available:',
      calendarService.isGoogleCalendarAvailable()
    );

    return calendarService;
  } catch (error) {
    console.error('❌ Calendar service initialization failed:', error);
    return null;
  }
};

/**
 * Test event fetching (without Google Calendar)
 */
export const testEventFetching = async () => {
  console.log('🧪 CALENDAR TEST: Testing event fetching...');

  const mockUserData = {
    id: 'TEST_001',
    username: 'demo_teacher',
    authCode: 'DEMO_AUTH_T001',
    userType: 'teacher',
  };

  try {
    const calendarService = await CalendarService.initialize(mockUserData);

    // Test fetching events (will use demo/fallback data)
    const events = await calendarService.getAllEvents({
      includeGoogle: false, // Skip Google Calendar for this test
      includeTimetable: true,
      includeHomework: true,
      includeSchoolEvents: true,
    });

    console.log(`✅ Fetched ${events.length} events successfully`);

    // Log event types
    const eventTypes = events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 Event types:', eventTypes);

    return events;
  } catch (error) {
    console.error('❌ Event fetching failed:', error);
    return [];
  }
};

/**
 * Test school configuration caching
 */
export const testSchoolConfigCaching = async () => {
  console.log('🧪 CALENDAR TEST: Testing school configuration caching...');

  try {
    // Clear cache first
    await SchoolConfigService.clearCache();

    // Get config (should fetch and cache)
    const config1 = await SchoolConfigService.getSchoolConfig('demo_school');
    console.log('✅ First fetch completed');

    // Get config again (should use cache)
    const config2 = await SchoolConfigService.getSchoolConfig('demo_school');
    console.log('✅ Second fetch completed (from cache)');

    // Verify configs are the same
    const isSame = JSON.stringify(config1) === JSON.stringify(config2);
    console.log(`${isSame ? '✅' : '❌'} Cache consistency check`);

    return isSame;
  } catch (error) {
    console.error('❌ School config caching test failed:', error);
    return false;
  }
};

/**
 * Test multi-school scenario
 */
export const testMultiSchoolScenario = async () => {
  console.log('🧪 CALENDAR TEST: Testing multi-school scenario...');

  const schools = [
    {
      username: 'demo_teacher',
      expectedFeatures: { googleCalendar: false, nativeCalendar: true },
    },
    {
      username: 'teacher@bfi.edu.mm',
      expectedFeatures: { googleCalendar: true, nativeCalendar: false },
    },
  ];

  for (const school of schools) {
    try {
      const config = await SchoolConfigService.detectSchoolFromLogin(
        school.username,
        'teacher'
      );

      const googleMatch =
        config.features.googleCalendar ===
        school.expectedFeatures.googleCalendar;
      const nativeMatch =
        config.features.nativeCalendar ===
        school.expectedFeatures.nativeCalendar;

      console.log(
        `${googleMatch && nativeMatch ? '✅' : '❌'} ${school.username}: ` +
          `Google=${config.features.googleCalendar}, Native=${config.features.nativeCalendar}`
      );
    } catch (error) {
      console.error(`❌ Error testing ${school.username}:`, error);
    }
  }
};

/**
 * Test security and permissions
 */
export const testSecurityAndPermissions = async () => {
  console.log('🧪 CALENDAR TEST: Testing security and permissions...');

  const { default: CalendarSecurityService } = await import(
    '../services/calendarSecurityService'
  );

  const testUsers = [
    { userType: 'teacher', role: 'teacher', id: 'T001' },
    { userType: 'student', role: 'student', id: 'S001' },
    { userType: 'parent', role: 'parent', id: 'P001' },
    { userType: 'teacher', role: 'admin', id: 'A001' },
  ];

  const schoolConfig = {
    hasGoogleWorkspace: true,
    features: { googleCalendar: true },
    domain: 'bfi.edu.mm',
  };

  for (const user of testUsers) {
    const canAccess = CalendarSecurityService.canAccessGoogleCalendar(
      user,
      schoolConfig
    );
    const canCreate = CalendarSecurityService.canCreateCalendarEvents(
      user,
      schoolConfig
    );

    console.log(
      `${user.userType} (${user.role}): Access=${canAccess}, Create=${canCreate}`
    );
  }
};

/**
 * Test performance with large datasets
 */
export const testPerformance = async () => {
  console.log('🧪 CALENDAR TEST: Testing performance...');

  // Generate large dataset
  const generateLargeEventSet = (count) => {
    const events = [];
    for (let i = 0; i < count; i++) {
      events.push({
        id: `event_${i}`,
        title: `Event ${i}`,
        startTime: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
        type:
          i % 3 === 0 ? 'timetable' : i % 3 === 1 ? 'homework' : 'school_event',
        originalData: { created_by: 'test_user' },
      });
    }
    return events;
  };

  const testSizes = [100, 500, 1000];

  for (const size of testSizes) {
    const events = generateLargeEventSet(size);

    const startTime = performance.now();

    // Test filtering performance
    const { default: CalendarSecurityService } = await import(
      '../services/calendarSecurityService'
    );
    const mockUser = { userType: 'teacher', id: 'test' };
    const mockSchoolConfig = { hasGoogleWorkspace: true };

    const filteredEvents = CalendarSecurityService.filterEventsForUser(
      events,
      mockUser,
      mockSchoolConfig
    );

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(
      `✅ Filtered ${size} events in ${duration.toFixed(2)}ms (${
        filteredEvents.length
      } visible)`
    );
  }
};

/**
 * Test error handling and edge cases
 */
export const testErrorHandling = async () => {
  console.log('🧪 CALENDAR TEST: Testing error handling...');

  const testCases = [
    {
      name: 'Null school config',
      schoolConfig: null,
      userData: { userType: 'teacher' },
      shouldFail: true,
    },
    {
      name: 'Invalid user type',
      schoolConfig: { hasGoogleWorkspace: true },
      userData: { userType: 'invalid' },
      shouldFail: true,
    },
    {
      name: 'Missing permissions',
      schoolConfig: { hasGoogleWorkspace: false },
      userData: { userType: 'student' },
      shouldFail: false,
    },
  ];

  const { default: CalendarSecurityService } = await import(
    '../services/calendarSecurityService'
  );

  for (const testCase of testCases) {
    try {
      const result = CalendarSecurityService.canAccessGoogleCalendar(
        testCase.userData,
        testCase.schoolConfig
      );

      const success = testCase.shouldFail ? !result : result !== undefined;
      console.log(`${success ? '✅' : '❌'} ${testCase.name}: ${result}`);
    } catch (error) {
      const success = testCase.shouldFail;
      console.log(
        `${success ? '✅' : '❌'} ${testCase.name}: Error caught - ${
          error.message
        }`
      );
    }
  }
};

/**
 * Test rate limiting
 */
export const testRateLimiting = async () => {
  console.log('🧪 CALENDAR TEST: Testing rate limiting...');

  const { default: CalendarSecurityService } = await import(
    '../services/calendarSecurityService'
  );

  const userId = 'test_user_rate_limit';
  const action = 'test_action';

  // Clear any existing rate limit data
  const AsyncStorage = await import(
    '@react-native-async-storage/async-storage'
  );
  await AsyncStorage.default.removeItem(`rate_limit_${userId}_${action}`);

  let allowedCount = 0;
  let deniedCount = 0;

  // Test multiple rapid calls
  for (let i = 0; i < 15; i++) {
    const allowed = await CalendarSecurityService.checkRateLimit(
      userId,
      action
    );
    if (allowed) {
      allowedCount++;
    } else {
      deniedCount++;
    }
  }

  console.log(
    `✅ Rate limiting test: ${allowedCount} allowed, ${deniedCount} denied`
  );

  // Clean up
  await AsyncStorage.default.removeItem(`rate_limit_${userId}_${action}`);
};

/**
 * Run all calendar tests
 */
export const runAllCalendarTests = async () => {
  console.log('🧪 CALENDAR TEST: Running all calendar tests...');
  console.log('================================================');

  try {
    await testSchoolDetection();
    console.log('');

    await testSchoolConfigCaching();
    console.log('');

    await testMultiSchoolScenario();
    console.log('');

    await testCalendarServiceInit();
    console.log('');

    await testEventFetching();
    console.log('');

    await testSecurityAndPermissions();
    console.log('');

    await testPerformance();
    console.log('');

    await testErrorHandling();
    console.log('');

    await testRateLimiting();
    console.log('');

    console.log('🎉 All calendar tests completed!');
  } catch (error) {
    console.error('❌ Calendar test suite failed:', error);
  }
};

/**
 * Quick demo of calendar functionality
 */
export const demoCalendarFunctionality = async () => {
  console.log('🎬 CALENDAR DEMO: Demonstrating calendar functionality...');

  try {
    // Demo 1: School detection
    console.log('📍 Demo 1: School Detection');
    const demoConfig = await SchoolConfigService.detectSchoolFromLogin(
      'demo_teacher',
      'teacher'
    );
    console.log(`   Detected: ${demoConfig.name}`);
    console.log(
      `   Google Calendar: ${
        demoConfig.hasGoogleWorkspace ? 'Available' : 'Not Available'
      }`
    );

    // Demo 2: Calendar service
    console.log('📅 Demo 2: Calendar Service');
    await SchoolConfigService.saveCurrentSchoolConfig(demoConfig);

    const mockUser = {
      username: 'demo_teacher',
      authCode: 'DEMO_AUTH_T001',
      userType: 'teacher',
    };

    const service = await CalendarService.initialize(mockUser);
    console.log(`   Service initialized: ${service ? 'Success' : 'Failed'}`);
    console.log(
      `   Google Calendar available: ${
        service?.isGoogleCalendarAvailable() || false
      }`
    );

    // Demo 3: Event types
    console.log('📊 Demo 3: Event Types Available');
    console.log('   - Timetable events (from existing API)');
    console.log('   - Homework deadlines (from existing API)');
    console.log('   - School events (future API)');
    if (service?.isGoogleCalendarAvailable()) {
      console.log('   - Google Calendar events (when signed in)');
    }

    console.log('✨ Demo completed successfully!');
  } catch (error) {
    console.error('❌ Calendar demo failed:', error);
  }
};

export default {
  testSchoolDetection,
  testCalendarServiceInit,
  testEventFetching,
  testSchoolConfigCaching,
  testMultiSchoolScenario,
  runAllCalendarTests,
  demoCalendarFunctionality,
};
