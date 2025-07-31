import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  Image,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faUpload,
  faCamera,
  faImage,
  faFile,
  faTimes,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

const HomeworkFileUpload = ({
  onFileSelected,
  onFileUploaded,
  disabled = false,
  maxFileSize = 50 * 1024 * 1024, // 50MB for teachers, 10MB for students
  allowedTypes = [
    'pdf',
    'doc',
    'docx',
    'ppt',
    'pptx',
    'xls',
    'xlsx',
    'jpg',
    'png',
    'zip',
  ],
  userType = 'student', // 'teacher' or 'student'
  uploadFunction = null, // Function to handle the actual upload
  buttonText = 'Upload File',
  showPreview = true,
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(theme);

  const [showOptions, setShowOptions] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [thumbnailError, setThumbnailError] = useState(false);

  // Request permissions
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant permission to access your photo library to attach images.'
      );
      return false;
    }
    return true;
  };

  // Handle image picker
  const handleImagePicker = async () => {
    setShowOptions(false);

    if (!(await requestPermissions())) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        // Check file size
        if (asset.fileSize && asset.fileSize > maxFileSize) {
          Alert.alert(
            t('fileTooLarge'),
            `${t('pleaseSelectSmallerFile')} ${Math.round(
              maxFileSize / (1024 * 1024)
            )}MB`
          );
          return;
        }

        // Mark as photo library image
        const assetWithSource = { ...asset, isFromCamera: false };
        await handleFileSelection(assetWithSource);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('error'), t('failedToSelectImage'));
    }
  };

  // Handle camera capture
  const handleCamera = async () => {
    setShowOptions(false);

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera permission to take photos.'
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // Mark as camera image
        const assetWithSource = { ...asset, isFromCamera: true };
        await handleFileSelection(assetWithSource);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  // Handle document selection with iOS crash prevention
  const handleDocumentPicker = async () => {
    setShowOptions(false);

    // Add a small delay to ensure modal is closed before opening document picker
    setTimeout(async () => {
      try {
        console.log('📄 Starting document picker...');

        // Try with a simpler configuration first to avoid iOS crashes
        let result;
        try {
          // First attempt: Use specific MIME types
          result = await DocumentPicker.getDocumentAsync({
            type: 'application/pdf',
            copyToCacheDirectory: true,
            multiple: false,
          });
        } catch (firstError) {
          console.log('First attempt failed, trying fallback:', firstError);

          // Fallback: Use generic document type
          result = await DocumentPicker.getDocumentAsync({
            type: 'public.item',
            copyToCacheDirectory: false, // Try without copying to cache
            multiple: false,
          });
        }

        console.log('📄 Document picker result:', result);

        if (!result.canceled) {
          // Handle different API response formats
          let asset = null;

          if (result.assets && result.assets.length > 0) {
            // New API format with assets array
            asset = result.assets[0];
          } else if (result.uri) {
            // Old API format with direct properties
            asset = result;
          } else if (result.type === 'success') {
            // Alternative format check
            asset = result;
          }

          if (!asset || !asset.uri) {
            console.log(
              'No valid asset found in document picker result:',
              result
            );
            Alert.alert('Error', 'No file was selected or file is invalid');
            return;
          }

          console.log('📄 Selected asset:', asset);

          // Check file size
          if (asset.size && asset.size > maxFileSize) {
            Alert.alert(
              'File Too Large',
              `Please select a file smaller than ${Math.round(
                maxFileSize / (1024 * 1024)
              )}MB`
            );
            return;
          }

          // Check file type
          const fileExtension = asset.name?.split('.').pop()?.toLowerCase();
          if (
            allowedTypes.length > 0 &&
            fileExtension &&
            !allowedTypes.includes(fileExtension)
          ) {
            Alert.alert(
              'File Type Not Supported',
              `Please select a file with one of these extensions: ${allowedTypes.join(
                ', '
              )}`
            );
            return;
          }

          await handleFileSelection(asset);
        }
      } catch (error) {
        console.error('Error picking document:', error);

        // Handle specific iOS DocumentManager crash
        if (
          error.message?.includes('DocumentManager') ||
          error.message?.includes('deallocated') ||
          error.message?.includes('NSInternalInconsistencyException')
        ) {
          Alert.alert(
            'Document Picker Issue',
            'The document picker encountered an iOS system issue. Please use the Camera or Photo Library options instead, or restart the app.',
            [
              { text: 'OK', style: 'default' },
              {
                text: 'Try Photo Library',
                style: 'default',
                onPress: () => {
                  handleImagePicker().catch(console.error);
                },
              },
            ]
          );
        } else {
          Alert.alert('Error', 'Failed to select document. Please try again.');
        }
      }
    }, 300); // 300ms delay to ensure modal is fully closed
  };

  // Generate filename for image files
  const generateImageFileName = (uri, isFromCamera = false) => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS

    // Extract extension from URI, default to jpg for images
    let extension = 'jpg';
    if (uri && uri.includes('.')) {
      const extractedExt = uri.split('.').pop()?.toLowerCase();
      if (
        extractedExt &&
        ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extractedExt)
      ) {
        extension = extractedExt;
      }
    }

    const prefix = isFromCamera ? 'camera' : 'photo';
    return `${prefix}_${dateStr}_${timeStr}.${extension}`;
  };

  // Handle file selection
  const handleFileSelection = async (file) => {
    try {
      console.log('📁 File selected:', file);

      // Ensure file has a proper name
      let processedFile = { ...file };

      // For image picker results that don't have a name
      if (!processedFile.name && processedFile.uri) {
        // Check if it's from image picker (has width/height but no name)
        if (processedFile.width && processedFile.height) {
          processedFile.name = generateImageFileName(
            processedFile.uri,
            processedFile.isFromCamera
          );
        } else {
          // Fallback: extract name from URI or generate one
          const uriParts = processedFile.uri.split('/');
          const lastPart = uriParts[uriParts.length - 1];
          processedFile.name = lastPart.includes('.')
            ? lastPart
            : 'selected_file';
        }
      }

      // Reset thumbnail error when new file is selected
      setThumbnailError(false);

      setSelectedFile(processedFile);
      onFileSelected?.(processedFile);

      // If upload function is provided, upload immediately
      if (uploadFunction) {
        await handleFileUpload(processedFile);
      }
    } catch (error) {
      console.error('Error handling file selection:', error);
      Alert.alert('Error', 'Failed to process selected file');
    }
  };

  // Handle file upload
  const handleFileUpload = async (file) => {
    if (!uploadFunction) {
      Alert.alert(t('error'), t('uploadFunctionNotProvided'));
      return;
    }

    try {
      setUploading(true);
      const result = await uploadFunction(file);
      setUploadResult(result);
      onFileUploaded?.(result);
      Alert.alert(t('success'), t('fileUploadedSuccessfully'));
    } catch (error) {
      console.error('Error uploading file:', error);
      Alert.alert(t('uploadFailed'), error.message || t('failedToUploadFile'));
    } finally {
      setUploading(false);
    }
  };

  // Remove selected file
  const removeSelectedFile = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setThumbnailError(false);
  };

  // Get file size display
  const getFileSizeDisplay = (size) => {
    if (!size) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get file extension from filename
  const getFileExtension = (filename) => {
    const extension = filename?.split('.').pop();
    return extension || 'FILE';
  };

  // Check if file is an image
  const isImageFile = (fileName) => {
    if (!fileName) return false;
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension);
  };

  // Get file type icon based on extension
  const getFileTypeIcon = (fileName) => {
    if (!fileName) return faFile;
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'webp':
        return faImage;
      case 'pdf':
      case 'doc':
      case 'docx':
      case 'ppt':
      case 'pptx':
      case 'xls':
      case 'xlsx':
      case 'zip':
      case 'rar':
        return faFile;
      default:
        return faFile;
    }
  };

  // Get file type color based on extension
  const getFileTypeColor = (fileName) => {
    if (!fileName) return theme.colors.primary;
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'pdf':
        return '#FF3B30'; // Red for PDF
      case 'doc':
      case 'docx':
        return '#007AFF'; // Blue for Word
      case 'xls':
      case 'xlsx':
        return '#34C759'; // Green for Excel
      case 'ppt':
      case 'pptx':
        return '#FF9500'; // Orange for PowerPoint
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'webp':
        return '#AF52DE'; // Purple for images
      case 'zip':
      case 'rar':
        return '#FF2D92'; // Pink for archives
      default:
        return theme.colors.primary;
    }
  };

  return (
    <View style={styles.container}>
      {/* Upload Button */}
      <TouchableOpacity
        style={[styles.uploadButton, disabled && styles.disabledButton]}
        onPress={() => setShowOptions(true)}
        disabled={disabled || uploading}
      >
        {uploading ? (
          <ActivityIndicator size='small' color='#fff' />
        ) : (
          <FontAwesomeIcon icon={faUpload} size={16} color='#fff' />
        )}
        <Text style={styles.uploadButtonText}>
          {uploading ? 'Uploading...' : buttonText}
        </Text>
      </TouchableOpacity>

      {/* File Preview */}
      {showPreview && selectedFile && (
        <View style={styles.filePreview}>
          <View style={styles.fileInfo}>
            <View style={styles.fileThumbnailContainer}>
              {isImageFile(selectedFile.name) &&
              selectedFile.uri &&
              !thumbnailError ? (
                <Image
                  source={{ uri: selectedFile.uri }}
                  style={styles.fileThumbnail}
                  resizeMode='cover'
                  onError={() => {
                    console.log(
                      'Failed to load thumbnail for:',
                      selectedFile.name
                    );
                    setThumbnailError(true);
                  }}
                />
              ) : (
                <View
                  style={[
                    styles.fileIconContainer,
                    {
                      backgroundColor: uploadResult
                        ? theme.colors.success + '20'
                        : getFileTypeColor(selectedFile.name) + '20',
                    },
                  ]}
                >
                  <FontAwesomeIcon
                    icon={
                      uploadResult
                        ? faCheckCircle
                        : getFileTypeIcon(selectedFile.name)
                    }
                    size={20}
                    color={
                      uploadResult
                        ? theme.colors.success
                        : getFileTypeColor(selectedFile.name)
                    }
                  />
                </View>
              )}

              {/* File type badge */}
              <View style={styles.fileTypeBadge}>
                <Text style={styles.fileTypeBadgeText}>
                  {getFileExtension(selectedFile.name).toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.fileDetails}>
              <Text style={styles.fileName}>{selectedFile.name}</Text>
              <Text style={styles.fileSize}>
                {getFileSizeDisplay(selectedFile.size || selectedFile.fileSize)}
              </Text>
              {uploadResult && (
                <Text style={styles.uploadStatus}>✓ Uploaded successfully</Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={removeSelectedFile}
          >
            <FontAwesomeIcon
              icon={faTimes}
              size={16}
              color={theme.colors.error}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Upload Options Modal */}
      <Modal
        visible={showOptions}
        transparent={true}
        animationType='fade'
        onRequestClose={() => setShowOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select File</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowOptions(false)}
              >
                <FontAwesomeIcon
                  icon={faTimes}
                  size={20}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.optionsContainer}>
              <TouchableOpacity style={styles.option} onPress={handleCamera}>
                <FontAwesomeIcon
                  icon={faCamera}
                  size={24}
                  color={theme.colors.primary}
                />
                <Text style={styles.optionText}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.option}
                onPress={handleImagePicker}
              >
                <FontAwesomeIcon
                  icon={faImage}
                  size={24}
                  color={theme.colors.primary}
                />
                <Text style={styles.optionText}>Photo Library</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.option}
                onPress={handleDocumentPicker}
              >
                <FontAwesomeIcon
                  icon={faFile}
                  size={24}
                  color={theme.colors.primary}
                />
                <Text style={styles.optionText}>Document</Text>
              </TouchableOpacity>
            </View>

            {/* File size and type info */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                Max file size: {Math.round(maxFileSize / (1024 * 1024))}MB
              </Text>
              {allowedTypes.length > 0 && (
                <Text style={styles.infoText}>
                  Supported: {allowedTypes.join(', ')}
                </Text>
              )}
              <Text
                style={[
                  styles.infoText,
                  { color: theme.colors.warning, marginTop: 8 },
                ]}
              >
                Note: If Document picker crashes, use Photo Library for images
                or Camera to capture documents
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      marginVertical: 10,
    },
    uploadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      ...theme.shadows.small,
    },
    disabledButton: {
      backgroundColor: theme.colors.border,
      opacity: 0.6,
    },
    uploadButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    filePreview: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.surface,
      padding: 12,
      borderRadius: 8,
      marginTop: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    fileInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    fileThumbnailContainer: {
      position: 'relative',
    },
    fileThumbnail: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: '#f8f9fa',
    },
    fileIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
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
    fileDetails: {
      marginLeft: 12,
      flex: 1,
    },
    fileName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    fileSize: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    uploadStatus: {
      fontSize: 12,
      color: theme.colors.success,
      marginTop: 2,
    },
    removeButton: {
      padding: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      width: '90%',
      maxWidth: 400,
      ...theme.shadows.large,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    closeButton: {
      padding: 4,
    },
    optionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 20,
    },
    option: {
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      backgroundColor: theme.colors.background,
      minWidth: 80,
    },
    optionText: {
      fontSize: 14,
      color: theme.colors.text,
      marginTop: 8,
      fontWeight: '500',
    },
    infoContainer: {
      backgroundColor: theme.colors.background,
      padding: 12,
      borderRadius: 8,
    },
    infoText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 4,
    },
  });

export default HomeworkFileUpload;
