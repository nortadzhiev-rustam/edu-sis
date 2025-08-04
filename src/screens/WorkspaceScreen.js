/**
 * Unified Workspace Screen
 * Handles Google Drive workspace for all user types (teacher/parent/student)
 * Adapts UI and functionality based on user permissions
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faFolder,
  faFile,
  faSearch,
  faPlus,
  faUpload,
  faDownload,
  faTrash,
  faEye,
  faChartBar,
  faClock,
  faBuilding,
  faUsers,
  faGraduationCap,
  faClipboardList,
  faBookOpen,
  faBook,
  faSquareShareNodes,
  faChalkboard,
} from '@fortawesome/free-solid-svg-icons';

import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getLanguageFontSizes } from '../contexts/ThemeContext';
import { createSmallShadow } from '../utils/commonStyles';
import { getResponsiveHeaderFontSize } from '../utils/commonStyles';

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

export default function WorkspaceScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const fontSizes = getLanguageFontSizes(currentLanguage);

  // Get user data and parameters
  const { userData, studentData } = route.params || {};
  const [currentUserData, setCurrentUserData] = useState(userData);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [folderPath, setFolderPath] = useState([]);

  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [workspaceData, setWorkspaceData] = useState(null);
  const [currentView, setCurrentView] = useState('structure'); // 'structure', 'folder', 'search', 'recent', 'stats'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recentFiles, setRecentFiles] = useState([]);
  const [statistics, setStatistics] = useState(null);

  const styles = createStyles(theme, fontSizes);

  // Get user data from AsyncStorage if not provided
  useEffect(() => {
    const getUserData = async () => {
      if (!currentUserData) {
        try {
          const storedUserData = await AsyncStorage.getItem('userData');
          if (storedUserData) {
            const parsedData = JSON.parse(storedUserData);
            setCurrentUserData(parsedData);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      }
    };

    getUserData();
  }, [currentUserData]);

  // Load workspace data on mount
  useEffect(() => {
    if (currentUserData) {
      loadWorkspaceData();
    }
  }, [currentUserData]);

  /**
   * Load workspace structure
   */
  const loadWorkspaceData = async () => {
    try {
      setLoading(true);

      // Use student's authCode if accessing as parent
      const studentAuthCode = studentData?.authCode;
      console.log(
        '🔍 WORKSPACE SCREEN: Using student authCode:',
        !!studentAuthCode
      );

      const data = await getWorkspaceStructure(studentAuthCode);
      setWorkspaceData(data);
      setCurrentView('structure');

      // Clear folder path when returning to root
      setCurrentFolderId(null);
      setFolderPath([]);
    } catch (error) {
      console.error('Error loading workspace:', error);
      Alert.alert(t('error'), t('failedToLoadWorkspace'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (currentView === 'structure') {
        await loadWorkspaceData();
      } else if (currentView === 'folder' && currentFolderId) {
        await loadFolderContents(currentFolderId);
      } else if (currentView === 'recent') {
        await loadRecentFiles();
      } else if (currentView === 'stats') {
        await loadStatistics();
      }
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, [currentView, currentFolderId]);

  /**
   * Load folder contents
   */
  const loadFolderContents = async (
    folderId,
    folderName = '',
    isBackNavigation = false
  ) => {
    try {
      setLoading(true);

      // Use student's authCode if accessing as parent
      const studentAuthCode = studentData?.authCode;
      console.log(
        '🔍 WORKSPACE SCREEN: Loading folder contents with student authCode:',
        !!studentAuthCode
      );
      console.log(
        '🔍 WORKSPACE SCREEN: Folder ID:',
        folderId,
        'Name:',
        folderName
      );
      console.log('🔍 WORKSPACE SCREEN: Is back navigation:', isBackNavigation);

      const contents = await getFolderContents(folderId, studentAuthCode);
      setWorkspaceData(contents);
      setCurrentFolderId(folderId);
      setCurrentView('folder');

      // Update folder path only if not back navigation
      if (folderName && !isBackNavigation) {
        console.log('🔍 WORKSPACE SCREEN: Adding to folder path:', folderName);
        setFolderPath((prev) => {
          const newPath = [...prev, { id: folderId, name: folderName }];
          console.log(
            '🔍 WORKSPACE SCREEN: New folder path:',
            newPath.map((f) => f.name)
          );
          return newPath;
        });
      }
    } catch (error) {
      console.error('Error loading folder contents:', error);
      Alert.alert(t('error'), t('failedToLoadFolderContents'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load recent files
   */
  const loadRecentFiles = async () => {
    try {
      setLoading(true);
      const data = await getRecentWorkspaceFiles(20);
      setRecentFiles(data.recent_files || []);
      setCurrentView('recent');
    } catch (error) {
      console.error('Error loading recent files:', error);
      Alert.alert(t('error'), t('failedToLoadRecentFiles'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load workspace statistics
   */
  const loadStatistics = async () => {
    try {
      setLoading(true);
      const data = await getWorkspaceStatistics();
      setStatistics(data.statistics || null);
      setCurrentView('stats');
    } catch (error) {
      console.error('Error loading statistics:', error);
      Alert.alert('Error', 'Failed to load statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle folder press
   */
  const handleFolderPress = (folder) => {
    loadFolderContents(folder.id, folder.name);
  };

  /**
   * Handle file press
   */
  const handleFilePress = (file) => {
    console.log('📄 WORKSPACE: File pressed:', formatFileName(file.name));
    console.log('📄 WORKSPACE: File details:', {
      web_content_link: file.web_content_link,
      web_view_link: file.web_view_link,
      mime_type: file.mime_type,
      has_thumbnail: file.thumbnail?.has_thumbnail,
    });

    // Use web_content_link for download, fallback to web_view_link for viewing
    const fileUrl = file.web_content_link || file.web_view_link;

    if (fileUrl) {
      console.log('📄 WORKSPACE: Opening file URL:', fileUrl);
      Linking.openURL(fileUrl).catch((err) => {
        console.error('Error opening file:', err);
        Alert.alert(
          'Error',
          'Could not open file. Please check your internet connection.'
        );
      });
    } else {
      Alert.alert(
        'File Info',
        `File: ${formatFileName(file.name)}\nSize: ${
          file.size_formatted || file.formatted_size
        }\nType: ${file.mime_type}\nUploaded by: ${
          file.uploaded_by || file.uploader_name
        }`
      );
    }
  };

  /**
   * Handle upload file
   */
  const handleUploadFile = () => {
    const currentLocation =
      currentView === 'folder'
        ? workspaceData?.folder_info?.name || 'Current Folder'
        : 'Root Workspace';

    Alert.alert(
      'Upload File',
      `Upload to: ${currentLocation}\n\nChoose upload method:`,
      [
        {
          text: 'Camera',
          onPress: async () => {
            try {
              // Request camera permissions
              const { status } =
                await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert(
                  'Permission Required',
                  'Camera permission is required to take photos.'
                );
                return;
              }

              // Launch camera
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
              });

              if (
                !result.canceled &&
                result.assets &&
                result.assets.length > 0
              ) {
                const asset = result.assets[0];
                await handleFileUpload(asset, currentLocation);
              }
            } catch (error) {
              console.error('Camera upload error:', error);
              Alert.alert('Error', 'Camera upload failed: ' + error.message);
            }
          },
        },
        {
          text: 'Gallery',
          onPress: async () => {
            try {
              // Request media library permissions
              const { status } =
                await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert(
                  'Permission Required',
                  'Media library permission is required to select photos.'
                );
                return;
              }

              // Launch image picker
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
              });

              if (
                !result.canceled &&
                result.assets &&
                result.assets.length > 0
              ) {
                const asset = result.assets[0];
                await handleFileUpload(asset, currentLocation);
              }
            } catch (error) {
              console.error('Gallery upload error:', error);
              Alert.alert('Error', 'Gallery upload failed: ' + error.message);
            }
          },
        },
        {
          text: 'Documents',
          onPress: async () => {
            try {
              // Launch document picker
              const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
                multiple: false,
              });

              if (
                !result.canceled &&
                result.assets &&
                result.assets.length > 0
              ) {
                const asset = result.assets[0];
                await handleFileUpload(asset, currentLocation);
              }
            } catch (error) {
              console.error('Document upload error:', error);
              Alert.alert('Error', 'Document upload failed: ' + error.message);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  /**
   * Handle file upload from picker result
   */
  const handleFileUpload = async (asset, location) => {
    const fileName = formatFileName(
      asset.name || asset.fileName || 'uploaded_file'
    );

    try {
      setUploading(true);

      const folderId = currentView === 'folder' ? currentFolderId : null;
      const studentAuthCode = studentData?.authCode;

      console.log('📤 Uploading file:', fileName, 'to folder:', folderId);
      console.log('📤 File details:', {
        uri: asset.uri,
        name: fileName,
        type: asset.mimeType || asset.type,
        size: asset.fileSize || asset.size,
      });

      // Extract file information
      const fileUri = asset.uri;
      const mimeType =
        asset.mimeType || asset.type || 'application/octet-stream';
      const description = `Uploaded to ${location}`;

      // Call the actual upload API and wait for response
      const result = await uploadWorkspaceFile(
        folderId,
        fileUri,
        fileName,
        mimeType,
        description,
        studentAuthCode
      );

      console.log('📤 Upload result:', result);

      // The uploadWorkspaceFile function already throws an error if upload fails
      // If we reach here, the upload was successful
      setUploading(false);

      Alert.alert(
        'Upload Successful',
        `File "${fileName}" has been uploaded successfully to ${location}!`,
        [
          {
            text: 'OK',
            onPress: async () => {
              // Refresh the current view after user acknowledges success
              if (currentView === 'folder') {
                await loadFolderContents(
                  currentFolderId,
                  workspaceData?.folder_info?.name,
                  true
                );
              } else {
                await loadWorkspaceData();
              }
            },
          },
        ]
      );
    } catch (error) {
      setUploading(false);
      console.error('❌ Upload error:', error);

      // Show specific error message
      const errorMessage =
        error.message ||
        'Failed to upload file. Please check your connection and try again.';

      Alert.alert('Upload Failed', errorMessage, [{ text: 'OK' }]);
    }
  };

  /**
   * Handle create folder
   */
  const handleCreateFolder = () => {
    const currentLocation =
      currentView === 'folder'
        ? workspaceData?.folder_info?.name || 'Current Folder'
        : 'Root Workspace';

    Alert.prompt(
      'Create Folder',
      `Create folder in: ${currentLocation}\n\nEnter folder name:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async (folderName) => {
            if (!folderName || folderName.trim() === '') {
              Alert.alert('Error', 'Please enter a valid folder name.');
              return;
            }

            try {
              const parentFolderId =
                currentView === 'folder' ? currentFolderId : null;
              const studentAuthCode = studentData?.authCode;

              console.log(
                '📁 Creating folder:',
                folderName,
                'in parent:',
                parentFolderId
              );

              // Call the actual API
              await createWorkspaceFolder(
                parentFolderId,
                folderName.trim(),
                '', // description
                studentAuthCode
              );

              Alert.alert(
                'Success',
                `Folder "${folderName}" created successfully!`
              );

              // Refresh the current view after creation
              if (currentView === 'folder') {
                await loadFolderContents(
                  currentFolderId,
                  workspaceData?.folder_info?.name,
                  true
                );
              } else {
                await loadWorkspaceData();
              }
            } catch (error) {
              console.error('Error creating folder:', error);
              Alert.alert(
                'Error',
                error.message || 'Failed to create folder. Please try again.'
              );
            }
          },
        },
      ],
      'plain-text'
    );
  };

  /**
   * Handle delete item
   */
  const handleDeleteItem = (item, isFolder = false) => {
    const itemType = isFolder ? 'folder' : 'file';

    Alert.alert(
      `Delete ${itemType}`,
      `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const studentAuthCode = studentData?.authCode;

              console.log(
                '🗑️ Deleting item:',
                item.name,
                'isFolder:',
                isFolder
              );

              // Call the actual API
              await deleteWorkspaceItem(item.id, isFolder, studentAuthCode);

              Alert.alert(
                'Success',
                `${itemType} "${item.name}" deleted successfully!`
              );

              // Refresh the current view after deletion
              if (currentView === 'folder') {
                await loadFolderContents(
                  currentFolderId,
                  workspaceData?.folder_info?.name,
                  true
                );
              } else {
                await loadWorkspaceData();
              }
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert(
                'Error',
                error.message ||
                  `Failed to delete ${itemType}. Please try again.`
              );
            }
          },
        },
      ]
    );
  };

  /**
   * Handle upload to specific subfolder
   */
  const handleSubfolderUpload = (folder) => {
    // Temporarily set the current folder context for upload
    const originalFolderId = currentFolderId;
    const originalView = currentView;

    // Set context to the target subfolder
    setCurrentFolderId(folder.id);
    setCurrentView('folder');

    Alert.alert(
      'Upload File',
      `Upload to: ${folder.name}\n\nChoose upload method:`,
      [
        {
          text: 'Camera',
          onPress: async () => {
            try {
              const { status } =
                await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert(
                  'Permission Required',
                  'Camera permission is required to take photos.'
                );
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
              });
              if (
                !result.canceled &&
                result.assets &&
                result.assets.length > 0
              ) {
                await handleFileUpload(result.assets[0], folder.name);
              }
            } catch (error) {
              Alert.alert(
                'Camera Upload Failed',
                error.message || 'Failed to upload photo from camera.',
                [{ text: 'OK' }]
              );
            } finally {
              // Restore original context
              setCurrentFolderId(originalFolderId);
              setCurrentView(originalView);
            }
          },
        },
        {
          text: 'Gallery',
          onPress: async () => {
            try {
              const { status } =
                await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert(
                  'Permission Required',
                  'Media library permission is required to select photos.'
                );
                return;
              }
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
              });
              if (
                !result.canceled &&
                result.assets &&
                result.assets.length > 0
              ) {
                await handleFileUpload(result.assets[0], folder.name);
              }
            } catch (error) {
              Alert.alert(
                'Gallery Upload Failed',
                error.message || 'Failed to upload photo from gallery.',
                [{ text: 'OK' }]
              );
            } finally {
              // Restore original context
              setCurrentFolderId(originalFolderId);
              setCurrentView(originalView);
            }
          },
        },
        {
          text: 'Documents',
          onPress: async () => {
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
                multiple: false,
              });
              if (
                !result.canceled &&
                result.assets &&
                result.assets.length > 0
              ) {
                await handleFileUpload(result.assets[0], folder.name);
              }
            } catch (error) {
              Alert.alert(
                'Document Upload Failed',
                error.message || 'Failed to upload document.',
                [{ text: 'OK' }]
              );
            } finally {
              // Restore original context
              setCurrentFolderId(originalFolderId);
              setCurrentView(originalView);
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            // Restore original context on cancel
            setCurrentFolderId(originalFolderId);
            setCurrentView(originalView);
          },
        },
      ]
    );
  };

  /**
   * Handle create folder in specific subfolder
   */
  const handleSubfolderCreateFolder = (folder) => {
    Alert.prompt(
      'Create Folder',
      `Create folder in: ${folder.name}\n\nEnter folder name:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async (folderName) => {
            if (!folderName || folderName.trim() === '') {
              Alert.alert('Error', 'Please enter a valid folder name.');
              return;
            }

            try {
              const studentAuthCode = studentData?.authCode;

              console.log(
                '📁 Creating subfolder:',
                folderName,
                'in:',
                folder.name
              );

              // Call the actual API with the subfolder ID as parent
              await createWorkspaceFolder(
                folder.id,
                folderName.trim(),
                '', // description
                studentAuthCode
              );

              Alert.alert(
                'Success',
                `Folder "${folderName}" created successfully in ${folder.name}!`
              );

              // Refresh the current view
              if (currentView === 'folder') {
                await loadFolderContents(
                  currentFolderId,
                  workspaceData?.folder_info?.name,
                  true
                );
              } else {
                await loadWorkspaceData();
              }
            } catch (error) {
              console.error('Error creating subfolder:', error);
              Alert.alert(
                'Error',
                error.message || 'Failed to create folder. Please try again.'
              );
            }
          },
        },
      ],
      'plain-text'
    );
  };

  /**
   * Handle back navigation
   */
  const handleBackPress = () => {
    console.log('🔙 WORKSPACE: Back pressed - Current view:', currentView);
    console.log('🔙 WORKSPACE: Folder path length:', folderPath.length);
    console.log(
      '🔙 WORKSPACE: Folder path:',
      folderPath.map((f) => f.name)
    );

    if (currentView === 'folder') {
      if (folderPath.length > 1) {
        // Navigate back to parent folder (not root)
        const newPath = [...folderPath];
        newPath.pop(); // Remove current folder
        setFolderPath(newPath);

        const parentFolder = newPath[newPath.length - 1];
        console.log(
          '🔙 WORKSPACE: Navigating to parent folder:',
          parentFolder.name
        );
        loadFolderContents(parentFolder.id, parentFolder.name, true);
      } else {
        // Back to root structure (from first level folder)
        console.log('🔙 WORKSPACE: Navigating to root structure');
        loadWorkspaceData();
      }
    } else {
      // Exit workspace from root view
      console.log('🔙 WORKSPACE: Exiting workspace');
      navigation.goBack();
    }
  };

  /**
   * Get user permissions
   */
  const permissions = currentUserData
    ? getUserPermissions(currentUserData.userType)
    : {};

  /**
   * Get screen title based on current view and folder
   */
  const getScreenTitle = () => {
    if (currentView === 'folder' && workspaceData?.folder_info?.name) {
      return workspaceData.folder_info.name;
    }

    if (currentUserData?.userType === 'parent') {
      return 'Materials';
    }
    return 'Resources';
  };

  /**
   * Build breadcrumb path for current folder
   */
  const getBreadcrumbPath = () => {
    if (currentView !== 'folder' || folderPath.length === 0) {
      return '';
    }

    const rootName =
      currentUserData?.userType === 'parent' ? 'Materials' : 'Resources';
    const pathNames = [rootName, ...folderPath.map((folder) => folder.name)];
    const breadcrumb = pathNames.join(' > ');

    console.log('🍞 WORKSPACE: Breadcrumb path:', breadcrumb);
    console.log(
      '🍞 WORKSPACE: Folder path items:',
      folderPath.map((f) => f.name)
    );

    return breadcrumb;
  };

  /**
   * Get folder icon based on type
   */
  const getFolderIcon = (folderType) => {
    const iconMap = {
      branch_root: faBuilding,
      assessments: faChalkboard,
      curriculum: faBookOpen,
      staff_resources: faUsers,
      student_materials: faGraduationCap,
      homework: faClipboardList,
      homework_parent: faClipboardList,
      shared_projects: faSquareShareNodes,
      library: faBook,
      custom: faFolder,
      administrative: faBuilding,
    };
    return iconMap[folderType] || faFolder;
  };

  /**
   * Get file icon based on type
   */
  const getFileIcon = (fileType) => {
    const iconMap = {
      pdf: faFile,
      office: faFile,
      image: faFile,
      video: faFile,
      audio: faFile,
      archive: faFile,
    };
    return iconMap[fileType] || faFile;
  };

  /**
   * Get file type color based on MIME type (Google Drive style)
   */
  const getFileTypeColor = (mimeType) => {
    if (mimeType?.includes('image')) return '#34a853'; // Green for images
    if (mimeType?.includes('pdf')) return '#ea4335'; // Red for PDFs
    if (mimeType?.includes('document') || mimeType?.includes('word'))
      return '#4285f4'; // Blue for docs
    if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel'))
      return '#0f9d58'; // Green for sheets
    if (mimeType?.includes('presentation') || mimeType?.includes('powerpoint'))
      return '#ff6d01'; // Orange for slides
    if (mimeType?.includes('video')) return '#ff6d01'; // Orange for videos
    if (mimeType?.includes('audio')) return '#ff6d01'; // Orange for audio
    return '#5f6368'; // Gray for others
  };

  /**
   * Get file extension from filename
   */
  const getFileExtension = (filename) => {
    const extension = filename?.split('.').pop();
    return extension || 'FILE';
  };

  /**
   * Format file name to handle URL encoding and clean display
   */
  const formatFileName = (filename) => {
    if (!filename) return 'Untitled';

    try {
      // Decode URL encoding (like %20 for spaces)
      let decodedName = decodeURIComponent(filename);

      // Replace any remaining encoded characters
      decodedName = decodedName
        .replace(/%20/g, ' ') // Spaces
        .replace(/%21/g, '!') // Exclamation mark
        .replace(/%22/g, '"') // Quote
        .replace(/%23/g, '#') // Hash
        .replace(/%24/g, '$') // Dollar
        .replace(/%25/g, '%') // Percent
        .replace(/%26/g, '&') // Ampersand
        .replace(/%27/g, "'") // Apostrophe
        .replace(/%28/g, '(') // Left parenthesis
        .replace(/%29/g, ')') // Right parenthesis
        .replace(/%2A/g, '*') // Asterisk
        .replace(/%2B/g, '+') // Plus
        .replace(/%2C/g, ',') // Comma
        .replace(/%2D/g, '-') // Hyphen
        .replace(/%2E/g, '.') // Period
        .replace(/%2F/g, '/') // Forward slash
        .replace(/%3A/g, ':') // Colon
        .replace(/%3B/g, ';') // Semicolon
        .replace(/%3C/g, '<') // Less than
        .replace(/%3D/g, '=') // Equals
        .replace(/%3E/g, '>') // Greater than
        .replace(/%3F/g, '?') // Question mark
        .replace(/%40/g, '@') // At symbol
        .replace(/%5B/g, '[') // Left bracket
        .replace(/%5C/g, '\\') // Backslash
        .replace(/%5D/g, ']') // Right bracket
        .replace(/%5E/g, '^') // Caret
        .replace(/%5F/g, '_') // Underscore
        .replace(/%60/g, '`') // Backtick
        .replace(/%7B/g, '{') // Left brace
        .replace(/%7C/g, '|') // Pipe
        .replace(/%7D/g, '}') // Right brace
        .replace(/%7E/g, '~'); // Tilde

      // Trim whitespace and return
      return decodedName.trim();
    } catch (error) {
      console.log('Error formatting filename:', filename, error);
      // If decoding fails, just replace %20 with spaces as fallback
      return filename.replace(/%20/g, ' ').trim();
    }
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes) => {
    if (bytes >= 1073741824) {
      return (bytes / 1073741824).toFixed(2) + ' GB';
    } else if (bytes >= 1048576) {
      return (bytes / 1048576).toFixed(2) + ' MB';
    } else if (bytes >= 1024) {
      return (bytes / 1024).toFixed(2) + ' KB';
    } else {
      return bytes + ' bytes';
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading workspace...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (uploading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={styles.loadingText}>Uploading file...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Compact Header */}
      <View style={styles.compactHeaderContainer}>
        {/* Navigation Header */}
        <View style={styles.navigationHeader}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
          </TouchableOpacity>

          <Text
            style={[
              styles.headerTitle,
              { fontSize: getResponsiveHeaderFontSize(2, getScreenTitle()) },
            ]}
          >
            {getScreenTitle()}
          </Text>

          <View style={styles.headerActions}>
            {/* Show upload button - always show for now to test */}
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={handleUploadFile}
            >
              <FontAwesomeIcon icon={faUpload} size={18} color='#fff' />
            </TouchableOpacity>

            {/* Show create folder button - always show for now to test */}
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={handleCreateFolder}
            >
              <FontAwesomeIcon icon={faPlus} size={18} color='#fff' />
            </TouchableOpacity>

            {/* Delete current folder button (only in folder view) */}
            {currentView === 'folder' &&
              workspaceData?.folder_info?.can_manage && (
                <TouchableOpacity
                  style={[styles.headerActionButton, styles.headerDeleteButton]}
                  onPress={() => {
                    Alert.alert(
                      'Delete Folder',
                      `Are you sure you want to delete the entire "${workspaceData.folder_info.name}" folder and all its contents? This action cannot be undone.`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: async () => {
                            try {
                              const studentAuthCode = studentData?.authCode;
                              await deleteWorkspaceItem(
                                workspaceData.folder_info.id,
                                true,
                                studentAuthCode
                              );
                              Alert.alert(
                                'Success',
                                `Folder "${workspaceData.folder_info.name}" deleted successfully!`
                              );
                              // Navigate back to root after deleting current folder
                              await loadWorkspaceData();
                            } catch (error) {
                              console.error('Error deleting folder:', error);
                              Alert.alert(
                                'Error',
                                error.message ||
                                  'Failed to delete folder. Please try again.'
                              );
                            }
                          },
                        },
                      ]
                    );
                  }}
                >
                  <FontAwesomeIcon icon={faTrash} size={18} color='#fff' />
                </TouchableOpacity>
              )}

            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => {
                // TODO: Implement search
                Alert.alert(
                  'Coming Soon',
                  'Search functionality will be available soon.'
                );
              }}
            >
              <FontAwesomeIcon icon={faSearch} size={18} color='#fff' />
            </TouchableOpacity>
          </View>
        </View>

        {/* Subheader with breadcrumb or root folder info */}
        <View style={styles.subHeader}>
          {currentView === 'folder' && getBreadcrumbPath() ? (
            <Text style={styles.breadcrumbText} numberOfLines={1}>
              {getBreadcrumbPath()}
            </Text>
          ) : (
            workspaceData?.workspace?.root_folder && (
              <View style={styles.rootFolderInfo}>
                <View style={styles.rootFolderHeader}>
                  <View style={styles.rootFolderIconContainer}>
                    <FontAwesomeIcon
                      icon={faBuilding}
                      size={24}
                      color={theme.colors.primary}
                    />
                  </View>
                  <Text style={styles.rootFolderName}>
                    {workspaceData.workspace.root_folder.name}
                  </Text>
                </View>
                <Text style={styles.rootFolderDescription} numberOfLines={1}>
                  {workspaceData.workspace.root_folder.description}
                </Text>
              </View>
            )
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {currentView === 'structure' && workspaceData && (
          <View style={styles.content}>
            {/* Folders List */}
            <View style={styles.foldersSection}>
              <Text style={styles.sectionTitle}>Folders</Text>
              {workspaceData.workspace.folders.map((folder) => (
                <TouchableOpacity
                  key={folder.id}
                  style={styles.folderCard}
                  onPress={() => handleFolderPress(folder)}
                  onLongPress={() => {
                    // Only admin can delete root folders
                    if (currentUserData?.userType === 'admin') {
                      handleDeleteItem(folder, true);
                    } else {
                      Alert.alert(
                        'Permission Denied',
                        'Only administrators can delete main workspace folders.',
                        [{ text: 'OK' }]
                      );
                    }
                  }}
                >
                  <View style={styles.folderIconContainer}>
                    <FontAwesomeIcon
                      icon={getFolderIcon(folder.type)}
                      size={20}
                      color={
                        folder.color === 'success'
                          ? theme.colors.success
                          : folder.color === 'info'
                          ? theme.colors.info
                          : folder.color === 'warning'
                          ? theme.colors.warning
                          : theme.colors.primary
                      }
                    />
                  </View>
                  <View style={styles.folderInfo}>
                    <Text style={styles.folderName}>{folder.name}</Text>
                    <Text style={styles.folderDescription}>
                      {folder.description}
                    </Text>
                    {folder.file_count !== undefined && (
                      <Text style={styles.folderStats}>
                        {folder.file_count} files • {folder.total_size}
                      </Text>
                    )}
                  </View>

                  {/* Main folder action buttons */}
                  <View style={styles.folderActions}>
                    {/* Delete button for main folders - only admin can delete root folders */}
                    {currentUserData?.userType === 'admin' && (
                      <TouchableOpacity
                        style={[
                          styles.itemActionButton,
                          styles.deleteActionButton,
                        ]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(folder, true);
                        }}
                      >
                        <FontAwesomeIcon
                          icon={faTrash}
                          size={12}
                          color={theme.colors.error}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {currentView === 'folder' && workspaceData && (
          <View style={styles.content}>
            {/* Subfolders */}
            {workspaceData.folders && workspaceData.folders.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Folders</Text>
                {workspaceData.folders.map((folder) => (
                  <TouchableOpacity
                    key={folder.id}
                    style={styles.itemCard}
                    onPress={() => handleFolderPress(folder)}
                    onLongPress={() => {
                      if (
                        folder.creator_name === currentUserData?.name ||
                        folder.creator_name === currentUserData?.full_name ||
                        workspaceData?.folder_info?.can_manage ||
                        currentUserData?.userType === 'admin'
                      ) {
                        handleDeleteItem(folder, true);
                      }
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faFolder}
                      size={20}
                      color={theme.colors.primary}
                    />
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{folder.name}</Text>
                      <Text style={styles.itemDetails}>
                        {folder.file_count} files
                      </Text>
                    </View>

                    {/* Subfolder action buttons */}
                    <View style={styles.itemActions}>
                      {folder.user_can_upload && (
                        <TouchableOpacity
                          style={styles.itemActionButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            // Upload to this specific folder
                            handleSubfolderUpload(folder);
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faUpload}
                            size={12}
                            color={theme.colors.textSecondary}
                          />
                        </TouchableOpacity>
                      )}
                      {folder.user_can_create_folder && (
                        <TouchableOpacity
                          style={styles.itemActionButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            // Create folder in this specific folder
                            handleSubfolderCreateFolder(folder);
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faPlus}
                            size={12}
                            color={theme.colors.textSecondary}
                          />
                        </TouchableOpacity>
                      )}
                      {/* Delete button for folders - check if user is creator or has permissions */}
                      {(folder.creator_name === currentUserData?.name ||
                        folder.creator_name === currentUserData?.full_name ||
                        workspaceData?.folder_info?.can_manage ||
                        currentUserData?.userType === 'admin') && (
                        <TouchableOpacity
                          style={[
                            styles.itemActionButton,
                            styles.deleteActionButton,
                          ]}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDeleteItem(folder, true);
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faTrash}
                            size={12}
                            color={theme.colors.error}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Files */}
            {workspaceData.files && workspaceData.files.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Files</Text>
                {workspaceData.files.map((file) => (
                  <TouchableOpacity
                    key={file.id}
                    style={styles.itemCard}
                    onPress={() => handleFilePress(file)}
                    onLongPress={() => {
                      if (
                        file.uploaded_by === currentUserData?.name ||
                        file.uploaded_by === currentUserData?.full_name ||
                        workspaceData?.folder_info?.can_manage ||
                        currentUserData?.userType === 'admin'
                      ) {
                        handleDeleteItem(file, false);
                      }
                    }}
                  >
                    {/* File thumbnail or icon */}
                    <View style={styles.fileThumbnailContainer}>
                      {file.thumbnail?.has_thumbnail &&
                      file.thumbnail?.thumbnail_url?.small ? (
                        <Image
                          source={{ uri: file.thumbnail.thumbnail_url.small }}
                          style={styles.fileThumbnail}
                          resizeMode='cover'
                          onError={() => {
                            console.log(
                              'Failed to load thumbnail for:',
                              formatFileName(file.name)
                            );
                          }}
                        />
                      ) : (
                        <View style={styles.fileIconContainer}>
                          <FontAwesomeIcon
                            icon={getFileIcon(file.file_type)}
                            size={24}
                            color={getFileTypeColor(file.mime_type)}
                          />
                        </View>
                      )}
                      {/* File type badge */}
                      <View style={styles.fileTypeBadge}>
                        <Text style={styles.fileTypeBadgeText}>
                          {getFileExtension(file.name).toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>
                        {formatFileName(file.name)}
                      </Text>
                      <Text style={styles.itemDetails}>
                        {file.size_formatted} • {file.uploaded_by}
                      </Text>
                    </View>

                    {/* File action buttons */}
                    <View style={styles.itemActions}>
                      {/* Delete button for files - check if user is uploader or has permissions */}
                      {(file.uploaded_by === currentUserData?.name ||
                        file.uploaded_by === currentUserData?.full_name ||
                        workspaceData?.folder_info?.can_manage ||
                        currentUserData?.userType === 'admin') && (
                        <TouchableOpacity
                          style={[
                            styles.itemActionButton,
                            styles.deleteActionButton,
                          ]}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDeleteItem(file, false);
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faTrash}
                            size={12}
                            color={theme.colors.error}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Empty State */}
            {(!workspaceData.folders || workspaceData.folders.length === 0) &&
              (!workspaceData.files || workspaceData.files.length === 0) && (
                <View style={styles.emptyState}>
                  <FontAwesomeIcon
                    icon={faFolder}
                    size={48}
                    color={theme.colors.textLight}
                  />
                  <Text style={styles.emptyStateText}>
                    This folder is empty
                  </Text>
                </View>
              )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Create styles for the workspace screen
 */
const createStyles = (theme, fontSizes) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    loadingText: {
      marginTop: 15,
      fontSize: 16,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    // Compact Header Styles
    compactHeaderContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 8,
      ...createSmallShadow(theme),
      zIndex: 1,
    },
    navigationHeader: {
      backgroundColor: theme.colors.headerBackground,
      padding: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    },

    subHeader: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
    },
    breadcrumbText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    rootFolderInfo: {
      alignItems: 'center',
      paddingHorizontal: 3,
      paddingVertical: 8,
    },
    rootFolderHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    rootFolderName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginLeft: 8,
      flex: 1,
    },
    rootFolderDescription: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 5,
    },
    rootFolderIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 10,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerActionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerDeleteButton: {
      backgroundColor: 'rgba(255, 59, 48, 0.3)', // Red background for delete
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 20,
      // backgroundColor: '#ffffff',
    },

    folderIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    folderInfo: {
      flex: 1,
    },
    foldersSection: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#202124',
      marginBottom: 16,
      marginTop: 8,
    },
    folderCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      ...createSmallShadow(theme),
    },
    folderName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    folderDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    folderStats: {
      fontSize: 12,
      color: theme.colors.textLight,
    },
    folderActions: {
      position: 'absolute',
      top: 12,
      right: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    section: {
      marginBottom: 20,
    },
    itemCard: {
      backgroundColor: '#ffffff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#e8eaed',
      ...createSmallShadow(theme),
    },
    fileThumbnail: {
      width: 48,
      height: 48,
      borderRadius: 8,
      marginRight: 16,
      backgroundColor: '#f8f9fa',
      borderWidth: 1,
      borderColor: '#e8eaed',
      ...createSmallShadow(theme),
    },
    fileIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 8,
      backgroundColor: '#ffffff',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
      borderWidth: 1,
      borderColor: '#e8eaed',
      ...createSmallShadow(theme),
    },
    fileThumbnailContainer: {
      position: 'relative',
      marginRight: 16,
    },
    fileTypeBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      backgroundColor: '#1a73e8',
      borderRadius: 4,
      paddingHorizontal: 4,
      paddingVertical: 1,
      minWidth: 20,
      alignItems: 'center',
    },
    fileTypeBadgeText: {
      fontSize: 9,
      fontWeight: '600',
      color: '#ffffff',
      textAlign: 'center',
    },
    itemInfo: {
      flex: 1,
      marginLeft: 12,
    },
    itemName: {
      fontSize: 15,
      fontWeight: '500',
      color: '#202124',
      marginBottom: 4,
      lineHeight: 20,
    },
    itemDetails: {
      fontSize: 13,
      color: '#5f6368',
      lineHeight: 16,
    },
    itemActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    itemActionButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      ...createSmallShadow(theme),
    },
    deleteActionButton: {
      backgroundColor: theme.colors.error + '15', // Light red background
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyStateText: {
      fontSize: 16,
      color: theme.colors.textLight,
      marginTop: 16,
      textAlign: 'center',
    },
  });
