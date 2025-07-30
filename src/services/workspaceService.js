/**
 * Unified Workspace Service
 * Handles Google Drive workspace operations for all user types
 * Supports both real API and mock data for development
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildApiUrl, Config } from '../config/env';

// Set to false when backend API is ready
const USE_MOCK_DATA = false; // Set to false when backend API is ready

/**
 * Get user data from AsyncStorage
 */
const getUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('❌ WORKSPACE: Error getting user data:', error);
    return null;
  }
};

/**
 * Get user permissions based on user type
 */
const getUserPermissions = (userType) => {
  const permissions = {
    student: {
      canRead: true,
      canUpload: false,
      canCreateFolders: false,
      canDelete: false,
      canShare: false,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
    },
    parent: {
      canRead: true,
      canUpload: false,
      canCreateFolders: false,
      canDelete: false,
      canShare: false,
      fileSizeLimit: 0,
    },
    teacher: {
      canRead: true,
      canUpload: true,
      canCreateFolders: true,
      canDelete: true,
      canShare: true,
      fileSizeLimit: 50 * 1024 * 1024, // 50MB
    },
    staff: {
      canRead: true,
      canUpload: true,
      canCreateFolders: true,
      canDelete: true,
      canShare: true,
      fileSizeLimit: 50 * 1024 * 1024, // 50MB
    },
    head_of_section: {
      canRead: true,
      canUpload: true,
      canCreateFolders: true,
      canDelete: true,
      canShare: true,
      fileSizeLimit: 100 * 1024 * 1024, // 100MB
    },
    head_of_school: {
      canRead: true,
      canUpload: true,
      canCreateFolders: true,
      canDelete: true,
      canShare: true,
      fileSizeLimit: 100 * 1024 * 1024, // 100MB
    },
    admin: {
      canRead: true,
      canUpload: true,
      canCreateFolders: true,
      canDelete: true,
      canShare: true,
      fileSizeLimit: 100 * 1024 * 1024, // 100MB
    },
  };

  return permissions[userType] || permissions.student;
};

/**
 * Make API request with proper error handling
 */
const makeApiRequest = async (url, options = {}) => {
  try {
    console.log('🔗 WORKSPACE: API Request:', url);

    const response = await fetch(url, {
      timeout: 30000,
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ WORKSPACE: API Response received');

    return data;
  } catch (error) {
    console.error('❌ WORKSPACE: API Request failed:', error);
    throw error;
  }
};

/**
 * Get workspace structure for user's branch
 * @param {string} studentAuthCode - Optional student authCode for parent access
 */
export const getWorkspaceStructure = async (studentAuthCode = null) => {
  if (USE_MOCK_DATA) {
    return getMockWorkspaceStructure(studentAuthCode);
  }

  try {
    const userData = await getUserData();
    const authCode = studentAuthCode || userData?.authCode;

    if (!authCode) {
      throw new Error('Authentication required');
    }

    console.log(
      '🔍 WORKSPACE: Using authCode:',
      studentAuthCode ? 'student' : 'user',
      'for workspace structure'
    );

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_WORKSPACE_STRUCTURE, {
      authCode: authCode,
    });

    const response = await makeApiRequest(url);

    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.message || 'Failed to get workspace structure');
    }
  } catch (error) {
    console.error('❌ WORKSPACE: Error getting workspace structure:', error);
    console.log('📱 WORKSPACE: Falling back to mock data');
    return getMockWorkspaceStructure(studentAuthCode);
  }
};

/**
 * Get folder contents
 * @param {string} folderId - Folder ID to get contents for
 * @param {string} studentAuthCode - Optional student authCode for parent access
 */
export const getFolderContents = async (folderId, studentAuthCode = null) => {
  if (USE_MOCK_DATA) {
    return getMockFolderContents(folderId, studentAuthCode);
  }

  try {
    const userData = await getUserData();
    const authCode = studentAuthCode || userData?.authCode;

    if (!authCode) {
      throw new Error('Authentication required');
    }

    console.log(
      '🔍 WORKSPACE: Using authCode:',
      studentAuthCode ? 'student' : 'user',
      'for folder contents'
    );

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_FOLDER_CONTENTS, {
      authCode: authCode,
      folder_id: folderId,
    });

    const response = await makeApiRequest(url);

    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.message || 'Failed to get folder contents');
    }
  } catch (error) {
    console.error('❌ WORKSPACE: Error getting folder contents:', error);
    console.log('📱 WORKSPACE: Falling back to mock data');
    return getMockFolderContents(folderId, studentAuthCode);
  }
};

/**
 * Upload file to workspace
 */
export const uploadWorkspaceFile = async (
  folderId,
  fileUri,
  fileName,
  mimeType,
  description = '',
  studentAuthCode = null
) => {
  if (USE_MOCK_DATA) {
    return getMockUploadResponse(fileName);
  }

  try {
    const userData = await getUserData();
    const authCode = studentAuthCode || userData?.authCode;

    if (!authCode) {
      throw new Error('Authentication required');
    }

    console.log(
      '🔍 WORKSPACE: Uploading file with authCode:',
      studentAuthCode ? 'student' : 'user'
    );

    const formData = new FormData();
    formData.append('auth_code', authCode);
    formData.append('folder_id', folderId || ''); // Convert null to empty string
    formData.append('description', description);
    formData.append('file', {
      uri: fileUri,
      type: mimeType,
      name: fileName,
    });

    // Debug logging to see what we're sending
    console.log('📤 WORKSPACE: FormData contents:');
    console.log('  - auth_code:', authCode);
    console.log('  - folder_id:', folderId || '(root)');
    console.log('  - description:', description);
    console.log('  - file:', {
      uri: fileUri,
      type: mimeType,
      name: fileName,
    });

    // Additional FormData inspection (for debugging)
    console.log('📤 WORKSPACE: FormData entries:');
    for (let [key, value] of formData.entries()) {
      if (key === 'file') {
        console.log(
          `  - ${key}:`,
          typeof value === 'object' ? '[File Object]' : value
        );
      } else {
        console.log(`  - ${key}:`, value);
      }
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.UPLOAD_WORKSPACE_FILE);
    console.log('📤 WORKSPACE: Upload URL:', url);

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - let the browser set it with boundary
    });

    console.log('📤 WORKSPACE: Upload response status:', response.status);
    console.log('📤 WORKSPACE: Upload response headers:', response.headers);

    const data = await response.json();
    console.log('📤 WORKSPACE: Upload response data:', data);

    if (data.success) {
      console.log('✅ WORKSPACE: Upload successful:', data.data);
      return data.data;
    } else {
      console.error('❌ WORKSPACE: Upload failed:', data.message);
      throw new Error(data.message || 'Failed to upload file');
    }
  } catch (error) {
    console.error('❌ WORKSPACE: Error uploading file:', error);

    // Don't fall back to mock success on real API errors
    if (USE_MOCK_DATA) {
      console.log('📱 WORKSPACE: Using mock response for development');
      const mockResponse = getMockUploadResponse(fileName);
      return mockResponse.data;
    } else {
      // Re-throw the error for real API calls
      throw error;
    }
  }
};

/**
 * Create new folder
 */
export const createWorkspaceFolder = async (
  parentFolderId,
  folderName,
  description = '',
  studentAuthCode = null
) => {
  if (USE_MOCK_DATA) {
    return getMockCreateFolderResponse(folderName);
  }

  try {
    const userData = await getUserData();
    const authCode = studentAuthCode || userData?.authCode;

    if (!authCode) {
      throw new Error('Authentication required');
    }

    console.log(
      '🔍 WORKSPACE: Creating folder with authCode:',
      studentAuthCode ? 'student' : 'user'
    );

    const url = buildApiUrl(Config.API_ENDPOINTS.CREATE_WORKSPACE_FOLDER);

    const response = await makeApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        auth_code: authCode,
        parent_folder_id: parentFolderId,
        folder_name: folderName,
        description: description,
      }),
    });

    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.message || 'Failed to create folder');
    }
  } catch (error) {
    console.error('❌ WORKSPACE: Error creating folder:', error);
    console.log('📱 WORKSPACE: Falling back to mock response');
    return getMockCreateFolderResponse(folderName);
  }
};

/**
 * Search files in workspace
 */
export const searchWorkspaceFiles = async (query) => {
  if (USE_MOCK_DATA) {
    return getMockSearchResults(query);
  }

  try {
    const userData = await getUserData();
    if (!userData?.authCode) {
      throw new Error('Authentication required');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.SEARCH_WORKSPACE_FILES, {
      authCode: userData.authCode,
      query: query,
    });

    const response = await makeApiRequest(url);

    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.message || 'Failed to search files');
    }
  } catch (error) {
    console.error('❌ WORKSPACE: Error searching files:', error);
    console.log('📱 WORKSPACE: Falling back to mock data');
    return getMockSearchResults(query);
  }
};

/**
 * Get recent files
 */
export const getRecentWorkspaceFiles = async (limit = 20) => {
  if (USE_MOCK_DATA) {
    return getMockRecentFiles(limit);
  }

  try {
    const userData = await getUserData();
    if (!userData?.authCode) {
      throw new Error('Authentication required');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_RECENT_WORKSPACE_FILES, {
      authCode: userData.authCode,
      limit: limit,
    });

    const response = await makeApiRequest(url);

    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.message || 'Failed to get recent files');
    }
  } catch (error) {
    console.error('❌ WORKSPACE: Error getting recent files:', error);
    console.log('📱 WORKSPACE: Falling back to mock data');
    return getMockRecentFiles(limit);
  }
};

/**
 * Get workspace statistics
 */
export const getWorkspaceStatistics = async () => {
  if (USE_MOCK_DATA) {
    return getMockWorkspaceStatistics();
  }

  try {
    const userData = await getUserData();
    if (!userData?.authCode) {
      throw new Error('Authentication required');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_WORKSPACE_STATISTICS, {
      authCode: userData.authCode,
    });

    const response = await makeApiRequest(url);

    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.message || 'Failed to get workspace statistics');
    }
  } catch (error) {
    console.error('❌ WORKSPACE: Error getting workspace statistics:', error);
    console.log('📱 WORKSPACE: Falling back to mock data');
    return getMockWorkspaceStatistics();
  }
};

/**
 * Delete item from workspace
 */
export const deleteWorkspaceItem = async (
  itemId,
  isFolder = false,
  studentAuthCode = null
) => {
  if (USE_MOCK_DATA) {
    return getMockDeleteResponse(itemId);
  }

  try {
    const userData = await getUserData();
    const authCode = studentAuthCode || userData?.authCode;

    if (!authCode) {
      throw new Error('Authentication required');
    }

    console.log(
      '🔍 WORKSPACE: Deleting item with authCode:',
      studentAuthCode ? 'student' : 'user'
    );

    const url = buildApiUrl(Config.API_ENDPOINTS.DELETE_WORKSPACE_ITEM);

    const response = await makeApiRequest(url, {
      method: 'DELETE',
      body: JSON.stringify({
        auth_code: authCode,
        item_id: itemId,
        item_type: isFolder ? 'folder' : 'file',
      }),
    });

    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.message || 'Failed to delete item');
    }
  } catch (error) {
    console.error('❌ WORKSPACE: Error deleting item:', error);
    console.log('📱 WORKSPACE: Falling back to mock response');
    return getMockDeleteResponse(itemId);
  }
};

// ============================================================================
// MOCK DATA FUNCTIONS (for development and testing)
// ============================================================================

/**
 * Mock workspace structure data
 */
const getMockWorkspaceStructure = async (studentAuthCode = null) => {
  console.log('🎭 WORKSPACE: Using mock workspace structure data');
  console.log('🔍 WORKSPACE: Student authCode provided:', !!studentAuthCode);

  const userData = await getUserData();

  // Improved user type detection similar to messaging service
  let userType = 'student'; // default
  if (userData) {
    if (userData.userType) {
      userType = userData.userType;
    } else if (userData.user_type) {
      userType = userData.user_type;
    } else if (userData.is_teacher || userData.role === 'teacher') {
      userType = 'teacher';
    } else if (userData.is_parent || userData.role === 'parent') {
      userType = 'parent';
    }
  }

  const branchName = userData?.branches?.[0]?.branch_name || 'Main Campus';

  console.log('🔍 WORKSPACE: User type detected:', userType);
  console.log(
    '🔍 WORKSPACE: User data keys:',
    userData ? Object.keys(userData) : 'No user data'
  );

  // Define all possible folders with access control
  const allFolders = [
    {
      id: '1GHI789_STUDENT',
      name: 'Student Resources',
      type: 'student_resources',
      description: 'Resources available to students and parents',
      icon: 'fas fa-graduation-cap',
      color: 'info',
      web_link: 'https://drive.google.com/drive/folders/1GHI789_STUDENT',
      file_count: 15,
      total_size: '85.2 MB',
      created_at: '2025-01-11 10:00:00',
      creator_name: 'System',
      access_roles: [
        'student',
        'parent',
        'teacher',
        'staff',
        'admin',
        'head_of_section',
        'head_of_school',
      ],
    },
    {
      id: '1JKL012_HOMEWORK',
      name: 'Homework',
      type: 'homework',
      description: 'Homework assignments and submissions',
      icon: 'fas fa-clipboard-list',
      color: 'warning',
      web_link: 'https://drive.google.com/drive/folders/1JKL012_HOMEWORK',
      file_count: 42,
      total_size: '320.8 MB',
      created_at: '2025-01-11 10:00:00',
      creator_name: 'System',
      access_roles: [
        'student',
        'parent',
        'teacher',
        'staff',
        'admin',
        'head_of_section',
        'head_of_school',
      ],
    },
    {
      id: '1DEF456_STAFF',
      name: 'Staff Resources',
      type: 'staff_resources',
      description: 'Resources shared among staff members',
      icon: 'fas fa-users',
      color: 'success',
      web_link: 'https://drive.google.com/drive/folders/1DEF456_STAFF',
      file_count: 25,
      total_size: '150.5 MB',
      created_at: '2025-01-11 10:00:00',
      creator_name: 'System',
      access_roles: [
        'teacher',
        'staff',
        'admin',
        'head_of_section',
        'head_of_school',
      ],
    },
    {
      id: '1MNO345_ADMIN',
      name: 'Administrative',
      type: 'administrative',
      description: 'Administrative documents and policies',
      icon: 'fas fa-file-alt',
      color: 'danger',
      web_link: 'https://drive.google.com/drive/folders/1MNO345_ADMIN',
      file_count: 18,
      total_size: '95.3 MB',
      created_at: '2025-01-11 10:00:00',
      creator_name: 'System',
      access_roles: [
        'teacher',
        'staff',
        'admin',
        'head_of_section',
        'head_of_school',
      ],
    },
  ];

  // Filter folders based on user type
  const accessibleFolders = allFolders.filter((folder) =>
    folder.access_roles.includes(userType)
  );

  console.log(
    `📁 WORKSPACE: Showing ${accessibleFolders.length} folders for ${userType}`
  );
  console.log(
    '📁 WORKSPACE: Accessible folders:',
    accessibleFolders.map((f) => f.name)
  );

  return {
    workspace: {
      root_folder: {
        id: '1ABC123_ROOT',
        name: `SIS - ${branchName}`,
        type: 'branch_root',
        description: `Main workspace folder for ${branchName} branch`,
        icon: 'fas fa-building',
        color: 'primary',
        web_link: 'https://drive.google.com/drive/folders/1ABC123_ROOT',
        created_at: '2025-01-11 10:00:00',
        creator_name: 'System',
      },
      folders: accessibleFolders.map((folder) => {
        // Remove access_roles from the response
        const { access_roles, ...folderWithoutRoles } = folder;
        return folderWithoutRoles;
      }),
    },
    branch_id: userData?.branches?.[0]?.branch_id || 1,
    user_type: userType,
  };
};

/**
 * Mock folder contents data
 */
const getMockFolderContents = async (folderId, studentAuthCode = null) => {
  console.log('🎭 WORKSPACE: Using mock folder contents data for:', folderId);
  console.log('🔍 WORKSPACE: Student authCode provided:', !!studentAuthCode);

  // Get user data for access control
  const userData = await getUserData();
  let userType = 'student'; // default
  let currentUserName = 'Current User'; // default

  if (userData) {
    if (userData.userType) {
      userType = userData.userType;
    } else if (userData.user_type) {
      userType = userData.user_type;
    } else if (userData.is_teacher || userData.role === 'teacher') {
      userType = 'teacher';
    } else if (userData.is_parent || userData.role === 'parent') {
      userType = 'parent';
    }

    // Get current user's name for creator comparison
    currentUserName =
      userData.name ||
      userData.full_name ||
      userData.username ||
      'Current User';
  }

  console.log(
    '🔍 WORKSPACE: Folder access check - User type:',
    userType,
    'Folder ID:',
    folderId
  );

  // Define folder access control
  const folderAccessControl = {
    '1DEF456_STAFF': [
      'teacher',
      'staff',
      'admin',
      'head_of_section',
      'head_of_school',
    ],
    '1GHI789_STUDENT': [
      'student',
      'parent',
      'teacher',
      'staff',
      'admin',
      'head_of_section',
      'head_of_school',
    ],
    '1JKL012_HOMEWORK': [
      'student',
      'parent',
      'teacher',
      'staff',
      'admin',
      'head_of_section',
      'head_of_school',
    ],
    '1MNO345_ADMIN': [
      'teacher',
      'staff',
      'admin',
      'head_of_section',
      'head_of_school',
    ],
  };

  // Check if user has access to this folder
  const allowedRoles = folderAccessControl[folderId];
  if (allowedRoles && !allowedRoles.includes(userType)) {
    console.log(
      `🚫 WORKSPACE: Access denied to folder ${folderId} for user type ${userType}`
    );
    return {
      folder_info: {
        id: folderId,
        name: 'Access Denied',
        type: 'folder',
        description: 'You do not have permission to access this folder',
        path: 'Access Denied',
        icon: 'fas fa-lock',
        color: 'danger',
        web_link: '',
        created_at: new Date().toISOString(),
        creator_name: 'System',
      },
      folders: [],
      files: [],
      total_items: 0,
    };
  }

  // Different content based on folder type with access control
  const folderData = {
    '1DEF456_STAFF': {
      name: 'Staff Resources',
      user_access_level:
        userType === 'teacher' || userType === 'admin' ? 'full' : 'read',
      can_manage: userType === 'teacher' || userType === 'admin',
      can_upload: userType === 'teacher' || userType === 'admin',
      folders: [
        {
          id: '1MNO345_LESSONS',
          name: 'Lesson Plans',
          type: 'folder',
          folder_type: 'custom',
          description: 'Teacher lesson plans',
          icon: 'fas fa-folder',
          color: 'dark',
          web_link: 'https://drive.google.com/drive/folders/1MNO345_LESSONS',
          file_count: 12,
          created_at: '2025-01-11 11:00:00',
          creator_name:
            userType === 'teacher' ? currentUserName : 'John Teacher',
          user_can_create_folder:
            userType === 'teacher' || userType === 'admin',
          user_can_upload: userType === 'teacher' || userType === 'admin',
        },
      ],
      files: [
        {
          id: '1PQR678_HANDBOOK',
          name: 'Staff Handbook 2025.pdf',
          original_name: 'Staff Handbook 2025.pdf',
          type: 'file',
          file_type: 'pdf',
          mime_type: 'application/pdf',
          size: 2048576,
          formatted_size: '2.0 MB',
          description: 'Updated staff handbook for 2025',
          web_view_link:
            'https://drive.google.com/file/d/1PQR678_HANDBOOK/view',
          web_content_link: 'https://drive.google.com/uc?id=1PQR678_HANDBOOK',
          is_google_file: false,
          is_shared: true,
          created_at: '2025-01-11 12:00:00',
          uploader_name: 'Admin User',
        },
      ],
    },
    '1GHI789_STUDENT': {
      name: 'Student Resources',
      user_access_level:
        userType === 'student' || userType === 'parent' ? 'read' : 'full',
      can_manage: userType === 'teacher' || userType === 'admin',
      can_upload: userType === 'teacher' || userType === 'admin',
      folders: [
        {
          id: '1STU901_TEXTBOOKS',
          name: 'Textbooks',
          type: 'folder',
          folder_type: 'custom',
          description: 'Digital textbooks and references',
          icon: 'fas fa-folder',
          color: 'dark',
          web_link: 'https://drive.google.com/drive/folders/1STU901_TEXTBOOKS',
          file_count: 8,
          created_at: '2025-01-11 11:00:00',
          creator_name:
            userType === 'teacher' ? currentUserName : 'Library Admin',
          user_can_create_folder:
            userType === 'teacher' || userType === 'admin',
          user_can_upload: userType === 'teacher' || userType === 'admin',
        },
      ],
      files: [
        {
          id: '1VWX234_SYLLABUS',
          name: 'Academic Syllabus 2025.pdf',
          original_name: 'Academic Syllabus 2025.pdf',
          type: 'file',
          file_type: 'pdf',
          mime_type: 'application/pdf',
          size: 1024000,
          formatted_size: '1.0 MB',
          description: 'Complete academic syllabus for 2025',
          web_view_link:
            'https://drive.google.com/file/d/1VWX234_SYLLABUS/view',
          web_content_link: 'https://drive.google.com/uc?id=1VWX234_SYLLABUS',
          is_google_file: false,
          is_shared: true,
          created_at: '2025-01-11 12:00:00',
          uploader_name: 'Academic Admin',
        },
      ],
    },
    '1JKL012_HOMEWORK': {
      name: 'Homework',
      user_access_level:
        userType === 'student' || userType === 'parent' ? 'write' : 'full',
      can_manage: userType === 'teacher' || userType === 'admin',
      can_upload: true, // All users can upload homework
      folders: [
        {
          id: '1HWK123_ASSIGNMENTS',
          name: 'Class Assignments',
          type: 'folder',
          folder_type: 'custom',
          description: 'Homework assignments by class',
          icon: 'fas fa-folder',
          color: 'dark',
          web_link:
            'https://drive.google.com/drive/folders/1HWK123_ASSIGNMENTS',
          file_count: 15,
          created_at: '2025-01-11 11:00:00',
          creator_name: userType === 'teacher' ? currentUserName : 'Teacher',
          user_can_create_folder:
            userType === 'teacher' || userType === 'admin',
          user_can_upload: true, // All users can upload homework
        },
      ],
      files: [
        {
          id: '1HWK456_MATH',
          name: 'Math Assignment Week 1.pdf',
          original_name: 'Math Assignment Week 1.pdf',
          type: 'file',
          file_type: 'pdf',
          mime_type: 'application/pdf',
          size: 512000,
          formatted_size: '500 KB',
          description: 'Weekly math homework assignment',
          web_view_link: 'https://drive.google.com/file/d/1HWK456_MATH/view',
          web_content_link: 'https://drive.google.com/uc?id=1HWK456_MATH',
          is_google_file: false,
          is_shared: true,
          created_at: '2025-01-11 12:00:00',
          uploader_name: 'Math Teacher',
        },
      ],
    },
  };

  const defaultData = {
    name: 'Workspace Folder',
    folders: [],
    files: [],
  };

  const content = folderData[folderId] || defaultData;

  return {
    folder_info: {
      id: folderId,
      name: content.name,
      type: 'folder',
      description: '',
      path: `SIS - Main Campus / ${content.name}`,
      icon: 'fas fa-folder',
      color: 'dark',
      web_link: `https://drive.google.com/drive/folders/${folderId}`,
      created_at: '2025-01-11 10:00:00',
      creator_name: 'System',
      user_access_level: content.user_access_level || 'read',
      can_manage: content.can_manage || false,
      can_upload: content.can_upload || false,
    },
    folders: content.folders,
    files: content.files,
    total_items: content.folders.length + content.files.length,
  };
};

/**
 * Mock upload response
 */
const getMockUploadResponse = (fileName) => {
  console.log('🎭 WORKSPACE: Using mock upload response for:', fileName);

  // Simulate some error conditions for testing
  if (fileName.toLowerCase().includes('error')) {
    throw new Error('File upload failed due to server error');
  }

  if (fileName.toLowerCase().includes('large')) {
    throw new Error('File size exceeds maximum allowed limit');
  }

  if (fileName.toLowerCase().includes('forbidden')) {
    throw new Error('File type not allowed');
  }

  // Return successful response with proper structure
  return {
    success: true,
    data: {
      message: 'File uploaded successfully',
      file: {
        id: `MOCK_${Date.now()}`,
        name: fileName,
        size: Math.floor(Math.random() * 5000000) + 100000, // Random size between 100KB-5MB
        mime_type: 'application/octet-stream',
        web_view_link: `https://drive.google.com/file/d/MOCK_${Date.now()}/view`,
        web_content_link: `https://drive.google.com/uc?id=MOCK_${Date.now()}`,
        created_time: new Date().toISOString(),
      },
    },
  };
};

/**
 * Mock create folder response
 */
const getMockCreateFolderResponse = (folderName) => {
  console.log(
    '🎭 WORKSPACE: Using mock create folder response for:',
    folderName
  );

  // Simulate some error conditions for testing
  if (folderName.toLowerCase().includes('error')) {
    throw new Error('Folder name contains invalid characters');
  }

  if (folderName.toLowerCase().includes('duplicate')) {
    throw new Error('A folder with this name already exists');
  }

  if (folderName.toLowerCase().includes('permission')) {
    throw new Error('You do not have permission to create folders here');
  }

  return {
    message: 'Folder created successfully',
    folder: {
      id: `MOCK_FOLDER_${Date.now()}`,
      name: folderName,
      web_view_link: `https://drive.google.com/drive/folders/MOCK_FOLDER_${Date.now()}`,
      created_time: new Date().toISOString(),
    },
  };
};

/**
 * Mock search results
 */
const getMockSearchResults = (query) => {
  console.log('🎭 WORKSPACE: Using mock search results for:', query);

  const mockResults = [
    {
      id: 'SEARCH_1',
      name: `${query} - Document 1.pdf`,
      original_name: `${query} - Document 1.pdf`,
      type: 'file',
      file_type: 'pdf',
      mime_type: 'application/pdf',
      size: 1024000,
      formatted_size: '1.0 MB',
      description: `Search result containing ${query}`,
      web_view_link: 'https://drive.google.com/file/d/SEARCH_1/view',
      web_content_link: 'https://drive.google.com/uc?id=SEARCH_1',
      is_google_file: false,
      folder_name: 'Staff Resources',
      folder_path: 'SIS - Main Campus / Staff Resources',
      created_at: '2025-01-11 15:00:00',
      uploader_name: 'Mock User',
    },
  ];

  return {
    query: query,
    results: mockResults,
    total_results: mockResults.length,
  };
};

/**
 * Mock recent files
 */
const getMockRecentFiles = (limit) => {
  console.log('🎭 WORKSPACE: Using mock recent files data, limit:', limit);

  const mockFiles = [
    {
      id: 'RECENT_1',
      name: 'Recent Document.pdf',
      original_name: 'Recent Document.pdf',
      type: 'file',
      file_type: 'pdf',
      mime_type: 'application/pdf',
      size: 1024000,
      formatted_size: '1.0 MB',
      description: 'Recently uploaded document',
      web_view_link: 'https://drive.google.com/file/d/RECENT_1/view',
      web_content_link: 'https://drive.google.com/uc?id=RECENT_1',
      is_google_file: false,
      is_shared: true,
      folder_name: 'Staff Resources',
      folder_id: '1DEF456_STAFF',
      created_at: '2025-01-11 16:00:00',
      uploader_name: 'Mock User',
      days_ago: 0,
    },
  ];

  return {
    recent_files: mockFiles.slice(0, limit),
    total_files: mockFiles.length,
    limit: limit,
  };
};

/**
 * Mock workspace statistics
 */
const getMockWorkspaceStatistics = () => {
  console.log('🎭 WORKSPACE: Using mock workspace statistics data');

  return {
    statistics: {
      total_files: 150,
      total_folders: 25,
      total_size: 524288000,
      formatted_total_size: '500.0 MB',
      shared_files: 75,
      recent_uploads: 12,
      my_uploads: 8,
      file_types: {
        PDF: 45,
        Images: 30,
        'Google Docs': 25,
        Office: 20,
        Videos: 15,
        Audio: 10,
        Other: 5,
      },
    },
    branch_id: 1,
    user_type: 'teacher',
  };
};

/**
 * Mock delete response
 */
const getMockDeleteResponse = (itemId) => {
  console.log('🎭 WORKSPACE: Using mock delete response for:', itemId);

  // Simulate some error conditions for testing
  if (itemId && itemId.includes('PROTECTED')) {
    throw new Error('Cannot delete protected system files');
  }

  if (itemId && itemId.includes('PERMISSION')) {
    throw new Error('You do not have permission to delete this item');
  }

  if (itemId && itemId.includes('NOTFOUND')) {
    throw new Error('Item not found or has already been deleted');
  }

  return {
    message: 'Item deleted successfully',
  };
};

// Export additional utility functions
export { getUserPermissions };
