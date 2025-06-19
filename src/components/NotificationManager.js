/**
 * Notification Manager Component
 * Allows staff to send notifications to students
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faTimes,
  faPlus,
  faPaperPlane,
} from '@fortawesome/free-solid-svg-icons';
import { useNotificationAPI } from '../hooks/useNotificationAPI';
import { useTheme } from '../contexts/ThemeContext';

const NotificationManager = ({ visible, onClose, userRole = 'staff' }) => {
  const { theme } = useTheme();
  const {
    loading,
    error,
    sendNotificationMessage,
    fetchCategories,
    sendAnnouncement,
    sendEmergencyNotification,
    clearError,
  } = useNotificationAPI();

  const [formData, setFormData] = useState({
    type: 'all',
    title: '',
    message: '',
    priority: 'normal',
    category: 'announcement',
    recipients: [],
  });

  const [categories, setCategories] = useState([]);
  const [recipientInput, setRecipientInput] = useState('');

  useEffect(() => {
    if (visible) {
      loadCategories();
      clearError();
    }
  }, [visible]);

  const loadCategories = async () => {
    try {
      const response = await fetchCategories();
      if (response?.success) {
        setCategories(response.data || []);
      }
    } catch (err) {
      // Error loading categories
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addRecipient = () => {
    if (recipientInput.trim()) {
      const newRecipients = recipientInput
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id && !formData.recipients.includes(id));

      setFormData((prev) => ({
        ...prev,
        recipients: [...prev.recipients, ...newRecipients],
      }));
      setRecipientInput('');
    }
  };

  const removeRecipient = (recipientToRemove) => {
    setFormData((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((id) => id !== recipientToRemove),
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return false;
    }
    if (!formData.message.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return false;
    }
    if (
      (formData.type === 'single' || formData.type === 'classroom') &&
      formData.recipients.length === 0
    ) {
      Alert.alert('Error', 'Please add recipients for this notification type');
      return false;
    }
    return true;
  };

  const handleSendNotification = async () => {
    if (!validateForm()) return;

    try {
      let response;

      if (formData.priority === 'high' && formData.category === 'emergency') {
        response = await sendEmergencyNotification(
          formData.title,
          formData.message,
          formData.type
        );
      } else if (formData.category === 'announcement') {
        response = await sendAnnouncement(
          formData.title,
          formData.message,
          formData.type,
          formData.priority,
          formData.recipients
        );
      } else {
        response = await sendNotificationMessage(formData);
      }

      if (response?.success) {
        Alert.alert('Success', 'Notification sent successfully!');
        resetForm();
        onClose();
      } else {
        Alert.alert(
          'Error',
          response?.message || 'Failed to send notification'
        );
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to send notification');
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'all',
      title: '',
      message: '',
      priority: 'normal',
      category: 'announcement',
      recipients: [],
    });
    setRecipientInput('');
  };

  const renderRecipientChips = () => (
    <View style={styles.recipientChips}>
      {formData.recipients.map((recipient, index) => (
        <View key={index} style={styles.recipientChip}>
          <Text style={styles.recipientChipText}>{recipient}</Text>
          <TouchableOpacity
            onPress={() => removeRecipient(recipient)}
            style={styles.removeChipButton}
          >
            <FontAwesomeIcon
              icon={faTimes}
              size={16}
              color={theme.colors.headerText}
            />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  const styles = createStyles(theme);

  if (userRole !== 'staff' && userRole !== 'admin') {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Send Notification</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <FontAwesomeIcon
              icon={faTimes}
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Notification Type */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Notification Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.type}
                onValueChange={(value) => handleInputChange('type', value)}
                style={styles.picker}
              >
                <Picker.Item label='All Users' value='all' />
                <Picker.Item label='Single User' value='single' />
                <Picker.Item label='Classroom' value='classroom' />
                <Picker.Item label='Staff Only' value='staff' />
              </Picker>
            </View>
          </View>

          {/* Recipients (for single/classroom) */}
          {(formData.type === 'single' || formData.type === 'classroom') && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Recipients (User IDs)</Text>
              <View style={styles.recipientInputContainer}>
                <TextInput
                  style={styles.recipientInput}
                  value={recipientInput}
                  onChangeText={setRecipientInput}
                  placeholder='Enter user IDs separated by commas'
                  placeholderTextColor={theme.colors.textSecondary}
                />
                <TouchableOpacity
                  onPress={addRecipient}
                  style={styles.addButton}
                >
                  <FontAwesomeIcon
                    icon={faPlus}
                    size={20}
                    color={theme.colors.headerText}
                  />
                </TouchableOpacity>
              </View>
              {formData.recipients.length > 0 && renderRecipientChips()}
            </View>
          )}

          {/* Title */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(value) => handleInputChange('title', value)}
              placeholder='Enter notification title'
              placeholderTextColor={theme.colors.textSecondary}
              maxLength={100}
            />
          </View>

          {/* Message */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Message</Text>
            <TextInput
              style={[styles.input, styles.messageInput]}
              value={formData.message}
              onChangeText={(value) => handleInputChange('message', value)}
              placeholder='Enter notification message'
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>

          {/* Priority */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Priority</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.priority}
                onValueChange={(value) => handleInputChange('priority', value)}
                style={styles.picker}
              >
                <Picker.Item label='Low' value='low' />
                <Picker.Item label='Normal' value='normal' />
                <Picker.Item label='High' value='high' />
              </Picker>
            </View>
          </View>

          {/* Category */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
                style={styles.picker}
              >
                <Picker.Item label='Announcement' value='announcement' />
                <Picker.Item label='Grade' value='grade' />
                <Picker.Item label='Attendance' value='attendance' />
                <Picker.Item label='Homework' value='homework' />
                <Picker.Item label='Emergency' value='emergency' />
                {categories.map((category) => (
                  <Picker.Item
                    key={category.id}
                    label={category.name}
                    value={category.slug}
                  />
                ))}
              </Picker>
            </View>
          </View>
        </ScrollView>

        {/* Send Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.sendButton, loading && styles.disabledButton]}
            onPress={handleSendNotification}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size='small' color={theme.colors.headerText} />
            ) : (
              <>
                <FontAwesomeIcon
                  icon={faPaperPlane}
                  size={20}
                  color={theme.colors.headerText}
                />
                <Text style={styles.sendButtonText}>Send Notification</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    closeButton: {
      padding: 8,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    errorContainer: {
      backgroundColor: theme.colors.error,
      padding: 16,
      borderRadius: 8,
      marginBottom: 16,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.headerText,
    },
    formGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      padding: 16,
      fontSize: 16,
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
    },
    messageInput: {
      height: 100,
      textAlignVertical: 'top',
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      backgroundColor: theme.colors.surface,
    },
    picker: {
      height: 50,
      color: theme.colors.text,
    },
    recipientInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    recipientInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      padding: 16,
      fontSize: 16,
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
      marginRight: 8,
    },
    addButton: {
      backgroundColor: theme.colors.primary,
      padding: 16,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    recipientChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 8,
    },
    recipientChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 16,
      marginRight: 8,
      marginBottom: 8,
    },
    recipientChipText: {
      fontSize: 12,
      color: theme.colors.headerText,
      marginRight: 4,
    },
    removeChipButton: {
      padding: 2,
    },
    footer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    sendButton: {
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
      borderRadius: 8,
    },
    disabledButton: {
      opacity: 0.6,
    },
    sendButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.headerText,
      marginLeft: 8,
    },
  });

export default NotificationManager;
