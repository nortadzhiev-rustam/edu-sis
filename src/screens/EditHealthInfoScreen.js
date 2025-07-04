import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faSave,
  faUser,
  faCommentMedical,
  faPills,
  faEye,
  faEar,
  faUtensils,
  faAllergies,
  faFirstAid,
  faPhone,
  faCalendarAlt,
  faPlus,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme, getLanguageFontSizes } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  getStudentHealthInfo,
  updateStudentHealthInfo,
  getHealthLookupData,
} from '../services/healthService';
import { createCustomShadow } from '../utils/commonStyles';

export default function EditHealthInfoScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { currentLanguage } = useLanguage();
  const fontSizes = getLanguageFontSizes(currentLanguage);
  const styles = createStyles(theme, fontSizes);

  const { authCode, studentId, userData } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [healthInfo, setHealthInfo] = useState({
    medical_condition: '',
    regularly_used_medication: '',
    vision_problem: '',
    vision_check_date: '',
    hearing_issue: '',
    food_consideration: '',
    allergy: '',
    allergy_symtoms: '',
    allergy_first_aid: '',
    allowed_medication: [],
    emergency_name_1: '',
    emergency_name_2: '',
    emergency_phone_1: '',
    emergency_phone_2: '',
  });
  const [lookupData, setLookupData] = useState(null);
  const [newMedication, setNewMedication] = useState('');

  useEffect(() => {
    loadHealthInfo();
    loadLookupData();
  }, []);

  const loadHealthInfo = async () => {
    try {
      setLoading(true);
      const response = await getStudentHealthInfo(authCode);
      if (response.success && response.data?.health_info) {
        const info = response.data.health_info;
        setHealthInfo({
          medical_condition: info.medical_conditions || '',
          regularly_used_medication: info.regularly_used_medication || '',
          vision_problem: info.has_vision_problem || '',
          vision_check_date: info.vision_check_date || '',
          hearing_issue: info.hearing_issue || '',
          food_consideration: info.special_food_consideration || '',
          allergy: info.allergies || '',
          allergy_symtoms: info.allergy_symtoms || '',
          allergy_first_aid: info.allergy_first_aid || '',
          allowed_medication: info.allowed_drugs
            ? info.allowed_drugs.split(',').filter((m) => m.trim())
            : [],
          emergency_name_1: info.emergency_name_1 || '',
          emergency_name_2: info.emergency_name_2 || '',
          emergency_phone_1: info.emergency_phone_1 || '',
          emergency_phone_2: info.emergency_phone_2 || '',
        });
      }
    } catch (error) {
      console.error('Error loading health info:', error);
      Alert.alert('Error', 'Failed to load health information');
    } finally {
      setLoading(false);
    }
  };

  const loadLookupData = async () => {
    try {
      const response = await getHealthLookupData(authCode);
      if (response.success && response.data) {
        setLookupData(response.data);
      }
    } catch (error) {
      console.error('Error loading lookup data:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setHealthInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addMedication = () => {
    if (newMedication.trim()) {
      setHealthInfo((prev) => ({
        ...prev,
        allowed_medication: [...prev.allowed_medication, newMedication.trim()],
      }));
      setNewMedication('');
    }
  };

  const removeMedication = (index) => {
    setHealthInfo((prev) => ({
      ...prev,
      allowed_medication: prev.allowed_medication.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Prepare data for API
      const updateData = {
        ...healthInfo,
        allowed_medication: healthInfo.allowed_medication,
      };

      const response = await updateStudentHealthInfo(
        authCode,
        studentId,
        updateData
      );

      if (response.success) {
        Alert.alert('Success', 'Health information updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', 'Failed to update health information');
      }
    } catch (error) {
      console.error('Error saving health info:', error);
      Alert.alert('Error', 'Failed to update health information');
    } finally {
      setSaving(false);
    }
  };

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

  const renderSection = (title, icon, children) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <FontAwesomeIcon icon={icon} size={18} color={theme.colors.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  const renderMedicationList = () => (
    <View style={styles.medicationContainer}>
      <Text style={styles.fieldLabel}>Allowed Medications</Text>

      {/* Add new medication */}
      <View style={styles.addMedicationContainer}>
        <View style={styles.inputContainer}>
          <FontAwesomeIcon
            icon={faPills}
            size={16}
            color={theme.colors.textSecondary}
          />
          <TextInput
            style={styles.textInput}
            value={newMedication}
            onChangeText={setNewMedication}
            placeholder='Add medication'
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={addMedication}>
          <FontAwesomeIcon icon={faPlus} size={16} color='#fff' />
        </TouchableOpacity>
      </View>

      {/* Medication list */}
      {healthInfo.allowed_medication.map((medication, index) => (
        <View key={index} style={styles.medicationItem}>
          <Text style={styles.medicationText}>{medication}</Text>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeMedication(index)}
          >
            <FontAwesomeIcon
              icon={faTimes}
              size={14}
              color={theme.colors.error}
            />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Health Info</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading health information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Health Info</Text>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size='small' color='#fff' />
          ) : (
            <FontAwesomeIcon icon={faSave} size={16} color='#fff' />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Medical Conditions Section */}
        {renderSection(
          'Medical Conditions',
          faCommentMedical,
          <>
            {renderFormField(
              'Medical Conditions',
              healthInfo.medical_condition,
              (value) => handleInputChange('medical_condition', value),
              'Enter medical conditions',
              faCommentMedical,
              true
            )}
            {renderFormField(
              'Regular Medication',
              healthInfo.regularly_used_medication,
              (value) => handleInputChange('regularly_used_medication', value),
              'Enter regular medications',
              faPills,
              true
            )}
          </>
        )}

        {/* Vision & Hearing Section */}
        {renderSection(
          'Vision & Hearing',
          faEye,
          <>
            {renderFormField(
              'Vision Problems',
              healthInfo.vision_problem,
              (value) => handleInputChange('vision_problem', value),
              'Any vision problems?',
              faEye
            )}
            {renderFormField(
              'Last Vision Check',
              healthInfo.vision_check_date,
              (value) => handleInputChange('vision_check_date', value),
              'YYYY-MM-DD',
              faCalendarAlt
            )}
            {renderFormField(
              'Hearing Issues',
              healthInfo.hearing_issue,
              (value) => handleInputChange('hearing_issue', value),
              'Any hearing issues?',
              faEar
            )}
          </>
        )}

        {/* Allergies & Food Section */}
        {renderSection(
          'Allergies & Food',
          faAllergies,
          <>
            {renderFormField(
              'Food Considerations',
              healthInfo.food_consideration,
              (value) => handleInputChange('food_consideration', value),
              'Special food considerations',
              faUtensils,
              true
            )}
            {renderFormField(
              'Allergies',
              healthInfo.allergy,
              (value) => handleInputChange('allergy', value),
              'Known allergies',
              faAllergies,
              true
            )}
            {renderFormField(
              'Allergy Symptoms',
              healthInfo.allergy_symtoms,
              (value) => handleInputChange('allergy_symtoms', value),
              'Symptoms of allergic reactions',
              faAllergies,
              true
            )}
            {renderFormField(
              'First Aid Instructions',
              healthInfo.allergy_first_aid,
              (value) => handleInputChange('allergy_first_aid', value),
              'Emergency first aid instructions',
              faFirstAid,
              true
            )}
            {renderMedicationList()}
          </>
        )}

        {/* Emergency Contacts Section */}
        {renderSection(
          'Emergency Contacts',
          faPhone,
          <>
            {renderFormField(
              'Primary Contact Name',
              healthInfo.emergency_name_1,
              (value) => handleInputChange('emergency_name_1', value),
              'Primary emergency contact',
              faUser
            )}
            {renderFormField(
              'Primary Contact Phone',
              healthInfo.emergency_phone_1,
              (value) => handleInputChange('emergency_phone_1', value),
              'Phone number',
              faPhone
            )}
            {renderFormField(
              'Secondary Contact Name',
              healthInfo.emergency_name_2,
              (value) => handleInputChange('emergency_name_2', value),
              'Secondary emergency contact',
              faUser
            )}
            {renderFormField(
              'Secondary Contact Phone',
              healthInfo.emergency_phone_2,
              (value) => handleInputChange('emergency_phone_2', value),
              'Phone number',
              faPhone
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme, fontSizes) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 12,
      ...createCustomShadow(theme, {
        height: 2,
        opacity: 0.1,
        radius: 4,
        elevation: 3,
      }),
    },
    backButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerTitle: {
      fontSize: fontSizes.large,
      fontWeight: '600',
      color: '#fff',
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 16,
    },
    headerRight: {
      width: 36,
    },
    saveButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    disabledButton: {
      opacity: 0.5,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loadingText: {
      fontSize: fontSizes.medium,
      color: theme.colors.textSecondary,
      marginTop: 12,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    section: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginBottom: 16,
      overflow: 'hidden',
      ...createCustomShadow(theme, {
        height: 1,
        opacity: 0.08,
        radius: 3,
        elevation: 2,
      }),
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primaryLight,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    sectionTitle: {
      fontSize: fontSizes.medium,
      fontWeight: '600',
      color: theme.colors.primary,
      marginLeft: 12,
    },
    sectionContent: {
      padding: 16,
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
      backgroundColor: theme.colors.background,
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
    medicationContainer: {
      marginTop: 8,
    },
    addMedicationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    addButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      padding: 12,
      marginLeft: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    medicationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.primaryLight,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 8,
    },
    medicationText: {
      fontSize: fontSizes.medium,
      color: theme.colors.primary,
      flex: 1,
    },
    removeButton: {
      padding: 4,
      borderRadius: 12,
      backgroundColor: 'rgba(255, 59, 48, 0.1)',
    },
  });
