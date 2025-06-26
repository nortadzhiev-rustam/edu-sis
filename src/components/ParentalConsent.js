import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faShieldAlt,
  faEnvelope,
  faCheck,
  faExclamationTriangle,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme, getLanguageFontSizes } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const ParentalConsent = ({
  studentData,
  onConsentGranted,
  onConsentDenied,
  onBack,
}) => {
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

  const [parentEmail, setParentEmail] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState('email'); // 'email', 'consent', 'verification'

  const styles = createStyles(theme, fontSizes);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailSubmit = () => {
    if (!parentEmail.trim()) {
      Alert.alert(t('error'), t('pleaseEnterParentEmail'));
      return;
    }

    if (!validateEmail(parentEmail)) {
      Alert.alert(t('error'), t('pleaseEnterValidEmail'));
      return;
    }

    setStep('consent');
  };

  const handleConsentSubmit = async () => {
    if (!consentGiven) {
      Alert.alert(t('error'), t('parentalConsentRequired'));
      return;
    }

    try {
      setIsSubmitting(true);

      // In a real implementation, this would send a verification email
      // and wait for parent confirmation
      const consentData = {
        studentId: studentData.id,
        studentName: studentData.name,
        parentEmail: parentEmail,
        consentTimestamp: new Date().toISOString(),
        dataCollectionConsent: true,
        communicationConsent: true,
        ipAddress: 'xxx.xxx.xxx.xxx', // Would be actual IP
      };

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setStep('verification');

      // Auto-proceed after showing verification message
      setTimeout(() => {
        onConsentGranted(consentData);
      }, 3000);
    } catch (error) {
      console.error('Parental consent error:', error);
      Alert.alert(t('error'), t('parentalConsentError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderEmailStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <FontAwesomeIcon
          icon={faEnvelope}
          size={32}
          color={theme.colors.primary}
        />
        <Text style={styles.stepTitle}>{t('parentEmailRequired')}</Text>
        <Text style={styles.stepDescription}>
          {t('parentEmailDescription')}
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('parentGuardianEmail')}</Text>
        <TextInput
          style={styles.textInput}
          value={parentEmail}
          onChangeText={setParentEmail}
          placeholder={t('enterParentEmail')}
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType='email-address'
          autoCapitalize='none'
          autoCorrect={false}
        />
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleEmailSubmit}
      >
        <Text style={styles.primaryButtonText}>{t('continue')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderConsentStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <FontAwesomeIcon
          icon={faShieldAlt}
          size={32}
          color={theme.colors.primary}
        />
        <Text style={styles.stepTitle}>{t('parentalConsentRequired')}</Text>
        <Text style={styles.stepDescription}>
          {t('parentalConsentDescription')}
        </Text>
      </View>

      <ScrollView
        style={styles.consentContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.consentSection}>
          <Text style={styles.consentTitle}>{t('dataCollectionNotice')}</Text>
          <Text style={styles.consentText}>
            {t('dataCollectionNoticeText')}
          </Text>
        </View>

        <View style={styles.consentSection}>
          <Text style={styles.consentTitle}>{t('dataUsage')}</Text>
          <Text style={styles.consentText}>{t('dataUsageText')}</Text>
        </View>

        <View style={styles.consentSection}>
          <Text style={styles.consentTitle}>{t('parentalRights')}</Text>
          <Text style={styles.consentText}>{t('parentalRightsText')}</Text>
        </View>

        <TouchableOpacity
          style={styles.consentCheckbox}
          onPress={() => setConsentGiven(!consentGiven)}
        >
          <View
            style={[styles.checkbox, consentGiven && styles.checkboxChecked]}
          >
            {consentGiven && (
              <FontAwesomeIcon icon={faCheck} size={12} color='#fff' />
            )}
          </View>
          <Text style={styles.consentCheckboxText}>
            {t('parentalConsentAgreement')}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setStep('email')}
        >
          <Text style={styles.secondaryButtonText}>{t('back')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, { flex: 1 }]}
          onPress={handleConsentSubmit}
          disabled={!consentGiven || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size='small' color='#fff' />
          ) : (
            <Text style={styles.primaryButtonText}>{t('grantConsent')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderVerificationStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <FontAwesomeIcon
          icon={faCheck}
          size={32}
          color={theme.colors.success}
        />
        <Text style={styles.stepTitle}>{t('consentGranted')}</Text>
        <Text style={styles.stepDescription}>
          {t('consentGrantedDescription')}
        </Text>
      </View>

      <View style={styles.verificationInfo}>
        <Text style={styles.verificationText}>
          {t('verificationEmailSent', { email: parentEmail })}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <FontAwesomeIcon
            icon={faArrowLeft}
            size={20}
            color={theme.colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('parentalConsent')}</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.progressIndicator}>
          <View
            style={[
              styles.progressStep,
              step !== 'email' && styles.progressStepCompleted,
            ]}
          />
          <View
            style={[
              styles.progressStep,
              step === 'verification' && styles.progressStepCompleted,
            ]}
          />
        </View>

        {step === 'email' && renderEmailStep()}
        {step === 'consent' && renderConsentStep()}
        {step === 'verification' && renderVerificationStep()}

        <View style={styles.footer}>
          <View style={styles.warningNotice}>
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              size={16}
              color={theme.colors.warning}
            />
            <Text style={styles.warningText}>{t('coppaComplianceNotice')}</Text>
          </View>
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: fontSizes.title,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    placeholder: {
      width: 36,
    },
    content: {
      flex: 1,
      padding: 24,
    },
    progressIndicator: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 32,
      gap: 8,
    },
    progressStep: {
      width: 40,
      height: 4,
      backgroundColor: theme.colors.border,
      borderRadius: 2,
    },
    progressStepCompleted: {
      backgroundColor: theme.colors.primary,
    },
    stepContent: {
      flex: 1,
    },
    stepHeader: {
      alignItems: 'center',
      marginBottom: 32,
    },
    stepTitle: {
      fontSize: fontSizes.title,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginTop: 16,
      marginBottom: 8,
      textAlign: 'center',
    },
    stepDescription: {
      fontSize: fontSizes.body,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
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
    textInput: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      fontSize: fontSizes.body,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    consentContent: {
      flex: 1,
      marginBottom: 24,
    },
    consentSection: {
      marginBottom: 24,
    },
    consentTitle: {
      fontSize: fontSizes.bodyLarge,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    consentText: {
      fontSize: fontSizes.body,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    consentCheckbox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: 16,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      marginTop: 2,
    },
    checkboxChecked: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    consentCheckboxText: {
      fontSize: fontSizes.body,
      color: theme.colors.text,
      flex: 1,
      lineHeight: 20,
    },
    buttonGroup: {
      flexDirection: 'row',
      gap: 16,
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButtonText: {
      fontSize: fontSizes.body,
      color: '#fff',
      fontWeight: '600',
    },
    secondaryButton: {
      backgroundColor: theme.colors.surface,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    secondaryButtonText: {
      fontSize: fontSizes.body,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    verificationInfo: {
      backgroundColor: theme.colors.successLight,
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
    },
    verificationText: {
      fontSize: fontSizes.body,
      color: theme.colors.text,
      textAlign: 'center',
      lineHeight: 20,
    },
    footer: {
      marginTop: 'auto',
    },
    warningNotice: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.colors.warningLight,
      padding: 16,
      borderRadius: 12,
    },
    warningText: {
      fontSize: fontSizes.bodySmall,
      color: theme.colors.textSecondary,
      marginLeft: 12,
      flex: 1,
      lineHeight: 18,
    },
  });

export default ParentalConsent;
