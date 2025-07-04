import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faSave,
  faHeartbeat,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme, getLanguageFontSizes } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  createStudentHealthRecord,
  createStaffHealthRecord,
  createGuestHealthRecord,
  getHealthLookupData,
  getTeacherHealthData,
} from '../services/healthService';
import { sendHealthNotification } from '../services/notificationService';
import { CreateHealthRecordForm } from '../components/health';
import { createCustomShadow } from '../utils/commonStyles';

export default function CreateHealthRecordScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { currentLanguage } = useLanguage();
  const fontSizes = getLanguageFontSizes(currentLanguage);
  const styles = createStyles(theme, fontSizes);

  const { authCode, recordType, userData } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lookupData, setLookupData] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadLookupData(),
        loadAvailableUsers(),
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert('Error', 'Failed to load form data. Please try again.');
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

  const loadAvailableUsers = async () => {
    try {
      if (recordType === 'guest') return; // No users needed for guest records

      const response = await getTeacherHealthData(authCode);
      if (response.success && response.data) {
        if (recordType === 'student') {
          setAvailableUsers(response.data.students || []);
        } else if (recordType === 'staff') {
          setAvailableUsers(response.data.staff || []);
        }
      }
    } catch (error) {
      console.error('Error loading available users:', error);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setSaving(true);
      
      let response;
      let notificationData = {
        type: `${recordType}_visit`,
        priority: 'normal',
        data: formData,
      };

      // Create the health record based on type
      switch (recordType) {
        case 'student':
          response = await createStudentHealthRecord(authCode, formData);
          notificationData.student_id = formData.student_id;
          notificationData.title = 'Student Health Visit';
          notificationData.message = `Health visit recorded for student: ${formData.reason}`;
          break;
        
        case 'staff':
          response = await createStaffHealthRecord(authCode, formData);
          notificationData.staff_id = formData.user_id;
          notificationData.title = 'Staff Health Visit';
          notificationData.message = `Health visit recorded for staff member: ${formData.reason}`;
          break;
        
        case 'guest':
          response = await createGuestHealthRecord(authCode, formData);
          notificationData.guest_name = formData.name;
          notificationData.title = 'Guest Health Visit';
          notificationData.message = `Health visit recorded for guest ${formData.name}: ${formData.reason}`;
          break;
        
        default:
          throw new Error('Invalid record type');
      }

      if (response.success) {
        // Send notification about the health record creation
        try {
          await sendHealthNotification(notificationData);
        } catch (notificationError) {
          console.warn('Failed to send health notification:', notificationError);
          // Don't fail the whole operation if notification fails
        }

        // Check if this is a high-priority case that needs emergency alert
        if (shouldSendEmergencyAlert(formData)) {
          try {
            await sendEmergencyHealthAlert(formData, recordType);
          } catch (emergencyError) {
            console.warn('Failed to send emergency alert:', emergencyError);
          }
        }

        Alert.alert(
          'Success', 
          `${recordType.charAt(0).toUpperCase() + recordType.slice(1)} health record created successfully`,
          [
            { 
              text: 'OK', 
              onPress: () => navigation.goBack() 
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to create health record');
      }
    } catch (error) {
      console.error('Error creating health record:', error);
      Alert.alert('Error', 'Failed to create health record. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const shouldSendEmergencyAlert = (formData) => {
    // Check for emergency keywords in reason or comments
    const emergencyKeywords = [
      'emergency', 'urgent', 'severe', 'critical', 'allergy', 'allergic reaction',
      'unconscious', 'bleeding', 'fracture', 'head injury', 'chest pain',
      'difficulty breathing', 'seizure', 'anaphylaxis'
    ];
    
    const textToCheck = `${formData.reason} ${formData.comments}`.toLowerCase();
    return emergencyKeywords.some(keyword => textToCheck.includes(keyword));
  };

  const sendEmergencyHealthAlert = async (formData, recordType) => {
    const emergencyData = {
      emergency_type: 'health_incident',
      severity: 'moderate', // Could be determined by keywords
      description: `${formData.reason}. ${formData.comments || ''}`,
      location: 'School Health Office',
    };

    if (recordType === 'student') {
      emergencyData.student_id = formData.student_id;
    }

    // Import and use the emergency alert function
    const { sendEmergencyHealthAlert } = await import('../services/notificationService');
    return await sendEmergencyHealthAlert(emergencyData);
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel',
      'Are you sure you want to cancel? All entered data will be lost.',
      [
        { text: 'Continue Editing', style: 'cancel' },
        { text: 'Cancel', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

  const getScreenTitle = () => {
    switch (recordType) {
      case 'student':
        return 'Create Student Health Record';
      case 'staff':
        return 'Create Staff Health Record';
      case 'guest':
        return 'Create Guest Health Record';
      default:
        return 'Create Health Record';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{getScreenTitle()}</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading form data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
          <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getScreenTitle()}</Text>
        <View style={styles.headerRight}>
          {saving && <ActivityIndicator size="small" color="#fff" />}
        </View>
      </View>

      <CreateHealthRecordForm
        recordType={recordType}
        availableUsers={availableUsers}
        lookupData={lookupData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </SafeAreaView>
  );
}

const createStyles = (theme, fontSizes) => StyleSheet.create({
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
    fontSize: fontSizes.headerTitle,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    width: 36,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: fontSizes.body,
    color: theme.colors.textSecondary,
    marginTop: 12,
  },
});
