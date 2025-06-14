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
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNotificationAPI } from '../hooks/useNotificationAPI';
import { Colors, Typography, Spacing } from '../styles/GlobalStyles';

const NotificationManager = ({ visible, onClose, userRole = 'staff' }) => {
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
            <Icon name='close' size={16} color={Colors.surface} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

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
            <Icon name='close' size={24} color={Colors.text} />
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
                  placeholderTextColor={Colors.textSecondary}
                />
                <TouchableOpacity
                  onPress={addRecipient}
                  style={styles.addButton}
                >
                  <Icon name='add' size={20} color={Colors.surface} />
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
              placeholderTextColor={Colors.textSecondary}
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
              placeholderTextColor={Colors.textSecondary}
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
              <ActivityIndicator size='small' color={Colors.surface} />
            ) : (
              <>
                <Icon name='send' size={20} color={Colors.surface} />
                <Text style={styles.sendButtonText}>Send Notification</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    ...Typography.heading2,
    color: Colors.text,
  },
  closeButton: {
    padding: Spacing.small,
  },
  content: {
    flex: 1,
    padding: Spacing.medium,
  },
  errorContainer: {
    backgroundColor: Colors.error,
    padding: Spacing.medium,
    borderRadius: 8,
    marginBottom: Spacing.medium,
  },
  errorText: {
    ...Typography.body2,
    color: Colors.surface,
  },
  formGroup: {
    marginBottom: Spacing.large,
  },
  label: {
    ...Typography.body1,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.small,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.medium,
    ...Typography.body1,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  messageInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.surface,
  },
  picker: {
    height: 50,
    color: Colors.text,
  },
  recipientInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipientInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.medium,
    ...Typography.body1,
    color: Colors.text,
    backgroundColor: Colors.surface,
    marginRight: Spacing.small,
  },
  addButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.medium,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipientChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.small,
  },
  recipientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.small,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: Spacing.small,
    marginBottom: Spacing.small,
  },
  recipientChipText: {
    ...Typography.caption,
    color: Colors.surface,
    marginRight: 4,
  },
  removeChipButton: {
    padding: 2,
  },
  footer: {
    padding: Spacing.medium,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.medium,
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  sendButtonText: {
    ...Typography.body1,
    fontWeight: '600',
    color: Colors.surface,
    marginLeft: Spacing.small,
  },
});

export default NotificationManager;
