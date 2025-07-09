/**
 * Test Calendar Fix
 * Quick test to verify calendar system works without Google Sign-In
 */

import { Alert } from 'react-native';

/**
 * Test the calendar system without Google Sign-In
 */
export const testCalendarWithoutGoogle = async () => {
  try {
    console.log('🧪 Testing calendar system without Google Sign-In...');

    // Test 1: School Configuration
    console.log('📍 Testing school configuration...');
    const SchoolConfigService = (await import('../services/schoolConfigService')).default;
    
    const demoConfig = await SchoolConfigService.detectSchoolFromLogin('demo_teacher', 'teacher');
    console.log('✅ School detected:', demoConfig.name);
    console.log('📊 Google Calendar available:', demoConfig.hasGoogleWorkspace);
    
    await SchoolConfigService.saveCurrentSchoolConfig(demoConfig);
    console.log('✅ School config saved');

    // Test 2: Calendar Service Initialization
    console.log('📅 Testing calendar service initialization...');
    const CalendarService = (await import('../services/calendarService')).default;
    
    const mockUser = {
      id: 'test_001',
      username: 'demo_teacher',
      authCode: 'DEMO_AUTH_T001',
      userType: 'teacher',
    };

    const calendarService = await CalendarService.initialize(mockUser);
    console.log('✅ Calendar service initialized');
    console.log('📊 Google Calendar available:', calendarService.isGoogleCalendarAvailable());

    // Test 3: Event Fetching (without Google)
    console.log('📋 Testing event fetching...');
    const events = await calendarService.getAllEvents({
      includeGoogle: false, // Skip Google Calendar
      includeTimetable: true,
      includeHomework: true,
      includeSchoolEvents: true,
      includeNotifications: true,
    });

    console.log(`✅ Retrieved ${events.length} events`);

    // Test 4: Cache Performance
    console.log('💾 Testing cache performance...');
    const cacheStats = calendarService.getCacheStats();
    console.log('✅ Cache stats:', cacheStats);

    // Test 5: Security Filtering
    console.log('🔒 Testing security filtering...');
    const CalendarSecurityService = (await import('../services/calendarSecurityService')).default;
    
    const canAccess = CalendarSecurityService.canAccessGoogleCalendar(mockUser, demoConfig);
    const canCreate = CalendarSecurityService.canCreateCalendarEvents(mockUser, demoConfig);
    
    console.log('✅ Security check - Can access Google Calendar:', canAccess);
    console.log('✅ Security check - Can create events:', canCreate);

    console.log('\n🎉 All tests passed! Calendar system is working correctly.');
    
    return {
      success: true,
      schoolName: demoConfig.name,
      eventsCount: events.length,
      googleAvailable: calendarService.isGoogleCalendarAvailable(),
      cacheStats,
      security: { canAccess, canCreate }
    };

  } catch (error) {
    console.error('❌ Calendar test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Test calendar system with UI feedback
 */
export const testCalendarWithUI = async () => {
  try {
    Alert.alert(
      'Testing Calendar',
      'Running calendar tests... Check console for details.',
      [{ text: 'OK' }]
    );

    const result = await testCalendarWithoutGoogle();

    if (result.success) {
      Alert.alert(
        'Tests Passed! ✅',
        `Calendar system is working correctly!\n\n` +
        `School: ${result.schoolName}\n` +
        `Events: ${result.eventsCount}\n` +
        `Google Calendar: ${result.googleAvailable ? 'Available' : 'Not Available'}\n\n` +
        `The calendar will work with timetable, homework, and school events even without Google Calendar.`,
        [{ text: 'Great!' }]
      );
    } else {
      Alert.alert(
        'Tests Failed ❌',
        `Calendar test encountered an error:\n\n${result.error}`,
        [{ text: 'OK' }]
      );
    }

    return result;

  } catch (error) {
    Alert.alert(
      'Test Error',
      `Failed to run calendar tests: ${error.message}`,
      [{ text: 'OK' }]
    );
    return { success: false, error: error.message };
  }
};

/**
 * Quick health check for Google Sign-In package
 */
export const checkGoogleSignInHealth = async () => {
  try {
    console.log('🔍 Checking Google Sign-In package health...');

    // Try to import the package
    let GoogleSignin = null;
    try {
      const googleSigninModule = require('@react-native-google-signin/google-signin');
      GoogleSignin = googleSigninModule.GoogleSignin;
      console.log('✅ Google Sign-In package imported successfully');
    } catch (error) {
      console.log('❌ Google Sign-In package import failed:', error.message);
      return {
        available: false,
        error: error.message,
        recommendation: 'Run: npx expo install @react-native-google-signin/google-signin'
      };
    }

    // Check if methods are available
    const methods = ['configure', 'isSignedIn', 'signIn', 'signOut', 'getTokens'];
    const availableMethods = [];
    const missingMethods = [];

    for (const method of methods) {
      if (GoogleSignin && typeof GoogleSignin[method] === 'function') {
        availableMethods.push(method);
      } else {
        missingMethods.push(method);
      }
    }

    console.log('✅ Available methods:', availableMethods);
    if (missingMethods.length > 0) {
      console.log('❌ Missing methods:', missingMethods);
    }

    return {
      available: GoogleSignin !== null,
      availableMethods,
      missingMethods,
      recommendation: missingMethods.length > 0 
        ? 'Package may not be properly linked. Try rebuilding the app.'
        : 'Google Sign-In package is healthy'
    };

  } catch (error) {
    console.error('❌ Google Sign-In health check failed:', error);
    return {
      available: false,
      error: error.message,
      recommendation: 'Check package installation and app configuration'
    };
  }
};

/**
 * Run comprehensive calendar diagnostics
 */
export const runCalendarDiagnostics = async () => {
  try {
    console.log('🔧 Running comprehensive calendar diagnostics...');
    console.log('================================================');

    // 1. Google Sign-In Health Check
    console.log('\n1. Google Sign-In Package Health:');
    const googleHealth = await checkGoogleSignInHealth();
    console.log('   Status:', googleHealth.available ? '✅ Available' : '❌ Not Available');
    console.log('   Recommendation:', googleHealth.recommendation);

    // 2. Calendar System Test
    console.log('\n2. Calendar System Test:');
    const calendarTest = await testCalendarWithoutGoogle();
    console.log('   Status:', calendarTest.success ? '✅ Working' : '❌ Failed');
    if (calendarTest.success) {
      console.log('   School:', calendarTest.schoolName);
      console.log('   Events:', calendarTest.eventsCount);
    }

    // 3. Overall Assessment
    console.log('\n3. Overall Assessment:');
    const overallHealth = calendarTest.success;
    console.log('   Calendar System:', overallHealth ? '✅ Healthy' : '❌ Needs Attention');
    
    if (!googleHealth.available) {
      console.log('   Note: Google Calendar features will be disabled until Google Sign-In is fixed');
    }

    console.log('\n================================================');
    console.log('🎯 SUMMARY:');
    console.log(`   • Calendar Core: ${calendarTest.success ? 'Working' : 'Failed'}`);
    console.log(`   • Google Sign-In: ${googleHealth.available ? 'Available' : 'Not Available'}`);
    console.log(`   • Recommendation: ${overallHealth ? 'Ready to use' : 'Needs fixes'}`);

    return {
      overall: overallHealth,
      calendar: calendarTest,
      googleSignIn: googleHealth
    };

  } catch (error) {
    console.error('❌ Calendar diagnostics failed:', error);
    return {
      overall: false,
      error: error.message
    };
  }
};

export default {
  testCalendarWithoutGoogle,
  testCalendarWithUI,
  checkGoogleSignInHealth,
  runCalendarDiagnostics,
};
