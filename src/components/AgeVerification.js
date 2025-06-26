import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faCalendarAlt,
  faChild,
  faShieldAlt,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme, getLanguageFontSizes } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const AgeVerification = ({ onAgeVerified, onCancel, userType = 'student' }) => {
  const { theme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const fontSizes = getLanguageFontSizes(currentLanguage);

  // Fallback function for missing translations
  const getText = (key, fallback) => {
    try {
      const translation = t(key);
      return translation || fallback;
    } catch (error) {
      console.warn(`Translation missing for key: ${key}`);
      return fallback;
    }
  };

  const [birthDate, setBirthDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const styles = createStyles(theme, fontSizes);

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || birthDate;
    setShowDatePicker(Platform.OS === 'ios');
    setBirthDate(currentDate);
  };

  const handleVerification = async () => {
    try {
      setIsVerifying(true);

      const age = calculateAge(birthDate);

      // Validate reasonable age ranges
      if (age < 3 || age > 100) {
        Alert.alert(
          getText('invalidAge', 'Invalid Age'),
          getText(
            'pleaseEnterValidBirthDate',
            'Please enter a valid birth date.'
          ),
          [{ text: getText('ok', 'OK') }]
        );
        return;
      }

      // Check if parental consent is required
      const requiresParentalConsent = age < 13;

      const verificationResult = {
        age,
        birthDate: birthDate.toISOString(),
        requiresParentalConsent,
        userType,
        timestamp: new Date().toISOString(),
      };

      if (requiresParentalConsent && userType === 'student') {
        Alert.alert(
          getText('parentalConsentRequired', 'Parental Consent Required'),
          getText(
            'parentalConsentRequiredMessage',
            'Users under 13 require parental consent to use this app.'
          ),
          [
            {
              text: getText('cancel', 'Cancel'),
              style: 'cancel',
              onPress: () => onCancel?.(),
            },
            {
              text: getText('continue', 'Continue'),
              onPress: () => onAgeVerified(verificationResult),
            },
          ]
        );
      } else {
        onAgeVerified(verificationResult);
      }
    } catch (error) {
      console.error('Age verification error:', error);
      Alert.alert(
        getText('error', 'Error'),
        getText(
          'ageVerificationError',
          'An error occurred during age verification. Please try again.'
        ),
        [{ text: getText('ok', 'OK') }]
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <FontAwesomeIcon
            icon={faShieldAlt}
            size={48}
            color={theme.colors.primary}
          />
          <Text style={styles.title}>
            {getText('ageVerification', 'Age Verification')}
          </Text>
          <Text style={styles.subtitle}>
            {getText(
              'ageVerificationDescription',
              'Please verify your age to ensure we provide appropriate content and comply with privacy regulations.'
            )}
          </Text>
        </View>

        {/* Age Verification Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {getText('birthDate', 'Birth Date')}
            </Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <FontAwesomeIcon
                icon={faCalendarAlt}
                size={20}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.dateText}>{formatDate(birthDate)}</Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              testID='dateTimePicker'
              value={birthDate}
              mode='date'
              display='default'
              onChange={handleDateChange}
              maximumDate={new Date()}
              minimumDate={new Date(1920, 0, 1)}
            />
          )}

          {/* Privacy Notice */}
          <View style={styles.privacyNotice}>
            <FontAwesomeIcon
              icon={faChild}
              size={16}
              color={theme.colors.warning}
            />
            <Text style={styles.privacyText}>
              {getText(
                'ageVerificationPrivacyNotice',
                'Your age information is used only for compliance with privacy laws and is not shared with third parties.'
              )}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
            disabled={isVerifying}
          >
            <Text style={styles.cancelButtonText}>
              {getText('cancel', 'Cancel')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.verifyButton]}
            onPress={handleVerification}
            disabled={isVerifying}
          >
            <Text style={styles.verifyButtonText}>
              {isVerifying
                ? getText('verifying', 'Verifying...')
                : getText('verify', 'Verify')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Legal Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            {getText(
              'ageVerificationDisclaimer',
              'By continuing, you confirm that the information provided is accurate.'
            )}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme, fontSizes) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      padding: 24,
      justifyContent: 'center',
    },
    header: {
      alignItems: 'center',
      marginBottom: 32,
    },
    title: {
      fontSize: fontSizes.title,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginTop: 16,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: fontSizes.body,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    form: {
      marginBottom: 32,
    },
    inputGroup: {
      marginBottom: 24,
    },
    label: {
      fontSize: fontSizes.body,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    dateInput: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    dateText: {
      fontSize: fontSizes.body,
      color: theme.colors.text,
      marginLeft: 12,
      flex: 1,
    },
    privacyNotice: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.colors.warningLight,
      padding: 16,
      borderRadius: 12,
      marginTop: 16,
    },
    privacyText: {
      fontSize: fontSizes.bodySmall,
      color: theme.colors.textSecondary,
      marginLeft: 12,
      flex: 1,
      lineHeight: 18,
    },
    actions: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 24,
    },
    button: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cancelButtonText: {
      fontSize: fontSizes.body,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    verifyButton: {
      backgroundColor: theme.colors.primary,
    },
    verifyButtonText: {
      fontSize: fontSizes.body,
      color: '#fff',
      fontWeight: '600',
    },
    disclaimer: {
      alignItems: 'center',
    },
    disclaimerText: {
      fontSize: fontSizes.caption,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 16,
    },
  });

export default AgeVerification;
