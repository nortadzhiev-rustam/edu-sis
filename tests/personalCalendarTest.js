/**
 * Personal Calendar API Integration Test
 * Tests the new personal calendar functionality
 */

import CalendarService from '../src/services/calendarService';
import { Config } from '../src/config/env';
import { getDemoPersonalCalendarData } from '../src/services/demoModeService';

// Test configuration
const TEST_CONFIG = {
  ENABLE_DEMO_MODE: true,
  TEST_USER_TYPES: ['student', 'teacher'],
  TEST_DATE_RANGES: [
    { name: 'default', startDate: null, endDate: null },
    { name: 'week', startDate: '2025-01-10', endDate: '2025-01-17' },
    { name: 'month', startDate: '2025-01-01', endDate: '2025-01-31' },
  ],
};

/**
 * Test personal calendar functionality
 */
async function testPersonalCalendar() {
  console.log('🧪 Starting Personal Calendar API Tests...\n');

  // Enable demo mode for testing
  const originalDemoMode = Config.DEV.USE_DUMMY_DATA;
  Config.DEV.USE_DUMMY_DATA = TEST_CONFIG.ENABLE_DEMO_MODE;

  try {
    // Test for each user type
    for (const userType of TEST_CONFIG.TEST_USER_TYPES) {
      console.log(`\n📋 Testing ${userType.toUpperCase()} view:`);
      await testUserTypeScenarios(userType);
    }

    console.log('\n✅ All Personal Calendar tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Personal Calendar tests failed:', error);
    throw error;
  } finally {
    // Restore original demo mode setting
    Config.DEV.USE_DUMMY_DATA = originalDemoMode;
  }
}

/**
 * Test scenarios for a specific user type
 */
async function testUserTypeScenarios(userType) {
  const mockUserData = {
    authCode: `demo_${userType}_auth`,
    userType: userType,
    id: userType === 'student' ? 123 : 456,
    name: `Demo ${userType}`,
    branchId: 1,
  };

  const mockSchoolConfig = {
    schoolId: 'demo_school',
    name: 'Demo School',
    hasGoogleWorkspace: false,
  };

  // Initialize calendar service
  const calendarService = new CalendarService(mockUserData, mockSchoolConfig);
  await calendarService.initialize();

  // Test 1: Demo data generation
  console.log('  🔍 Testing demo data generation...');
  const demoData = getDemoPersonalCalendarData(userType);
  
  if (!demoData.success) {
    throw new Error(`Demo data generation failed for ${userType}`);
  }
  
  if (!Array.isArray(demoData.personal_events)) {
    throw new Error(`Demo data should contain personal_events array for ${userType}`);
  }
  
  console.log(`    ✓ Generated ${demoData.personal_events.length} demo events`);

  // Test 2: Personal events fetching
  console.log('  🔍 Testing personal events fetching...');
  
  for (const dateRange of TEST_CONFIG.TEST_DATE_RANGES) {
    console.log(`    📅 Testing ${dateRange.name} date range...`);
    
    const personalEvents = await calendarService.getPersonalEvents(
      dateRange.startDate,
      dateRange.endDate
    );
    
    if (!Array.isArray(personalEvents)) {
      throw new Error(`Personal events should return an array for ${userType}`);
    }
    
    console.log(`      ✓ Fetched ${personalEvents.length} personal events`);
    
    // Validate event structure
    if (personalEvents.length > 0) {
      validateEventStructure(personalEvents[0], userType);
    }
  }

  // Test 3: Event transformation
  console.log('  🔍 Testing event transformation...');
  const rawEvents = demoData.personal_events;
  const transformedEvents = calendarService.transformPersonalEvents(rawEvents);
  
  if (transformedEvents.length !== rawEvents.length) {
    throw new Error(`Transformation should preserve event count for ${userType}`);
  }
  
  // Validate transformed event structure
  if (transformedEvents.length > 0) {
    validateTransformedEvent(transformedEvents[0], userType);
  }
  
  console.log(`    ✓ Successfully transformed ${transformedEvents.length} events`);

  // Test 4: Integration with main calendar
  console.log('  🔍 Testing integration with main calendar...');
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + 30);
  
  const allEvents = await calendarService.getAllEvents(startDate, endDate);
  
  if (!Array.isArray(allEvents)) {
    throw new Error(`getAllEvents should return an array for ${userType}`);
  }
  
  // Check if personal events are included
  const personalEventsInAll = allEvents.filter(event => 
    ['homework', 'exam', 'birthday'].includes(event.type)
  );
  
  console.log(`    ✓ Found ${personalEventsInAll.length} personal events in main calendar`);

  // Test 5: Event categorization
  console.log('  🔍 Testing event categorization...');
  testEventCategorization(transformedEvents, userType);
  
  console.log(`  ✅ All tests passed for ${userType}`);
}

/**
 * Validate the structure of a raw event
 */
function validateEventStructure(event, userType) {
  const requiredFields = [
    'id', 'title', 'description', 'start_date', 'end_date',
    'category', 'priority', 'status'
  ];
  
  for (const field of requiredFields) {
    if (!(field in event)) {
      throw new Error(`Event missing required field '${field}' for ${userType}`);
    }
  }
  
  // Validate category values
  const validCategories = ['homework', 'exam', 'birthday'];
  if (!validCategories.includes(event.category)) {
    throw new Error(`Invalid event category '${event.category}' for ${userType}`);
  }
  
  // Validate priority values
  const validPriorities = ['high', 'medium', 'low'];
  if (!validPriorities.includes(event.priority)) {
    throw new Error(`Invalid event priority '${event.priority}' for ${userType}`);
  }
  
  console.log(`      ✓ Event structure valid for ${userType}`);
}

/**
 * Validate the structure of a transformed event
 */
function validateTransformedEvent(event, userType) {
  const requiredFields = [
    'id', 'title', 'description', 'startTime', 'endTime',
    'type', 'source', 'color', 'priority', 'status'
  ];
  
  for (const field of requiredFields) {
    if (!(field in event)) {
      throw new Error(`Transformed event missing required field '${field}' for ${userType}`);
    }
  }
  
  // Validate ISO date format
  if (!event.startTime.includes('T') || !event.endTime.includes('T')) {
    throw new Error(`Event times should be in ISO format for ${userType}`);
  }
  
  // Validate color format
  if (!event.color.startsWith('#') || event.color.length !== 7) {
    throw new Error(`Event color should be hex format for ${userType}`);
  }
  
  console.log(`      ✓ Transformed event structure valid for ${userType}`);
}

/**
 * Test event categorization based on user type
 */
function testEventCategorization(events, userType) {
  const categories = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {});
  
  console.log(`    📊 Event categories for ${userType}:`, categories);
  
  if (userType === 'student') {
    // Students should see homework and exam events
    if (!categories.homework && !categories.exam) {
      throw new Error(`Students should see homework or exam events`);
    }
  } else if (userType === 'teacher') {
    // Teachers should see homework, exam, and birthday events
    if (!categories.homework && !categories.exam && !categories.birthday) {
      throw new Error(`Teachers should see homework, exam, or birthday events`);
    }
  }
  
  console.log(`    ✓ Event categorization correct for ${userType}`);
}

/**
 * Run performance test
 */
async function testPerformance() {
  console.log('\n⚡ Running performance tests...');
  
  const mockUserData = {
    authCode: 'demo_student_auth',
    userType: 'student',
    id: 123,
    name: 'Demo Student',
    branchId: 1,
  };

  const mockSchoolConfig = {
    schoolId: 'demo_school',
    name: 'Demo School',
    hasGoogleWorkspace: false,
  };

  Config.DEV.USE_DUMMY_DATA = true;
  
  const calendarService = new CalendarService(mockUserData, mockSchoolConfig);
  await calendarService.initialize();
  
  const iterations = 10;
  const startTime = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    await calendarService.getPersonalEvents();
  }
  
  const endTime = Date.now();
  const avgTime = (endTime - startTime) / iterations;
  
  console.log(`  ✓ Average response time: ${avgTime.toFixed(2)}ms over ${iterations} iterations`);
  
  if (avgTime > 1000) {
    console.warn(`  ⚠️  Response time is high (${avgTime.toFixed(2)}ms)`);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  try {
    await testPersonalCalendar();
    await testPerformance();
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('  ✅ Personal calendar API integration');
    console.log('  ✅ Demo data generation');
    console.log('  ✅ Event transformation');
    console.log('  ✅ User type scenarios');
    console.log('  ✅ Event categorization');
    console.log('  ✅ Performance testing');
    
  } catch (error) {
    console.error('\n💥 Tests failed:', error.message);
    process.exit(1);
  }
}

// Export for use in other test files
export {
  testPersonalCalendar,
  testPerformance,
  validateEventStructure,
  validateTransformedEvent,
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}
