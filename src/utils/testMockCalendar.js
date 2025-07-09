/**
 * Test Mock Calendar
 * Quick test to verify the mock Google Calendar service works
 */

import { Alert } from 'react-native';

/**
 * Test the mock Google Calendar service
 */
export const testMockGoogleCalendar = async () => {
  try {
    console.log('🧪 Testing Mock Google Calendar Service...');

    // Test 1: School Configuration
    console.log('📍 Testing school configuration...');
    const SchoolConfigService = (await import('../services/schoolConfigService')).default;
    
    const demoConfig = await SchoolConfigService.detectSchoolFromLogin('demo_teacher', 'teacher');
    console.log('✅ School detected:', demoConfig.name);
    console.log('📊 Google Calendar available:', demoConfig.hasGoogleWorkspace);
    
    await SchoolConfigService.saveCurrentSchoolConfig(demoConfig);
    console.log('✅ School config saved');

    // Test 2: Google Calendar Service Initialization
    console.log('📅 Testing Google Calendar service initialization...');
    const GoogleCalendarService = (await import('../services/googleCalendarService')).default;
    
    const googleService = await GoogleCalendarService.initialize(demoConfig);
    console.log('✅ Google Calendar service initialized');
    console.log('📊 Service type:', googleService.constructor.name);
    console.log('📊 Google Calendar available:', googleService.isGoogleCalendarAvailable());

    // Test 3: Mock Sign-In
    console.log('🔐 Testing mock Google sign-in...');
    const userInfo = await googleService.signIn();
    console.log('✅ Mock sign-in successful');
    console.log('👤 Mock user:', userInfo.user.email);

    // Test 4: Mock Events
    console.log('📋 Testing mock event fetching...');
    const events = await googleService.getCalendarEvents({
      timeMin: new Date().toISOString(),
      timeMax: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      maxResults: 20
    });

    console.log(`✅ Retrieved ${events.length} mock events`);
    
    // Log sample events
    events.slice(0, 3).forEach((event, index) => {
      console.log(`   ${index + 1}. ${event.summary} (${event.calendarType})`);
    });

    // Test 5: Mock Sign-Out
    console.log('🚪 Testing mock sign-out...');
    await googleService.signOut();
    console.log('✅ Mock sign-out successful');

    console.log('\n🎉 All mock Google Calendar tests passed!');
    
    return {
      success: true,
      schoolName: demoConfig.name,
      serviceType: googleService.constructor.name,
      eventsCount: events.length,
      mockUser: userInfo.user.email,
      sampleEvents: events.slice(0, 3).map(e => ({
        title: e.summary,
        type: e.calendarType,
        date: new Date(e.start.dateTime).toLocaleDateString()
      }))
    };

  } catch (error) {
    console.error('❌ Mock Google Calendar test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Test mock calendar with UI feedback
 */
export const testMockCalendarWithUI = async () => {
  try {
    Alert.alert(
      'Testing Mock Calendar',
      'Running mock Google Calendar tests... Check console for details.',
      [{ text: 'OK' }]
    );

    const result = await testMockGoogleCalendar();

    if (result.success) {
      Alert.alert(
        'Mock Calendar Works! ✅',
        `Mock Google Calendar is working perfectly!\n\n` +
        `School: ${result.schoolName}\n` +
        `Service: ${result.serviceType}\n` +
        `Mock Events: ${result.eventsCount}\n` +
        `Mock User: ${result.mockUser}\n\n` +
        `Sample Events:\n` +
        result.sampleEvents.map(e => `• ${e.title} (${e.date})`).join('\n').substring(0, 100) + '...\n\n' +
        `You can now use Google Calendar features in the app!`,
        [{ text: 'Awesome!' }]
      );
    } else {
      Alert.alert(
        'Mock Calendar Failed ❌',
        `Mock Google Calendar test encountered an error:\n\n${result.error}`,
        [{ text: 'OK' }]
      );
    }

    return result;

  } catch (error) {
    Alert.alert(
      'Test Error',
      `Failed to run mock calendar tests: ${error.message}`,
      [{ text: 'OK' }]
    );
    return { success: false, error: error.message };
  }
};

/**
 * Quick demo of mock calendar functionality
 */
export const demoMockCalendarFunctionality = async () => {
  try {
    console.log('🎬 MOCK CALENDAR DEMO: Demonstrating functionality...');

    // Demo 1: Service Detection
    console.log('📍 Demo 1: Service Detection');
    const GoogleCalendarService = (await import('../services/googleCalendarService')).default;
    const SchoolConfigService = (await import('../services/schoolConfigService')).default;
    
    const demoConfig = await SchoolConfigService.detectSchoolFromLogin('demo_teacher', 'teacher');
    const service = await GoogleCalendarService.initialize(demoConfig);
    
    console.log(`   Service Type: ${service.constructor.name}`);
    console.log(`   Is Mock: ${service.constructor.name.includes('Mock')}`);
    console.log(`   Google Calendar Available: ${service.isGoogleCalendarAvailable()}`);

    // Demo 2: Mock Authentication
    console.log('🔐 Demo 2: Mock Authentication');
    const userInfo = await service.signIn();
    console.log(`   Mock User Email: ${userInfo.user.email}`);
    console.log(`   Mock User Name: ${userInfo.user.name}`);
    console.log(`   Mock Domain: ${userInfo.user.email.split('@')[1]}`);

    // Demo 3: Mock Events Generation
    console.log('📊 Demo 3: Mock Events Generation');
    const events = await service.getCalendarEvents({ maxResults: 10 });
    
    const eventsByType = events.reduce((acc, event) => {
      acc[event.calendarType] = (acc[event.calendarType] || 0) + 1;
      return acc;
    }, {});
    
    console.log(`   Total Events: ${events.length}`);
    console.log(`   Events by Type:`, eventsByType);
    
    // Demo 4: Event Details
    console.log('📋 Demo 4: Sample Event Details');
    if (events.length > 0) {
      const sampleEvent = events[0];
      console.log(`   Title: ${sampleEvent.summary}`);
      console.log(`   Type: ${sampleEvent.calendarType}`);
      console.log(`   Date: ${new Date(sampleEvent.start.dateTime).toLocaleDateString()}`);
      console.log(`   Location: ${sampleEvent.location}`);
    }

    console.log('✨ Mock calendar demo completed successfully!');
    
    return {
      success: true,
      serviceType: service.constructor.name,
      isMock: service.constructor.name.includes('Mock'),
      eventsGenerated: events.length,
      eventTypes: Object.keys(eventsByType),
      mockUser: userInfo.user.email
    };

  } catch (error) {
    console.error('❌ Mock calendar demo failed:', error);
    return { success: false, error: error.message };
  }
};

export default {
  testMockGoogleCalendar,
  testMockCalendarWithUI,
  demoMockCalendarFunctionality,
};
