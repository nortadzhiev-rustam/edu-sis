import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faCalendarAlt,
  faClock,
  faUser,
  faCommentMedical,
  faFirstAid,
  faThermometerHalf,
  faPills,
  faCommentDots,
  faChevronDown,
  faTimes,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme, getLanguageFontSizes } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { createCustomShadow } from '../../utils/commonStyles';

export default function CreateHealthRecordForm({
  recordType = 'student', // 'student', 'staff', 'guest'
  availableUsers = [],
  lookupData = null,
  onSubmit,
  onCancel,
  initialData = null,
  isEditing = false,
}) {
  const { theme } = useTheme();
  const { currentLanguage } = useLanguage();
  const fontSizes = getLanguageFontSizes(currentLanguage);
  const styles = createStyles(theme, fontSizes);

  const [formData, setFormData] = useState({
    // Common fields
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    reason: '',
    action: '',
    temperature: '',
    medication: '',
    comments: '',

    // Student/Staff specific
    user_id: null,
    student_id: null,
    parent_contact_time: '',

    // Guest specific
    name: '',

    ...initialData,
  });

  const [showUserPicker, setShowUserPicker] = useState(false);
  const [showReasonPicker, setShowReasonPicker] = useState(false);
  const [showActionPicker, setShowActionPicker] = useState(false);
  const [showMedicationPicker, setShowMedicationPicker] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    // Validate required fields
    const requiredFields =
      recordType === 'guest'
        ? ['name', 'date', 'time', 'reason']
        : ['user_id', 'date', 'time', 'reason'];

    for (const field of requiredFields) {
      if (!formData[field]) {
        Alert.alert(
          'Validation Error',
          `${field.replace('_', ' ')} is required`
        );
        return;
      }
    }

    // Prepare data for submission
    const submitData = { ...formData };
    if (recordType === 'student') {
      submitData.student_id = formData.user_id;
      delete submitData.user_id;
    }

    onSubmit(submitData);
  };

  const renderUserPicker = () => (
    <Modal visible={showUserPicker} transparent animationType='slide'>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Select {recordType === 'student' ? 'Student' : 'Staff Member'}
            </Text>
            <TouchableOpacity onPress={() => setShowUserPicker(false)}>
              <FontAwesomeIcon
                icon={faTimes}
                size={20}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          </View>
          <FlatList
            data={availableUsers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.pickerItem}
                onPress={() => {
                  handleInputChange('user_id', item.id);
                  setShowUserPicker(false);
                }}
              >
                <Text style={styles.pickerItemText}>{item.name}</Text>
                {item.email && (
                  <Text style={styles.pickerItemSubtext}>{item.email}</Text>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  const renderLookupPicker = (title, data, onSelect, visible, setVisible) => (
    <Modal visible={visible} transparent animationType='slide'>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select {title}</Text>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <FontAwesomeIcon
                icon={faTimes}
                size={20}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          </View>
          <FlatList
            data={data}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.pickerItem}
                onPress={() => {
                  onSelect(item.value);
                  setVisible(false);
                }}
              >
                <Text style={styles.pickerItemText}>{item.value}</Text>
                {item.description && (
                  <Text style={styles.pickerItemSubtext}>
                    {item.description}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  const renderFormField = (
    label,
    value,
    onChangeText,
    placeholder,
    icon,
    multiline = false
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputContainer}>
        <FontAwesomeIcon
          icon={icon}
          size={16}
          color={theme.colors.textSecondary}
        />
        <TextInput
          style={[styles.textInput, multiline && styles.multilineInput]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
        />
      </View>
    </View>
  );

  const renderPickerField = (label, value, placeholder, icon, onPress) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity style={styles.pickerContainer} onPress={onPress}>
        <FontAwesomeIcon
          icon={icon}
          size={16}
          color={theme.colors.textSecondary}
        />
        <Text style={[styles.pickerText, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
        <FontAwesomeIcon
          icon={faChevronDown}
          size={14}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );

  const getSelectedUserName = () => {
    const user = availableUsers.find((u) => u.id === formData.user_id);
    return user ? user.name : '';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* User Selection for Student/Staff */}
      {recordType !== 'guest' &&
        renderPickerField(
          recordType === 'student' ? 'Student *' : 'Staff Member *',
          getSelectedUserName(),
          `Select ${recordType}`,
          faUser,
          () => setShowUserPicker(true)
        )}

      {/* Guest Name */}
      {recordType === 'guest' &&
        renderFormField(
          'Guest Name *',
          formData.name,
          (value) => handleInputChange('name', value),
          'Enter guest name',
          faUser
        )}

      {/* Date and Time */}
      <View style={styles.rowContainer}>
        {renderFormField(
          'Date *',
          formData.date,
          (value) => handleInputChange('date', value),
          'YYYY-MM-DD',
          faCalendarAlt
        )}
        {renderFormField(
          'Time *',
          formData.time,
          (value) => handleInputChange('time', value),
          'HH:MM',
          faClock
        )}
      </View>

      {/* Reason */}
      {lookupData?.injuries
        ? renderPickerField(
            'Reason *',
            formData.reason,
            'Select reason for visit',
            faCommentMedical,
            () => setShowReasonPicker(true)
          )
        : renderFormField(
            'Reason *',
            formData.reason,
            (value) => handleInputChange('reason', value),
            'Reason for visit',
            faCommentMedical,
            true
          )}

      {/* Action */}
      {lookupData?.actions
        ? renderPickerField(
            'Action Taken',
            formData.action,
            'Select action taken',
            faFirstAid,
            () => setShowActionPicker(true)
          )
        : renderFormField(
            'Action Taken',
            formData.action,
            (value) => handleInputChange('action', value),
            'Action taken',
            faFirstAid,
            true
          )}

      {/* Temperature */}
      {renderFormField(
        'Temperature',
        formData.temperature,
        (value) => handleInputChange('temperature', value),
        'e.g., 37.5°C',
        faThermometerHalf
      )}

      {/* Medication */}
      {lookupData?.medications
        ? renderPickerField(
            'Medication',
            formData.medication,
            'Select medication given',
            faPills,
            () => setShowMedicationPicker(true)
          )
        : renderFormField(
            'Medication',
            formData.medication,
            (value) => handleInputChange('medication', value),
            'Medication given',
            faPills
          )}

      {/* Parent Contact Time (Students only) */}
      {recordType === 'student' &&
        renderFormField(
          'Parent Contact Time',
          formData.parent_contact_time,
          (value) => handleInputChange('parent_contact_time', value),
          'HH:MM',
          faClock
        )}

      {/* Comments */}
      {renderFormField(
        'Comments',
        formData.comments,
        (value) => handleInputChange('comments', value),
        'Additional comments',
        faCommentDots,
        true
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <FontAwesomeIcon icon={faCheck} size={16} color='#fff' />
          <Text style={styles.submitButtonText}>
            {isEditing ? 'Update' : 'Create'} Record
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      {renderUserPicker()}
      {lookupData?.injuries &&
        renderLookupPicker(
          'Reason',
          lookupData.injuries,
          (value) => handleInputChange('reason', value),
          showReasonPicker,
          setShowReasonPicker
        )}
      {lookupData?.actions &&
        renderLookupPicker(
          'Action',
          lookupData.actions,
          (value) => handleInputChange('action', value),
          showActionPicker,
          setShowActionPicker
        )}
      {lookupData?.medications &&
        renderLookupPicker(
          'Medication',
          lookupData.medications,
          (value) => handleInputChange('medication', value),
          showMedicationPicker,
          setShowMedicationPicker
        )}
    </ScrollView>
  );
}

const createStyles = (theme, fontSizes) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: theme.colors.background,
    },
    fieldContainer: {
      marginBottom: 16,
    },
    fieldLabel: {
      fontSize: fontSizes.medium,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    textInput: {
      flex: 1,
      fontSize: fontSizes.medium,
      color: theme.colors.text,
      marginLeft: 12,
      minHeight: 20,
    },
    multilineInput: {
      minHeight: 60,
      textAlignVertical: 'top',
    },
    pickerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    pickerText: {
      flex: 1,
      fontSize: fontSizes.medium,
      color: theme.colors.text,
      marginLeft: 12,
    },
    placeholderText: {
      color: theme.colors.textSecondary,
    },
    rowContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 24,
      marginBottom: 32,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      marginRight: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: fontSizes.medium,
      color: theme.colors.text,
      fontWeight: '600',
    },
    submitButton: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      marginLeft: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitButtonText: {
      fontSize: fontSizes.medium,
      color: '#fff',
      fontWeight: '600',
      marginLeft: 8,
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
      width: '90%',
      maxHeight: '70%',
      ...createCustomShadow(theme, {
        height: 4,
        opacity: 0.2,
        radius: 8,
        elevation: 8,
      }),
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalTitle: {
      fontSize: fontSizes.large,
      fontWeight: '600',
      color: theme.colors.text,
    },
    pickerItem: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    pickerItemText: {
      fontSize: fontSizes.medium,
      color: theme.colors.text,
      fontWeight: '500',
    },
    pickerItemSubtext: {
      fontSize: fontSizes.small,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
  });
