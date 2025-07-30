/**
 * Homework Service
 * Handles all homework-related API calls including file uploads, folder creation, and submissions
 */

import { Config, buildApiUrl } from '../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Helper function to get auth code from storage
 */
const getAuthCode = async () => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      const parsed = JSON.parse(userData);
      return parsed.authCode;
    }
    return null;
  } catch (error) {
    console.error('Error getting auth code:', error);
    return null;
  }
};

/**
 * Helper function to make API requests with proper error handling
 */
const makeHomeworkApiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      timeout: Config.NETWORK.TIMEOUT,
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Homework API request failed:', error);
    throw error;
  }
};

/**
 * Get workspace structure to find folder IDs
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object>} - Response data with workspace structure
 */
export const getWorkspaceStructure = async (authCode = null) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) {
      throw new Error('No authentication code found');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_WORKSPACE_STRUCTURE, {
      authCode: auth,
    });

    console.log('🔍 Getting workspace structure...');

    return await makeHomeworkApiRequest(url, {
      method: 'GET',
    });
  } catch (error) {
    console.error('Error getting workspace structure:', error);
    throw error;
  }
};

/**
 * Get folder contents to check for existing folders
 * @param {string} parentFolderId - Parent folder ID to search in (required for folder-contents, null for root structure)
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object>} - Response data with folder contents
 */
export const getFolderContents = async (
  parentFolderId = null,
  authCode = null
) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) {
      throw new Error('No authentication code found');
    }

    console.log('📁 Getting folder contents for:', parentFolderId || 'root');

    // If no parent folder ID, get root workspace structure
    if (
      !parentFolderId ||
      parentFolderId === null ||
      parentFolderId === undefined
    ) {
      console.log(
        '📁 No folder_id provided, getting workspace structure (root)'
      );

      const url = buildApiUrl(Config.API_ENDPOINTS.GET_WORKSPACE_STRUCTURE, {
        authCode: auth,
      });

      console.log('📁 Final URL for workspace structure:', url);

      return await makeHomeworkApiRequest(url, {
        method: 'GET',
      });
    }

    // If parent folder ID provided, get specific folder contents
    console.log('📁 Getting specific folder contents for:', parentFolderId);

    const queryParams = {
      authCode: auth,
      folder_id: parentFolderId,
    };

    console.log('📁 Query parameters for getFolderContents:', queryParams);

    const url = buildApiUrl(
      Config.API_ENDPOINTS.GET_FOLDER_CONTENTS,
      queryParams
    );

    console.log('📁 Final URL for getFolderContents:', url);

    return await makeHomeworkApiRequest(url, {
      method: 'GET',
    });
  } catch (error) {
    console.error('Error getting folder contents:', error);
    throw error;
  }
};

/**
 * Find Homework folder ID from workspace structure
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<string|null>} - Homework folder ID if found, null if not found
 */
export const findHomeworkFolderId = async (authCode = null) => {
  try {
    console.log('🔍 Finding Homework folder ID from workspace structure...');

    const structureResponse = await getWorkspaceStructure(authCode);

    console.log(
      '📁 Full workspace structure response:',
      JSON.stringify(structureResponse, null, 2)
    );

    if (structureResponse.success && structureResponse.data) {
      console.log(
        '📁 Workspace data structure:',
        JSON.stringify(structureResponse.data, null, 2)
      );

      // Check different possible response structures
      const folders =
        structureResponse.data?.workspace?.folders ||
        structureResponse.data?.folders ||
        structureResponse.data;

      console.log('📁 Available folders:', JSON.stringify(folders, null, 2));

      if (Array.isArray(folders)) {
        // Look for the Homework folder in the workspace structure
        const homeworkFolder = folders.find(
          (folder) =>
            folder.name === 'Homework' ||
            folder.type === 'homework' ||
            folder.name?.toLowerCase().includes('homework')
        );

        console.log(
          '📁 Found homework folder candidate:',
          JSON.stringify(homeworkFolder, null, 2)
        );

        if (homeworkFolder?.id) {
          console.log('📁 Found Homework folder ID:', homeworkFolder.id);
          return homeworkFolder.id;
        }
      }
    }

    console.log('📁 No Homework folder found in workspace structure');
    return null;
  } catch (error) {
    console.error('Error finding Homework folder ID:', error);
    return null;
  }
};

/**
 * Check if a folder exists in the Homework folder
 * @param {string} folderName - Name of the folder to search for
 * @param {string} homeworkFolderId - ID of the Homework parent folder (optional, will be auto-detected if not provided)
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object|null>} - Folder object if found, null if not found
 */
export const checkHomeworkFolderExists = async (
  folderName,
  homeworkFolderId = null,
  authCode = null
) => {
  try {
    console.log('🔍 Checking if homework folder exists:', folderName);

    // If no homework folder ID provided, try to find it
    let targetFolderId = homeworkFolderId;
    console.log('📁 Initial homeworkFolderId parameter:', homeworkFolderId);

    if (!targetFolderId) {
      targetFolderId = await findHomeworkFolderId(authCode);
      console.log(
        '📁 Found targetFolderId from findHomeworkFolderId:',
        targetFolderId
      );

      if (!targetFolderId) {
        console.log(
          '📁 Could not find Homework folder ID, checking root folder'
        );
        // Fall back to checking root folder
        targetFolderId = null;
      }
    }

    console.log('📁 Final targetFolderId to use:', targetFolderId);

    // Get contents of the Homework folder (or root if no specific folder ID)
    const contentsResponse = await getFolderContents(targetFolderId, authCode);

    console.log(
      '📁 Folder contents response:',
      JSON.stringify(contentsResponse, null, 2)
    );

    if (contentsResponse.success && contentsResponse.data) {
      // The response might be structured differently, check both data and data.folders
      const items = contentsResponse.data.folders || contentsResponse.data;

      if (Array.isArray(items)) {
        // Look for a folder with the exact name
        const existingFolder = items.find(
          (item) => item.type === 'folder' && item.name === folderName
        );

        if (existingFolder) {
          console.log(
            '📁 Found existing homework folder:',
            existingFolder.google_drive_folder_id || existingFolder.id
          );
          return existingFolder;
        }
      }
    }

    console.log('📁 No existing homework folder found');
    return null;
  } catch (error) {
    console.error('Error checking if homework folder exists:', error);
    // Return null instead of throwing to allow graceful fallback to creation
    return null;
  }
};

/**
 * Create a new homework folder (Teachers)
 * @param {string} folderName - Name for the homework folder
 * @param {string} description - Folder description (optional)
 * @param {string} assignmentType - "class" or "individual"
 * @param {Array} assignedClasses - Array of class IDs (required if type=class)
 * @param {Array} assignedStudents - Array of student IDs (required if type=individual)
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object>} - Response data
 */
export const createHomeworkFolder = async (
  folderName,
  description = '',
  assignmentType,
  assignedClasses = [],
  assignedStudents = [],
  authCode = null
) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) {
      throw new Error('No authentication code found');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.CREATE_HOMEWORK_FOLDER);

    const requestBody = {
      auth_code: auth,
      folder_name: folderName,
      description,
      assignment_type: assignmentType,
    };

    if (assignmentType === 'class') {
      requestBody.assigned_classes = assignedClasses;
    } else if (assignmentType === 'individual') {
      requestBody.assigned_students = assignedStudents;
    }

    return await makeHomeworkApiRequest(url, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  } catch (error) {
    console.error('Error creating homework folder:', error);
    throw error;
  }
};

/**
 * Get or create homework folder (check first, create if not found)
 * @param {string} folderName - Name for the homework folder
 * @param {string} description - Folder description (optional)
 * @param {string} assignmentType - "class" or "individual"
 * @param {Array} assignedClasses - Array of class IDs (required if type=class)
 * @param {Array} assignedStudents - Array of student IDs (required if type=individual)
 * @param {string} homeworkParentFolderId - ID of the Homework parent folder (optional)
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object>} - Response data with folder info
 */
export const getOrCreateHomeworkFolder = async (
  folderName,
  assignmentType,
  description = '',
  assignedClasses = [],
  assignedStudents = [],
  homeworkParentFolderId = null,
  authCode = null
) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) {
      throw new Error('No authentication code found');
    }

    console.log('📁 Checking for existing homework folder:', folderName);

    // Step 1: Check if folder already exists in the Homework folder
    const existingFolder = await checkHomeworkFolderExists(
      folderName,
      homeworkParentFolderId,
      auth
    );

    if (existingFolder) {
      const folderId =
        existingFolder.google_drive_folder_id || existingFolder.id;
      if (folderId) {
        console.log('📁 Using existing homework folder');
        return {
          success: true,
          data: {
            google_drive_folder_id: folderId,
            folder_name: existingFolder.name,
            existing_folder: true,
          },
          message: 'Using existing homework folder',
        };
      }
    }

    console.log('📁 No existing folder found, creating new one...');

    // Step 2: Create new folder if not found
    const createResponse = await createHomeworkFolder(
      folderName,
      description,
      assignmentType,
      assignedClasses,
      assignedStudents,
      auth
    );

    if (createResponse.success) {
      console.log('📁 Successfully created new homework folder');
      return {
        ...createResponse,
        data: {
          ...createResponse.data,
          existing_folder: false,
        },
      };
    }

    return createResponse;
  } catch (error) {
    console.error('Error getting or creating homework folder:', error);
    throw error;
  }
};

/**
 * Upload file to homework folder (Teachers)
 * @param {string} homeworkFolderId - Google Drive folder ID
 * @param {Object} file - File object with uri, type, name
 * @param {string} description - File description (optional)
 * @param {string} homeworkId - Homework assignment ID (optional, for context)
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object>} - Response data
 */
export const uploadHomeworkFile = async (
  homeworkFolderId,
  file,
  description = '',
  homeworkId = null,
  authCode = null
) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) {
      throw new Error('No authentication code found');
    }

    const formData = new FormData();
    formData.append('homework_folder_id', homeworkFolderId);
    formData.append('description', description);

    // Add homework_id if provided for backend context
    if (homeworkId) {
      formData.append('homework_id', homeworkId);
    }

    formData.append('file', {
      uri: file.uri,
      type: file.type || file.mimeType || 'application/octet-stream',
      name: file.name || 'homework_file',
    });

    // Try passing auth_code as query parameter instead of form data
    const url = buildApiUrl(Config.API_ENDPOINTS.UPLOAD_HOMEWORK_FOLDER_FILE, {
      auth_code: auth,
    });

    console.log('📤 Uploading homework file to:', url);
    console.log('📤 Using homework_folder_id:', homeworkFolderId);
    console.log('📤 Using homework_id:', homeworkId);
    console.log('📤 Auth passed as query parameter:', auth);
    console.log('📤 FormData contents:', {
      homework_folder_id: homeworkFolderId,
      homework_id: homeworkId,
      description: description,
      file: {
        uri: file.uri,
        type: file.type || file.mimeType || 'application/octet-stream',
        name: file.name || 'homework_file',
      },
    });

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData - let fetch set it with boundary
      },
    });

    console.log('📤 Upload response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('📤 Upload error response:', errorText);

      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(
          `HTTP ${response.status}: ${
            errorJson.message || errorJson.error || 'Upload failed'
          }`
        );
      } catch (parseError) {
        throw new Error(
          `HTTP ${response.status}: ${errorText || 'Upload failed'}`
        );
      }
    }

    const result = await response.json();
    console.log('📤 Upload success:', result);
    return result;
  } catch (error) {
    console.error('Error uploading homework file:', error);
    throw error;
  }
};

/**
 * Get teacher's homework assignments (for homework screen)
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object>} - Response data
 */
export const getTeacherHomeworkList = async (authCode = null) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) {
      throw new Error('No authentication code found');
    }

    // Use the existing teacher homework endpoint that returns homework assignments
    const url = buildApiUrl('/teacher/homework/list', {
      auth_code: auth,
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Return the data as-is since it should have the correct structure
    return data;
  } catch (error) {
    console.error('Error getting teacher homework list:', error);
    throw error;
  }
};

/**
 * Get teacher's homework folders (for materials/resources screen)
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object>} - Response data
 */
export const getTeacherHomeworkFolders = async (authCode = null) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) {
      throw new Error('No authentication code found');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_TEACHER_HOMEWORK_FOLDERS, {
      auth_code: auth,
    });

    return await makeHomeworkApiRequest(url, {
      method: 'GET',
    });
  } catch (error) {
    console.error('Error getting teacher homework folders:', error);
    throw error;
  }
};

/**
 * Get student's homework assignments (for assignments screen)
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object>} - Response data
 */
export const getStudentHomeworkList = async (authCode = null) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) {
      throw new Error('No authentication code found');
    }

    // Use the existing student homework endpoint
    const url = buildApiUrl(Config.API_ENDPOINTS.GET_STUDENT_HOMEWORK, {
      authCode: auth,
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // The API returns data in this format:
    // { success: true, data: [...assignments], statistics: {...} }
    // Return the data as-is since it already has the correct structure
    return data;
  } catch (error) {
    console.error('Error getting student homework list:', error);
    throw error;
  }
};

/**
 * Get files within a homework folder
 * @param {string} folderId - Google Drive folder ID
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object>} - Response data
 */
export const getHomeworkFolderFiles = async (folderId, authCode = null) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) {
      throw new Error('No authentication code found');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_HOMEWORK_FOLDER_FILES, {
      auth_code: auth,
      folder_id: folderId,
    });

    return await makeHomeworkApiRequest(url, {
      method: 'GET',
    });
  } catch (error) {
    console.error('Error getting homework folder files:', error);
    throw error;
  }
};

/**
 * Submit homework file (Students) - Upload file first, then submit with file link
 * Handles cases where either file OR text is provided (or both)
 * @param {string} homeworkId - Homework assignment ID (for file upload)
 * @param {string} detailId - Homework detail/submission ID (for text submission)
 * @param {Object} file - File object with uri, type, name
 * @param {string} submissionNote - Student's submission note (optional)
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object>} - Response data
 */
export const submitHomework = async (
  homeworkId,
  detailId,
  file,
  submissionNote = '',
  authCode = null
) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) {
      throw new Error('No authentication code found');
    }

    // Check if at least one of file or submissionNote is provided
    if (!file && !submissionNote.trim()) {
      throw new Error(
        'Please provide either a written response or attach a file'
      );
    }

    let fileLink = null;
    let fileUploadFailed = false;

    // Step 1: Upload file first if provided
    if (file) {
      console.log('� Step 1: Uploading homework file...');
      const fileUploadResponse = await submitHomeworkFile(
        homeworkId,
        file,
        submissionNote,
        auth
      );

      if (!fileUploadResponse.success) {
        fileUploadFailed = true;
        console.warn('📤 File upload failed:', fileUploadResponse.message);
      } else {
        // Extract file link from upload response
        fileLink =
          fileUploadResponse.data?.web_view_link ||
          fileUploadResponse.data?.file_url ||
          fileUploadResponse.data?.file_link ||
          fileUploadResponse.data?.url ||
          fileUploadResponse.web_view_link;
        console.log('📤 File uploaded successfully, file link:', fileLink);
      }
    }

    // Step 2: Submit homework text/notes with file link
    console.log('� Step 2: Submitting homework text with file link...');
    const textSubmissionResponse = await submitHomeworkTextWithFile(
      detailId, // Use detailId for text submission
      submissionNote,
      fileLink,
      auth
    );

    if (!textSubmissionResponse.success) {
      throw new Error(
        textSubmissionResponse.message || 'Text submission failed'
      );
    }

    // Determine success message based on what was submitted
    let successMessage = 'Homework submitted successfully';
    if (fileLink && submissionNote.trim()) {
      successMessage += ' with text and file';
    } else if (fileLink) {
      successMessage += ' with file only';
    } else if (submissionNote.trim()) {
      successMessage += ' with text only';
      if (fileUploadFailed) {
        successMessage += ' (file upload failed, but text was submitted)';
      }
    }

    console.log('📝', successMessage);

    // Return response with additional info about file upload status
    return {
      ...textSubmissionResponse,
      fileUploadFailed,
      hasFile: !!fileLink,
      hasText: !!submissionNote.trim(),
      message: successMessage,
    };
  } catch (error) {
    console.error('Error submitting homework:', error);
    throw error;
  }
};

/**
 * Submit homework text/notes only (Students)
 * @param {string} homeworkId - Homework assignment ID
 * @param {string} submissionText - Student's submission text/notes
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object>} - Response data
 */
export const submitHomeworkText = async (
  homeworkId,
  submissionText = '',
  authCode = null
) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) {
      throw new Error('No authentication code found');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.SUBMIT_HOMEWORK);

    console.log('📝 Submitting homework text to:', url);
    console.log('📝 Submission data:', {
      detail_id: homeworkId,
      reply_data: submissionText,
    });

    return await makeHomeworkApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        detail_id: homeworkId,
        reply_data: submissionText,
        auth_code: auth,
      }),
    });
  } catch (error) {
    console.error('Error submitting homework text:', error);
    throw error;
  }
};

/**
 * Submit homework text/notes with file link (Students)
 * @param {string} detailId - Homework detail/submission ID
 * @param {string} submissionText - Student's submission text/notes
 * @param {string} fileLink - File link from upload response
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object>} - Response data
 */
export const submitHomeworkTextWithFile = async (
  detailId,
  submissionText = '',
  fileLink = null,
  authCode = null
) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) {
      throw new Error('No authentication code found');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.SUBMIT_HOMEWORK);

    const requestBody = {
      detail_id: detailId,
      reply_data: submissionText,
      auth_code: auth,
    };

    // Add file link if provided
    if (fileLink) {
      requestBody.reply_file = fileLink;
    }

    console.log('📝 Submitting homework text with file to:', url);
    console.log('📝 Submission data:', {
      detail_id: detailId,
      reply_data: submissionText,
      reply_file: fileLink,
    });

    return await makeHomeworkApiRequest(url, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  } catch (error) {
    console.error('Error submitting homework text with file:', error);
    throw error;
  }
};

/**
 * Submit homework file only (Students)
 * @param {string} homeworkId - Homework assignment ID
 * @param {Object} file - File object with uri, type, name
 * @param {string} submissionNote - Student's submission note (optional)
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object>} - Response data
 */
export const submitHomeworkFile = async (
  homeworkId,
  file,
  submissionNote = '',
  authCode = null
) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) {
      throw new Error('No authentication code found');
    }

    const formData = new FormData();
    formData.append('homework_id', homeworkId);
    formData.append('submission_note', submissionNote);
    formData.append('file', {
      uri: file.uri,
      type: file.type || file.mimeType || 'application/octet-stream',
      name: file.name || 'homework_submission',
    });

    // Try passing auth_code as query parameter instead of form data
    const url = buildApiUrl(Config.API_ENDPOINTS.SUBMIT_HOMEWORK_FOLDER, {
      auth_code: auth,
    });

    console.log('📤 Uploading homework file to:', url);
    console.log('📤 Auth passed as query parameter:', auth);
    console.log('📤 FormData contents:', {
      homework_id: homeworkId,
      submission_note: submissionNote,
      file: {
        uri: file.uri,
        type: file.type || file.mimeType || 'application/octet-stream',
        name: file.name || 'homework_submission',
      },
    });

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - let the browser set it with boundary
    });

    console.log('📤 File upload response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('📤 File upload error response:', errorText);

      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(
          `HTTP ${response.status}: ${
            errorJson.message || errorJson.error || 'File upload failed'
          }`
        );
      } catch (parseError) {
        throw new Error(
          `HTTP ${response.status}: ${errorText || 'File upload failed'}`
        );
      }
    }

    const result = await response.json();
    console.log('📤 File upload success:', result);
    return result;
  } catch (error) {
    console.error('Error uploading homework file:', error);
    throw error;
  }
};

/**
 * Mark homework as viewed
 * @param {string} homeworkId - Homework assignment ID
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object>} - Response data
 */
export const markHomeworkAsViewed = async (homeworkId, authCode = null) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) {
      throw new Error('No authentication code found');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.MARK_HOMEWORK_VIEWED);

    return await makeHomeworkApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        homework_id: homeworkId,
        auth_code: auth,
      }),
    });
  } catch (error) {
    console.error('Error marking homework as viewed:', error);
    throw error;
  }
};

/**
 * Mark homework as done
 * @param {string} homeworkId - Homework assignment ID
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object>} - Response data
 */
export const markHomeworkAsDone = async (homeworkId, authCode = null) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) {
      throw new Error('No authentication code found');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.MARK_HOMEWORK_DONE);

    return await makeHomeworkApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        homework_id: homeworkId,
        auth_code: auth,
      }),
    });
  } catch (error) {
    console.error('Error marking homework as done:', error);
    throw error;
  }
};

/**
 * Review homework submission (approve/reject)
 * @param {string} detailId - Homework detail ID
 * @param {string} action - Either "approve" or "reject"
 * @param {string} comment - Teacher feedback (optional for approve, required for reject)
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object>} - Response data
 */
export const reviewHomeworkSubmission = async (
  detailId,
  action,
  comment = '',
  authCode = null
) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) {
      throw new Error('No authentication code found');
    }

    if (action === 'reject' && !comment.trim()) {
      throw new Error('Comment is required when rejecting homework');
    }

    const url = buildApiUrl('/teacher/homework/review');

    return await makeHomeworkApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        auth_code: auth,
        detail_id: detailId,
        action: action,
        comment: comment.trim(),
      }),
    });
  } catch (error) {
    console.error('Error reviewing homework submission:', error);
    throw error;
  }
};

/**
 * Update homework submission (Students)
 * @param {string} detailId - Homework detail/submission ID
 * @param {string} submissionText - Student's submission text/notes
 * @param {string} fileLink - File link from upload response (optional)
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object>} - Response data
 */
export const updateHomeworkSubmission = async (
  detailId,
  submissionText = '',
  fileLink = null,
  authCode = null
) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) {
      throw new Error('No authentication code found');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.UPDATE_HOMEWORK_SUBMISSION);

    const requestBody = {
      detail_id: detailId,
      reply_data: submissionText,
      auth_code: auth,
    };

    // Add file link if provided
    if (fileLink) {
      requestBody.reply_file = fileLink;
    }

    console.log('📝 Updating homework submission to:', url);
    console.log('📝 Update data:', {
      detail_id: detailId,
      reply_data: submissionText,
      reply_file: fileLink,
    });

    return await makeHomeworkApiRequest(url, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  } catch (error) {
    console.error('Error updating homework submission:', error);
    throw error;
  }
};

/**
 * Submit homework assignment
 * @param {string} homeworkId - Homework assignment ID
 * @param {string} submissionText - Submission text/content
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object>} - Response data
 */
export const submitHomeworkAssignment = async (
  homeworkId,
  submissionText,
  authCode = null
) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) {
      throw new Error('No authentication code found');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.SUBMIT_HOMEWORK);

    return await makeHomeworkApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        homework_id: homeworkId,
        reply_data: submissionText,

        auth_code: auth,
      }),
    });
  } catch (error) {
    console.error('Error submitting homework:', error);
    throw error;
  }
};

/**
 * Create homework assignment
 * @param {string} title - Assignment title
 * @param {string} description - Assignment description
 * @param {string} gradeId - Grade ID
 * @param {Array} studentIds - Array of student IDs
 * @param {string} deadline - Deadline date
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object>} - Response data
 */
export const createHomeworkAssignment = async (
  title,
  description,
  gradeId,
  studentIds,
  deadline,
  authCode = null
) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) {
      throw new Error('No authentication code found');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.CREATE_HOMEWORK_ASSIGNMENT);

    return await makeHomeworkApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        title: title,
        homework_data: description, // Send description as homework_data as well
        grade_id: gradeId,
        students: studentIds,
        deadline: deadline,
        auth_code: auth,
      }),
    });
  } catch (error) {
    console.error('Error creating homework assignment:', error);
    throw error;
  }
};

/**
 * Upload homework file (creates folder if needed)
 * @param {string} homeworkId - Homework assignment ID
 * @param {string} className - Class name for folder naming
 * @param {Object} fileData - File data object
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object>} - Response data
 */
export const uploadHomeworkAssignmentFile = async (
  homeworkId,
  className,
  fileData,
  authCode = null
) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) {
      throw new Error('No authentication code found');
    }

    const formData = new FormData();
    formData.append('homework_id', homeworkId);
    formData.append('class_name', className);
    formData.append('file', {
      uri: fileData.uri,
      type: fileData.type,
      name: fileData.name,
    });

    // Try passing auth_code as query parameter instead of form data
    const urlWithAuth = buildApiUrl(
      Config.API_ENDPOINTS.UPLOAD_HOMEWORK_FOLDER_FILE,
      {
        auth_code: auth,
      }
    );

    console.log('📚 Uploading assignment file to:', urlWithAuth);
    console.log('📚 Auth passed as query parameter:', auth);
    console.log('📚 FormData contents:', {
      homework_id: homeworkId,
      class_name: className,
      file: {
        uri: fileData.uri,
        type: fileData.type,
        name: fileData.name,
      },
    });

    const response = await fetch(urlWithAuth, {
      method: 'POST',
      body: formData,
    });

    console.log('📚 Assignment file upload response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('📚 Assignment file upload error response:', errorText);

      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(
          `HTTP ${response.status}: ${
            errorJson.message || errorJson.error || 'Upload failed'
          }`
        );
      } catch (parseError) {
        throw new Error(
          `HTTP ${response.status}: ${errorText || 'Upload failed'}`
        );
      }
    }

    const result = await response.json();
    console.log('📚 Assignment file upload success:', result);
    return result;
  } catch (error) {
    console.error('Error uploading homework file:', error);
    throw error;
  }
};

/**
 * Get student's homework submission history (folder-based)
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object>} - Response data
 */
export const getHomeworkSubmissions = async (authCode = null) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) {
      throw new Error('No authentication code found');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_HOMEWORK_SUBMISSIONS, {
      auth_code: auth,
    });

    return await makeHomeworkApiRequest(url, {
      method: 'GET',
    });
  } catch (error) {
    console.error('Error getting homework submissions:', error);
    throw error;
  }
};

/**
 * Get teacher's classes for homework assignment
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object>} - Response data
 */
export const getTeacherHomeworkClasses = async (authCode = null) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) {
      throw new Error('No authentication code found');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_TEACHER_HOMEWORK_CLASSES, {
      auth_code: auth,
    });

    return await makeHomeworkApiRequest(url, {
      method: 'GET',
    });
  } catch (error) {
    console.error('Error getting teacher homework classes:', error);
    throw error;
  }
};
