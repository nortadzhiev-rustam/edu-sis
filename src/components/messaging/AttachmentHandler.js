import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faPaperclip,
  faCamera,
  faImage,
  faFile,
  faTimes,
  faDownload,
} from '@fortawesome/free-solid-svg-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../../contexts/ThemeContext';
import { uploadMessageAttachment } from '../../services/messagingService';

const AttachmentHandler = ({
  onAttachmentSelected,
  onAttachmentUploaded,
  disabled = false,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
}) => {
  const { theme, fontSizes } = useTheme();
  const styles = createStyles(theme, fontSizes);

  const [showOptions, setShowOptions] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  // Handle image selection from gallery
  const handleImagePicker = async () => {
    setShowOptions(false);

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        // Check file size
        if (asset.fileSize && asset.fileSize > maxFileSize) {
          Alert.alert(
            'File Too Large',
            `Please select an image smaller than ${Math.round(
              maxFileSize / (1024 * 1024)
            )}MB`
          );
          return;
        }

        await handleFileUpload(asset);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
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
        await handleFileUpload(asset);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  // Handle document selection
  const handleDocumentPicker = async () => {
    setShowOptions(false);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

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

        await handleFileUpload(asset);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to select document');
    }
  };

  // Handle file upload
  const handleFileUpload = async (file) => {
    try {
      setUploading(true);

      // Notify parent component about selection
      onAttachmentSelected?.(file);

      // Create FormData for upload
      const formData = new FormData();
      formData.append('attachment', {
        uri: file.uri,
        type: file.mimeType || 'application/octet-stream',
        name: file.name || 'attachment',
      });

      // Upload file
      const response = await uploadMessageAttachment(formData);

      if (response.success && response.data) {
        onAttachmentUploaded?.(response.data);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      Alert.alert(
        'Upload Failed',
        'Failed to upload attachment. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  // Open attachment URL
  const openAttachment = (url) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open attachment');
    });
  };

  // Render attachment options modal
  const renderOptionsModal = () => (
    <Modal
      visible={showOptions}
      transparent
      animationType='fade'
      onRequestClose={() => setShowOptions(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Attachment</Text>
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

            <TouchableOpacity style={styles.option} onPress={handleImagePicker}>
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
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <TouchableOpacity
        style={[styles.attachButton, disabled && styles.disabledButton]}
        onPress={() => !disabled && !uploading && setShowOptions(true)}
        disabled={disabled || uploading}
      >
        {uploading ? (
          <ActivityIndicator size='small' color={theme.colors.textSecondary} />
        ) : (
          <FontAwesomeIcon
            icon={faPaperclip}
            size={18}
            color={disabled ? theme.colors.textSecondary : theme.colors.primary}
          />
        )}
      </TouchableOpacity>

      {renderOptionsModal()}
    </>
  );
};

const createStyles = (theme, fontSizes) => {
  // Safety check for fontSizes
  const safeFontSizes = fontSizes || {
    small: 12,
    medium: 16,
    large: 20,
  };

  return StyleSheet.create({
    attachButton: {
      padding: 8,
      borderRadius: 20,
    },
    disabledButton: {
      opacity: 0.5,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 20,
      width: '80%',
      maxWidth: 300,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: safeFontSizes.large,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    closeButton: {
      padding: 4,
    },
    optionsContainer: {
      gap: 16,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.background,
      borderRadius: 8,
    },
    optionText: {
      marginLeft: 16,
      fontSize: safeFontSizes.medium,
      color: theme.colors.text,
      fontWeight: '500',
    },
  });
};

export default AttachmentHandler;
