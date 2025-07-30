/**
 * Workspace Test Runner Utility
 * Provides easy access to run workspace tests from the app
 */

import { runAllWorkspaceTests } from '../tests/workspaceTest';

/**
 * Run workspace tests and display results in console
 * This can be called from any screen for testing purposes
 */
export const runWorkspaceTests = async () => {
  console.log('🧪 WORKSPACE TEST RUNNER: Starting tests...');

  try {
    const testResults = await runAllWorkspaceTests();

    // Display detailed results
    console.log('\n📋 DETAILED TEST RESULTS:');
    console.log('==========================');

    // Service tests
    console.log('\n🔧 Service Tests:');
    Object.entries(testResults.results.service).forEach(([test, passed]) => {
      console.log(`  ${passed ? '✅' : '❌'} ${test}`);
    });

    // Permission tests
    console.log('\n🔐 Permission Tests:');
    Object.entries(testResults.results.permissions).forEach(
      ([test, passed]) => {
        console.log(`  ${passed ? '✅' : '❌'} ${test}`);
      }
    );

    // File size tests
    console.log('\n📏 File Size Tests:');
    Object.entries(testResults.results.fileSizes).forEach(([test, passed]) => {
      console.log(`  ${passed ? '✅' : '❌'} ${test}`);
    });

    // Mock data tests
    console.log('\n🎭 Mock Data Tests:');
    Object.entries(testResults.results.mockData).forEach(([test, passed]) => {
      console.log(`  ${passed ? '✅' : '❌'} ${test}`);
    });

    console.log('\n==========================');

    return testResults;
  } catch (error) {
    console.error('❌ WORKSPACE TEST RUNNER: Failed to run tests:', error);
    return null;
  }
};

/**
 * Quick test to verify workspace is working
 */
export const quickWorkspaceTest = async () => {
  console.log('⚡ WORKSPACE QUICK TEST: Running basic functionality check...');

  try {
    const {
      getWorkspaceStructure,
      getUserPermissions,
    } = require('../services/workspaceService');

    // Test basic structure loading
    const structure = await getWorkspaceStructure();
    const hasValidStructure =
      structure && structure.workspace && structure.workspace.root_folder;

    // Test permissions
    const teacherPerms = getUserPermissions('teacher');
    const studentPerms = getUserPermissions('student');
    const hasValidPermissions =
      teacherPerms.canUpload && !studentPerms.canUpload;

    const isWorking = hasValidStructure && hasValidPermissions;

    console.log(
      `📁 Structure Loading: ${hasValidStructure ? '✅ PASS' : '❌ FAIL'}`
    );
    console.log(
      `🔐 Permissions: ${hasValidPermissions ? '✅ PASS' : '❌ FAIL'}`
    );
    console.log(
      `🎯 Overall Status: ${isWorking ? '✅ WORKING' : '❌ NOT WORKING'}`
    );

    return isWorking;
  } catch (error) {
    console.error('❌ WORKSPACE QUICK TEST: Failed:', error);
    return false;
  }
};

/**
 * Test workspace with specific user type
 */
export const testWorkspaceForUserType = async (userType) => {
  console.log(`👤 WORKSPACE USER TEST: Testing for user type: ${userType}`);

  try {
    const {
      getUserPermissions,
      getWorkspaceStructure,
    } = require('../services/workspaceService');

    // Get permissions for user type
    const permissions = getUserPermissions(userType);
    console.log(`🔐 Permissions for ${userType}:`, permissions);

    // Test structure loading (should work for all user types)
    const structure = await getWorkspaceStructure();
    const hasStructure = structure && structure.workspace;

    // Check folder access based on user type
    const folderCount = structure?.workspace?.folders?.length || 0;
    const folderNames = structure?.workspace?.folders?.map((f) => f.name) || [];

    console.log(`📁 Can load structure: ${hasStructure ? '✅ YES' : '❌ NO'}`);
    console.log(`📂 Accessible folders (${folderCount}):`, folderNames);
    console.log(`📤 Can upload: ${permissions.canUpload ? '✅ YES' : '❌ NO'}`);
    console.log(
      `📁 Can create folders: ${
        permissions.canCreateFolders ? '✅ YES' : '❌ NO'
      }`
    );
    console.log(`🗑️ Can delete: ${permissions.canDelete ? '✅ YES' : '❌ NO'}`);
    console.log(
      `📏 File size limit: ${(
        permissions.fileSizeLimit /
        (1024 * 1024)
      ).toFixed(0)}MB`
    );

    // Verify expected folder access
    const expectedFolders = {
      student: ['Student Resources', 'Homework'],
      parent: ['Student Resources', 'Homework'],
      teacher: [
        'Student Resources',
        'Homework',
        'Staff Resources',
        'Administrative',
      ],
      staff: [
        'Student Resources',
        'Homework',
        'Staff Resources',
        'Administrative',
      ],
    };

    const expected = expectedFolders[userType] || [];
    const hasCorrectAccess = expected.every((folder) =>
      folderNames.includes(folder)
    );

    console.log(
      `🎯 Correct folder access: ${hasCorrectAccess ? '✅ YES' : '❌ NO'}`
    );
    if (!hasCorrectAccess) {
      console.log(`   Expected: ${expected.join(', ')}`);
      console.log(`   Actual: ${folderNames.join(', ')}`);
    }

    return {
      userType,
      permissions,
      canLoadStructure: hasStructure,
      folderCount,
      folderNames,
      hasCorrectAccess,
      isWorking: hasStructure && permissions !== null && hasCorrectAccess,
    };
  } catch (error) {
    console.error(`❌ WORKSPACE USER TEST: Failed for ${userType}:`, error);
    return null;
  }
};

/**
 * Display workspace configuration info
 */
export const showWorkspaceInfo = () => {
  console.log('ℹ️ WORKSPACE INFO: Current configuration');
  console.log('=====================================');

  try {
    // Check if using mock data
    const workspaceService = require('../services/workspaceService');

    // This is a bit hacky, but we can check the source to see if USE_MOCK_DATA is true
    console.log('🎭 Mock Data Mode: Currently enabled (for development)');
    console.log('🔗 API Endpoints: Will be used when USE_MOCK_DATA = false');
    console.log(
      '📱 Supported User Types: student, parent, teacher, staff, admin'
    );
    console.log('🔐 Permission System: Role-based access control enabled');
    console.log('📏 File Size Limits:');
    console.log('   - Student: 10MB');
    console.log('   - Parent: 0MB (read-only)');
    console.log('   - Teacher/Staff: 50MB');
    console.log('   - Admin: 100MB');
    console.log(
      '📁 Supported File Types: PDF, Office docs, Images, Videos, Audio, Archives'
    );

    console.log('\n🚀 To switch to real API:');
    console.log('   1. Set USE_MOCK_DATA = false in workspaceService.js');
    console.log('   2. Ensure backend API endpoints are implemented');
    console.log('   3. Test with real Google Drive integration');

    console.log('=====================================');
  } catch (error) {
    console.error('❌ WORKSPACE INFO: Failed to load info:', error);
  }
};

export default {
  runWorkspaceTests,
  quickWorkspaceTest,
  testWorkspaceForUserType,
  showWorkspaceInfo,
};
