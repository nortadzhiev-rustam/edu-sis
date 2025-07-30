/**
 * Workspace Functionality Tests
 * Tests the complete workspace implementation with different user types
 */

import {
  getWorkspaceStructure,
  getFolderContents,
  uploadWorkspaceFile,
  createWorkspaceFolder,
  searchWorkspaceFiles,
  getRecentWorkspaceFiles,
  getWorkspaceStatistics,
  deleteWorkspaceItem,
  getUserPermissions,
} from '../services/workspaceService';

/**
 * Test workspace service functions
 */
export const testWorkspaceService = async () => {
  console.log('🧪 WORKSPACE TEST: Starting workspace service tests...');
  
  const results = {
    getWorkspaceStructure: false,
    getFolderContents: false,
    searchWorkspaceFiles: false,
    getRecentWorkspaceFiles: false,
    getWorkspaceStatistics: false,
    getUserPermissions: false,
  };

  try {
    // Test getWorkspaceStructure
    console.log('📁 Testing getWorkspaceStructure...');
    const structure = await getWorkspaceStructure();
    if (structure && structure.workspace && structure.workspace.root_folder) {
      results.getWorkspaceStructure = true;
      console.log('✅ getWorkspaceStructure: PASSED');
    } else {
      console.log('❌ getWorkspaceStructure: FAILED - Invalid structure');
    }

    // Test getFolderContents
    console.log('📂 Testing getFolderContents...');
    const folderContents = await getFolderContents('1DEF456_STAFF');
    if (folderContents && folderContents.folder_info) {
      results.getFolderContents = true;
      console.log('✅ getFolderContents: PASSED');
    } else {
      console.log('❌ getFolderContents: FAILED - Invalid contents');
    }

    // Test searchWorkspaceFiles
    console.log('🔍 Testing searchWorkspaceFiles...');
    const searchResults = await searchWorkspaceFiles('test');
    if (searchResults && Array.isArray(searchResults.results)) {
      results.searchWorkspaceFiles = true;
      console.log('✅ searchWorkspaceFiles: PASSED');
    } else {
      console.log('❌ searchWorkspaceFiles: FAILED - Invalid results');
    }

    // Test getRecentWorkspaceFiles
    console.log('🕒 Testing getRecentWorkspaceFiles...');
    const recentFiles = await getRecentWorkspaceFiles(10);
    if (recentFiles && Array.isArray(recentFiles.recent_files)) {
      results.getRecentWorkspaceFiles = true;
      console.log('✅ getRecentWorkspaceFiles: PASSED');
    } else {
      console.log('❌ getRecentWorkspaceFiles: FAILED - Invalid files');
    }

    // Test getWorkspaceStatistics
    console.log('📊 Testing getWorkspaceStatistics...');
    const statistics = await getWorkspaceStatistics();
    if (statistics && statistics.statistics) {
      results.getWorkspaceStatistics = true;
      console.log('✅ getWorkspaceStatistics: PASSED');
    } else {
      console.log('❌ getWorkspaceStatistics: FAILED - Invalid statistics');
    }

    // Test getUserPermissions
    console.log('🔐 Testing getUserPermissions...');
    const teacherPermissions = getUserPermissions('teacher');
    const studentPermissions = getUserPermissions('student');
    
    if (teacherPermissions.canUpload && !studentPermissions.canUpload) {
      results.getUserPermissions = true;
      console.log('✅ getUserPermissions: PASSED');
    } else {
      console.log('❌ getUserPermissions: FAILED - Invalid permissions');
    }

  } catch (error) {
    console.error('❌ WORKSPACE TEST: Service test failed:', error);
  }

  return results;
};

/**
 * Test role-based permissions
 */
export const testRoleBasedPermissions = () => {
  console.log('🧪 WORKSPACE TEST: Testing role-based permissions...');
  
  const results = {
    studentPermissions: false,
    teacherPermissions: false,
    parentPermissions: false,
    adminPermissions: false,
  };

  try {
    // Test student permissions
    const studentPerms = getUserPermissions('student');
    if (studentPerms.canRead && !studentPerms.canUpload && !studentPerms.canCreateFolders && !studentPerms.canDelete) {
      results.studentPermissions = true;
      console.log('✅ Student permissions: PASSED');
    } else {
      console.log('❌ Student permissions: FAILED');
    }

    // Test teacher permissions
    const teacherPerms = getUserPermissions('teacher');
    if (teacherPerms.canRead && teacherPerms.canUpload && teacherPerms.canCreateFolders && teacherPerms.canDelete) {
      results.teacherPermissions = true;
      console.log('✅ Teacher permissions: PASSED');
    } else {
      console.log('❌ Teacher permissions: FAILED');
    }

    // Test parent permissions
    const parentPerms = getUserPermissions('parent');
    if (parentPerms.canRead && !parentPerms.canUpload && !parentPerms.canCreateFolders && !parentPerms.canDelete) {
      results.parentPermissions = true;
      console.log('✅ Parent permissions: PASSED');
    } else {
      console.log('❌ Parent permissions: FAILED');
    }

    // Test admin permissions
    const adminPerms = getUserPermissions('admin');
    if (adminPerms.canRead && adminPerms.canUpload && adminPerms.canCreateFolders && adminPerms.canDelete) {
      results.adminPermissions = true;
      console.log('✅ Admin permissions: PASSED');
    } else {
      console.log('❌ Admin permissions: FAILED');
    }

  } catch (error) {
    console.error('❌ WORKSPACE TEST: Permission test failed:', error);
  }

  return results;
};

/**
 * Test file size limits
 */
export const testFileSizeLimits = () => {
  console.log('🧪 WORKSPACE TEST: Testing file size limits...');
  
  const results = {
    studentLimit: false,
    teacherLimit: false,
    adminLimit: false,
  };

  try {
    const studentPerms = getUserPermissions('student');
    const teacherPerms = getUserPermissions('teacher');
    const adminPerms = getUserPermissions('admin');

    // Check file size limits
    if (studentPerms.fileSizeLimit === 10 * 1024 * 1024) { // 10MB
      results.studentLimit = true;
      console.log('✅ Student file size limit: PASSED (10MB)');
    } else {
      console.log('❌ Student file size limit: FAILED');
    }

    if (teacherPerms.fileSizeLimit === 50 * 1024 * 1024) { // 50MB
      results.teacherLimit = true;
      console.log('✅ Teacher file size limit: PASSED (50MB)');
    } else {
      console.log('❌ Teacher file size limit: FAILED');
    }

    if (adminPerms.fileSizeLimit === 100 * 1024 * 1024) { // 100MB
      results.adminLimit = true;
      console.log('✅ Admin file size limit: PASSED (100MB)');
    } else {
      console.log('❌ Admin file size limit: FAILED');
    }

  } catch (error) {
    console.error('❌ WORKSPACE TEST: File size limit test failed:', error);
  }

  return results;
};

/**
 * Test mock data functionality
 */
export const testMockDataFunctionality = async () => {
  console.log('🧪 WORKSPACE TEST: Testing mock data functionality...');
  
  const results = {
    mockStructure: false,
    mockFolderContents: false,
    mockSearch: false,
    mockRecent: false,
    mockStats: false,
  };

  try {
    // Test that mock data is being returned when USE_MOCK_DATA is true
    const structure = await getWorkspaceStructure();
    if (structure && structure.workspace && structure.workspace.folders) {
      results.mockStructure = true;
      console.log('✅ Mock workspace structure: PASSED');
    }

    const folderContents = await getFolderContents('1DEF456_STAFF');
    if (folderContents && folderContents.folder_info && folderContents.folder_info.name === 'Staff Resources') {
      results.mockFolderContents = true;
      console.log('✅ Mock folder contents: PASSED');
    }

    const searchResults = await searchWorkspaceFiles('test');
    if (searchResults && searchResults.results && searchResults.results.length > 0) {
      results.mockSearch = true;
      console.log('✅ Mock search results: PASSED');
    }

    const recentFiles = await getRecentWorkspaceFiles(5);
    if (recentFiles && recentFiles.recent_files && recentFiles.recent_files.length > 0) {
      results.mockRecent = true;
      console.log('✅ Mock recent files: PASSED');
    }

    const statistics = await getWorkspaceStatistics();
    if (statistics && statistics.statistics && statistics.statistics.total_files > 0) {
      results.mockStats = true;
      console.log('✅ Mock statistics: PASSED');
    }

  } catch (error) {
    console.error('❌ WORKSPACE TEST: Mock data test failed:', error);
  }

  return results;
};

/**
 * Run all workspace tests
 */
export const runAllWorkspaceTests = async () => {
  console.log('🚀 WORKSPACE TEST: Starting comprehensive workspace tests...');
  console.log('================================================');
  
  const startTime = Date.now();
  
  const serviceResults = await testWorkspaceService();
  const permissionResults = testRoleBasedPermissions();
  const fileSizeResults = testFileSizeLimits();
  const mockDataResults = await testMockDataFunctionality();
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // Calculate overall results
  const allResults = {
    service: serviceResults,
    permissions: permissionResults,
    fileSizes: fileSizeResults,
    mockData: mockDataResults,
  };
  
  const totalTests = Object.values(allResults).reduce((total, category) => {
    return total + Object.keys(category).length;
  }, 0);
  
  const passedTests = Object.values(allResults).reduce((total, category) => {
    return total + Object.values(category).filter(result => result === true).length;
  }, 0);
  
  console.log('================================================');
  console.log(`📊 WORKSPACE TEST RESULTS:`);
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`⏱️ Duration: ${duration}ms`);
  console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! Workspace is ready for production.');
  } else {
    console.log('⚠️ Some tests failed. Please review the implementation.');
  }
  
  console.log('================================================');
  
  return {
    results: allResults,
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: totalTests - passedTests,
      successRate: (passedTests / totalTests) * 100,
      duration: duration,
    },
  };
};

// Export individual test functions for selective testing
export default {
  runAllWorkspaceTests,
  testWorkspaceService,
  testRoleBasedPermissions,
  testFileSizeLimits,
  testMockDataFunctionality,
};
