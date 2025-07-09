/**
 * Test Read-Only Google Calendar
 * Quick test to verify the read-only Google Calendar service works
 */

import { Alert } from 'react-native';

/**
 * Test the read-only Google Calendar service
 */
export const testReadOnlyGoogleCalendar = async () => {
  try {
    console.log('🧪 Testing Read-Only Google Calendar Service...');

    // Test 1: School Configuration
    console.log('📍 Testing school configuration...');
    const SchoolConfigService = (await import('../services/schoolConfigService')).default;
    
    const demoConfig = await SchoolConfigService.detectSchoolFromLogin('demo_teacher', 'teacher');
    console.log('✅ School detected:', demoConfig.name);
    console.log('📊 Google Calendar available:', demoConfig.hasGoogleWorkspace);
    console.log('📖 Read-only feature enabled:', demoConfig.features.googleCalendarReadOnly);
    
    await SchoolConfigService.saveCurrentSchoolConfig(demoConfig);

    // Test 2: Mock User Data with Branch
    const mockUserData = {
      id: 'test_teacher_001',
      username: 'demo_teacher',
      authCode: 'DEMO_AUTH_T001',
      userType: 'teacher',
      branchId: 'secondary', // Test with secondary branch
      branch_id: 'secondary',
      branchName: 'Secondary School',
      branch_name: 'Secondary School'
    };

    console.log('👤 Mock user data:', {
      userType: mockUserData.userType,
      branchId: mockUserData.branchId,
      branchName: mockUserData.branchName
    });

    // Test 3: Calendar Service Initialization
    console.log('📅 Testing calendar service initialization...');
    const CalendarService = (await import('../services/calendarService')).default;
    
    const calendarService = await CalendarService.initialize(demoConfig, mockUserData);
    console.log('✅ Calendar service initialized');
    console.log('📊 Google Calendar available:', calendarService.isGoogleCalendarAvailable());

    // Test 4: Check which service is being used
    const hasReadOnlyService = !!calendarService.readOnlyGoogleCalendarService;
    const hasInteractiveService = !!calendarService.googleCalendarService;
    
    console.log('🔍 Service type check:');
    console.log('   Read-only service:', hasReadOnlyService ? '✅ Active' : '❌ Not active');
    console.log('   Interactive service:', hasInteractiveService ? '✅ Active' : '❌ Not active');

    if (hasReadOnlyService) {
      // Test 5: Branch Information
      console.log('🏢 Testing branch information...');
      const branchInfo = calendarService.readOnlyGoogleCalendarService.getBranchInfo();
      console.log('✅ Branch info:', branchInfo);

      // Test 6: Branch Calendars
      console.log('📊 Testing branch calendars...');
      const branchCalendars = calendarService.readOnlyGoogleCalendarService.getBranchCalendars();
      console.log('✅ Branch calendars:', branchCalendars);

      // Test 7: Mock Events Generation
      console.log('📋 Testing mock events generation...');
      const events = await calendarService.getAllEvents({
        includeGoogle: true,
        includeTimetable: false,
        includeHomework: false,
        includeSchoolEvents: false,
        includeNotifications: false,
      });

      console.log(`✅ Retrieved ${events.length} read-only calendar events`);
      
      // Log sample events
      events.slice(0, 5).forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.title} (${event.calendarType}) - Branch: ${event.branchId}`);
      });

      console.log('\n🎉 All read-only Google Calendar tests passed!');
      
      return {
        success: true,
        serviceType: 'read-only',
        schoolName: demoConfig.name,
        branchInfo,
        branchCalendars,
        eventsCount: events.length,
        sampleEvents: events.slice(0, 5).map(e => ({
          title: e.title,
          type: e.calendarType,
          branch: e.branchId,
          date: new Date(e.startTime).toLocaleDateString()
        }))
      };
    } else {
      console.log('❌ Read-only service not active - interactive service is being used instead');
      return {
        success: false,
        error: 'Read-only service not active',
        serviceType: hasInteractiveService ? 'interactive' : 'none'
      };
    }

  } catch (error) {
    console.error('❌ Read-only Google Calendar test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Test read-only calendar with UI feedback
 */
export const testReadOnlyCalendarWithUI = async () => {
  try {
    Alert.alert(
      'Testing Read-Only Calendar',
      'Running read-only Google Calendar tests... Check console for details.',
      [{ text: 'OK' }]
    );

    const result = await testReadOnlyGoogleCalendar();

    if (result.success) {
      Alert.alert(
        'Read-Only Calendar Works! ✅',
        `Read-only Google Calendar is working perfectly!\n\n` +
        `School: ${result.schoolName}\n` +
        `Service: ${result.serviceType}\n` +
        `Branch: ${result.branchInfo.branchName}\n` +
        `Events: ${result.eventsCount}\n` +
        `Calendars: ${result.branchInfo.calendarsAccess.join(', ')}\n\n` +
        `Sample Events:\n` +
        result.sampleEvents.map(e => `• ${e.title} (${e.type})`).join('\n').substring(0, 150) + '...\n\n' +
        `✅ No sign-in required!\n` +
        `✅ Branch-specific events!\n` +
        `✅ Admin-managed content!`,
        [{ text: 'Excellent!' }]
      );
    } else {
      Alert.alert(
        'Read-Only Calendar Issue ⚠️',
        `Issue detected:\n\n${result.error}\n\n` +
        `Current service: ${result.serviceType}\n\n` +
        `The system may be using the interactive service instead of read-only. Check the configuration.`,
        [{ text: 'OK' }]
      );
    }

    return result;

  } catch (error) {
    Alert.alert(
      'Test Error',
      `Failed to run read-only calendar tests: ${error.message}`,
      [{ text: 'OK' }]
    );
    return { success: false, error: error.message };
  }
};

/**
 * Quick verification of read-only calendar setup
 */
export const verifyReadOnlyCalendarSetup = async () => {
  try {
    console.log('🔍 VERIFICATION: Checking read-only calendar setup...');

    // Check 1: School Config
    const SchoolConfigService = (await import('../services/schoolConfigService')).default;
    const demoConfig = await SchoolConfigService.detectSchoolFromLogin('demo_teacher', 'teacher');
    
    console.log('📊 School Config Check:');
    console.log(`   hasGoogleWorkspace: ${demoConfig.hasGoogleWorkspace}`);
    console.log(`   googleCalendar: ${demoConfig.features.googleCalendar}`);
    console.log(`   googleCalendarReadOnly: ${demoConfig.features.googleCalendarReadOnly}`);
    console.log(`   API Key: ${demoConfig.googleConfig?.apiKey ? 'Present' : 'Missing'}`);

    // Check 2: Service Priority Logic
    const shouldUseReadOnly = demoConfig.features.googleCalendarReadOnly !== false;
    console.log(`   Should use read-only: ${shouldUseReadOnly}`);

    // Check 3: Branch Calendars Config
    const hasBranchCalendars = !!demoConfig.googleConfig?.branchCalendars;
    console.log(`   Branch calendars configured: ${hasBranchCalendars}`);

    if (hasBranchCalendars) {
      const branches = Object.keys(demoConfig.googleConfig.branchCalendars);
      console.log(`   Available branches: ${branches.join(', ')}`);
    }

    const overallStatus = demoConfig.hasGoogleWorkspace && 
                         demoConfig.features.googleCalendar && 
                         shouldUseReadOnly;

    console.log(`\n🎯 VERIFICATION RESULT: ${overallStatus ? '✅ Ready for read-only calendar' : '❌ Configuration issues detected'}`);

    return {
      ready: overallStatus,
      hasGoogleWorkspace: demoConfig.hasGoogleWorkspace,
      googleCalendarEnabled: demoConfig.features.googleCalendar,
      readOnlyEnabled: demoConfig.features.googleCalendarReadOnly,
      hasApiKey: !!demoConfig.googleConfig?.apiKey,
      hasBranchCalendars,
      shouldUseReadOnly
    };

  } catch (error) {
    console.error('❌ VERIFICATION: Error checking setup:', error);
    return { ready: false, error: error.message };
  }
};

export default {
  testReadOnlyGoogleCalendar,
  testReadOnlyCalendarWithUI,
  verifyReadOnlyCalendarSetup,
};
