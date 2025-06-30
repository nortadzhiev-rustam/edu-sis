/**
 * Demo Mode Integration Test
 * Tests demo mode functionality and data integrity
 */

import {
  getDemoCredentials,
  isDemoMode,
  teacherLogin,
  studentLogin,
} from '../services/authService';
import {
  getDemoTimetableData,
  getDemoBPSData,
  getDemoAttendanceData,
  getDemoGradesData,
  getDemoHomeworkData,
  getDemoNotificationData,
  isCurrentUserInDemoMode,
} from '../services/demoModeService';

// Test demo credentials
export const testDemoCredentials = () => {
  console.log('🧪 Testing Demo Credentials...');
  
  const credentials = getDemoCredentials();
  
  // Verify all user types have credentials
  const expectedTypes = ['teacher', 'student', 'parent'];
  expectedTypes.forEach(type => {
    if (!credentials[type]) {
      console.error(`❌ Missing demo credentials for ${type}`);
      return false;
    }
    
    if (!credentials[type].username || !credentials[type].password) {
      console.error(`❌ Incomplete demo credentials for ${type}`);
      return false;
    }
    
    console.log(`✅ ${type} credentials: ${credentials[type].username}/${credentials[type].password}`);
  });
  
  console.log('✅ Demo credentials test passed');
  return true;
};

// Test demo authentication
export const testDemoAuthentication = async () => {
  console.log('🧪 Testing Demo Authentication...');
  
  const credentials = getDemoCredentials();
  
  try {
    // Test teacher login
    const teacherData = await teacherLogin(
      credentials.teacher.username,
      credentials.teacher.password,
      'test_device_token'
    );
    
    if (!teacherData || !isDemoMode(teacherData)) {
      console.error('❌ Teacher demo login failed');
      return false;
    }
    console.log('✅ Teacher demo login successful');
    
    // Test student login
    const studentData = await studentLogin(
      credentials.student.username,
      credentials.student.password,
      'test_device_token'
    );
    
    if (!studentData || !isDemoMode(studentData)) {
      console.error('❌ Student demo login failed');
      return false;
    }
    console.log('✅ Student demo login successful');
    
    console.log('✅ Demo authentication test passed');
    return true;
  } catch (error) {
    console.error('❌ Demo authentication test failed:', error);
    return false;
  }
};

// Test demo data integrity
export const testDemoDataIntegrity = () => {
  console.log('🧪 Testing Demo Data Integrity...');
  
  try {
    // Test timetable data
    const teacherTimetable = getDemoTimetableData('teacher');
    const studentTimetable = getDemoTimetableData('student');
    
    if (!teacherTimetable.success || !teacherTimetable.branches) {
      console.error('❌ Teacher timetable data invalid');
      return false;
    }
    
    if (!studentTimetable.success || !studentTimetable.timetable) {
      console.error('❌ Student timetable data invalid');
      return false;
    }
    console.log('✅ Timetable data valid');
    
    // Test BPS data
    const teacherBPS = getDemoBPSData('teacher');
    const studentBPS = getDemoBPSData('student');
    
    if (!teacherBPS.success || !teacherBPS.branches) {
      console.error('❌ Teacher BPS data invalid');
      return false;
    }
    
    if (!studentBPS.success || !studentBPS.records) {
      console.error('❌ Student BPS data invalid');
      return false;
    }
    console.log('✅ BPS data valid');
    
    // Test attendance data
    const attendanceData = getDemoAttendanceData();
    if (!attendanceData.success || !attendanceData.attendance_records) {
      console.error('❌ Attendance data invalid');
      return false;
    }
    console.log('✅ Attendance data valid');
    
    // Test grades data
    const gradesData = getDemoGradesData();
    if (!gradesData.success || !gradesData.subjects) {
      console.error('❌ Grades data invalid');
      return false;
    }
    console.log('✅ Grades data valid');
    
    // Test homework data
    const homeworkData = getDemoHomeworkData();
    if (!homeworkData.success || !homeworkData.assignments) {
      console.error('❌ Homework data invalid');
      return false;
    }
    console.log('✅ Homework data valid');
    
    // Test notification data
    const notificationData = getDemoNotificationData();
    if (!notificationData.success || !notificationData.notifications) {
      console.error('❌ Notification data invalid');
      return false;
    }
    console.log('✅ Notification data valid');
    
    console.log('✅ Demo data integrity test passed');
    return true;
  } catch (error) {
    console.error('❌ Demo data integrity test failed:', error);
    return false;
  }
};

// Test demo mode detection
export const testDemoModeDetection = () => {
  console.log('🧪 Testing Demo Mode Detection...');
  
  // Test with demo user data
  const demoUser = {
    id: 'DEMO_T001',
    name: 'Demo Teacher',
    demo_mode: true,
  };
  
  if (!isDemoMode(demoUser)) {
    console.error('❌ Demo mode detection failed for demo user');
    return false;
  }
  console.log('✅ Demo mode detected correctly');
  
  // Test with regular user data
  const regularUser = {
    id: 'T001',
    name: 'Regular Teacher',
  };
  
  if (isDemoMode(regularUser)) {
    console.error('❌ Demo mode incorrectly detected for regular user');
    return false;
  }
  console.log('✅ Regular mode detected correctly');
  
  console.log('✅ Demo mode detection test passed');
  return true;
};

// Test data structure consistency
export const testDataStructureConsistency = () => {
  console.log('🧪 Testing Data Structure Consistency...');
  
  try {
    // Check that demo data structures match expected API response formats
    const teacherTimetable = getDemoTimetableData('teacher');
    
    // Verify required fields exist
    const requiredTimetableFields = ['success', 'total_branches', 'branches'];
    requiredTimetableFields.forEach(field => {
      if (!(field in teacherTimetable)) {
        console.error(`❌ Missing required field: ${field} in teacher timetable`);
        return false;
      }
    });
    
    // Verify branch structure
    if (teacherTimetable.branches.length > 0) {
      const branch = teacherTimetable.branches[0];
      const requiredBranchFields = ['branch_id', 'branch_name', 'timetable'];
      requiredBranchFields.forEach(field => {
        if (!(field in branch)) {
          console.error(`❌ Missing required field: ${field} in branch`);
          return false;
        }
      });
    }
    
    console.log('✅ Data structure consistency test passed');
    return true;
  } catch (error) {
    console.error('❌ Data structure consistency test failed:', error);
    return false;
  }
};

// Run all demo mode tests
export const runAllDemoModeTests = async () => {
  console.log('🚀 Running Demo Mode Test Suite...');
  console.log('=====================================');
  
  const tests = [
    { name: 'Demo Credentials', test: testDemoCredentials },
    { name: 'Demo Authentication', test: testDemoAuthentication },
    { name: 'Demo Data Integrity', test: testDemoDataIntegrity },
    { name: 'Demo Mode Detection', test: testDemoModeDetection },
    { name: 'Data Structure Consistency', test: testDataStructureConsistency },
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const { name, test } of tests) {
    console.log(`\n📋 Running ${name} Test...`);
    try {
      const result = await test();
      if (result) {
        passedTests++;
        console.log(`✅ ${name} Test: PASSED`);
      } else {
        console.log(`❌ ${name} Test: FAILED`);
      }
    } catch (error) {
      console.error(`❌ ${name} Test: ERROR -`, error);
    }
  }
  
  console.log('\n=====================================');
  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All demo mode tests passed successfully!');
    return true;
  } else {
    console.log('⚠️  Some demo mode tests failed. Please review the errors above.');
    return false;
  }
};

// Export individual test functions for selective testing
export default {
  testDemoCredentials,
  testDemoAuthentication,
  testDemoDataIntegrity,
  testDemoModeDetection,
  testDataStructureConsistency,
  runAllDemoModeTests,
};
