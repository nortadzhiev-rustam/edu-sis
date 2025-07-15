import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceToken } from '../utils/messaging';
import { logDeviceInfo } from '../utils/deviceInfo';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import {
  teacherLogin,
  studentLogin,
  saveUserData,
} from '../services/authService';

import { Config } from '../config/env';
import {
  checkComplianceStatus,
  validateComplianceForAccess,
} from '../services/familiesPolicyService';
import { useTheme, getLanguageFontSizes } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import useThemeLogo from '../hooks/useThemeLogo';
import { createSmallShadow } from '../utils/commonStyles';
import AgeVerification from '../components/AgeVerification';
import ParentalConsent from '../components/ParentalConsent';
import { updateLastLogin } from '../services/deviceService';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const fontSizes = getLanguageFontSizes(currentLanguage);
  const logoSource = useThemeLogo();

  // Get login type from route params or default to teacher
  const routeLoginType = route.params?.loginType;
  const isAddingStudent = route.params?.isAddingStudent || false;

  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [deviceToken, setDeviceToken] = useState('');

  // Login type state (teacher or student)
  const [loginType, setLoginType] = useState(routeLoginType || 'teacher');

  // Families policy compliance state
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [showParentalConsent, setShowParentalConsent] = useState(false);
  const [pendingUserData, setPendingUserData] = useState(null);

  const styles = createStyles(theme, fontSizes);

  useEffect(() => {
    // Get device token and log device info when component mounts
    const fetchDeviceToken = async () => {
      try {
        // Log device information for debugging
        await logDeviceInfo();

        // Get device token
        const token = await getDeviceToken();
        setDeviceToken(token || '');

        console.log(
          '📱 LOGIN: Device token initialized:',
          token ? 'available' : 'not available'
        );

        if (!token) {
          console.warn(
            '⚠️ LOGIN: No device token available, login may still work'
          );
          // Don't block login if device token is not available
          // The API should handle missing device tokens gracefully
        }
      } catch (error) {
        console.error('❌ LOGIN: Failed to get device token:', error);
        console.log('🔄 LOGIN: Proceeding without device token');
        // Set empty token to allow login attempt
        setDeviceToken('');
      }
    };

    fetchDeviceToken();
  }, []);

  // Handle login based on selected type
  const handleUserLogin = async (username, password) => {
    setLoading(true);

    try {
      let userData;

      if (loginType === 'teacher') {
        userData = await teacherLogin(username, password, deviceToken);
      } else {
        userData = await studentLogin(username, password, deviceToken);
      }

      setLoading(false);
      return userData;
    } catch (error) {
      setLoading(false);
      Alert.alert(t('error'), t('networkError'));
      return null;
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert(t('error'), 'Please enter both username and password');
      return;
    }

    const userData = await handleUserLogin(username, password);

    // Debug: Log what we received from login
    console.log('🔍 LOGIN DEBUG: userData received:', userData);
    console.log('🔍 LOGIN DEBUG: userData type:', typeof userData);
    console.log('🔍 LOGIN DEBUG: userData is null:', userData === null);
    console.log(
      '🔍 LOGIN DEBUG: userData has error:',
      userData && userData.error
    );

    if (userData && !userData.error) {
      // Handle successful login

      // If adding a student account
      if (isAddingStudent) {
        // Save to student accounts list
        try {
          const existingStudentsJSON = await AsyncStorage.getItem(
            'studentAccounts'
          );
          const existingStudents = existingStudentsJSON
            ? JSON.parse(existingStudentsJSON)
            : [];

          // Check if student already exists (prevent duplicates)
          const studentExists = existingStudents.some(
            (student) =>
              student.id === userData.id ||
              student.username === userData.username ||
              (student.authCode && student.authCode === userData.authCode)
          );

          if (studentExists) {
            Alert.alert(
              t('duplicateStudent'),
              'This student account has already been added.'
            );
            return;
          }

          // Add the new student account
          existingStudents.push(userData);

          // Save updated list
          await AsyncStorage.setItem(
            'studentAccounts',
            JSON.stringify(existingStudents)
          );

          // Update last login timestamp for the newly added student
          console.log(
            '⏰ LOGIN: Updating last login for newly added student...'
          );
          try {
            const authCode = userData.authCode || userData.auth_code;
            if (authCode) {
              const updateResult = await updateLastLogin(authCode);
              if (updateResult.success) {
                console.log(
                  '✅ LOGIN: Last login updated successfully for new student'
                );
              } else {
                console.warn(
                  '⚠️ LOGIN: Failed to update last login for new student:',
                  updateResult.error
                );
                // Continue with navigation even if update fails
              }
            } else {
              console.warn('⚠️ LOGIN: No auth code found for new student');
            }
          } catch (updateError) {
            console.error(
              '❌ LOGIN: Error updating last login for new student:',
              updateError
            );
            // Continue with navigation even if update fails
          }

          // Note: FCM token remains active for all users on device
          // Backend will handle user-specific notification routing
          console.log(
            '✅ STUDENT ADD: Student added, FCM remains active for notifications'
          );

          // Navigate back to parent screen
          Alert.alert(t('success'), 'Student account added successfully');
          navigation.goBack();
        } catch (error) {
          Alert.alert('Error', 'Failed to save student account');
        }
      } else {
        // Normal login flow - check families policy compliance first
        await handleComplianceCheck(userData);

        // Note: FCM token remains active, backend handles user-specific routing
        console.log(
          '✅ LOGIN: User logged in, notifications will be routed by backend'
        );
      }
    } else {
      // Handle login failure with detailed error information
      let errorMessage = `Incorrect ${loginType} ID or password!`;

      if (userData && userData.error) {
        console.log('🔍 LOGIN DEBUG: Error details received:', userData);

        // Provide more specific error messages based on error type
        switch (userData.errorType) {
          case 'TypeError':
            errorMessage =
              'Network connection error. Please check your internet connection.';
            break;
          case 'NetworkError':
            errorMessage =
              'Unable to connect to server. Please try again later.';
            break;
          case 'TimeoutError':
            errorMessage =
              'Connection timeout. Please check your internet connection and try again.';
            break;
          default:
            errorMessage = `Login failed: ${
              userData.errorMessage || 'Unknown error'
            }`;
        }

        // Log detailed error for debugging
        console.error('🚨 LOGIN FAILURE DETAILS:', {
          errorType: userData.errorType,
          errorMessage: userData.errorMessage,
          errorCode: userData.errorCode,
          timestamp: userData.timestamp,
          loginType,
          username: username ? 'provided' : 'missing',
          deviceToken: deviceToken ? 'available' : 'missing',
        });
      }

      Alert.alert('Login Failed', errorMessage);
    }
  };

  // Handle families policy compliance checking
  const handleComplianceCheck = async (userData) => {
    try {
      // For teachers, skip compliance check
      if (userData.userType === 'teacher') {
        await proceedWithLogin(userData);
        return;
      }

      // For students, check compliance status
      const compliance = await checkComplianceStatus(userData.id);

      if (!compliance.isCompliant) {
        setPendingUserData(userData);

        if (compliance.reason === 'age_verification_required') {
          setShowAgeVerification(true);
          return;
        }

        if (compliance.reason === 'parental_consent_required') {
          setShowParentalConsent(true);
          return;
        }
      }

      // User is compliant, proceed with login
      await proceedWithLogin(userData);
    } catch (error) {
      console.error('Compliance check error:', error);
      // In case of error, proceed with login but log the issue
      await proceedWithLogin(userData);
    }
  };

  // Proceed with normal login flow after compliance is verified
  const proceedWithLogin = async (userData) => {
    try {
      // Save user data to AsyncStorage
      await saveUserData(userData, AsyncStorage);

      // Update last login timestamp after successful login
      console.log(
        '⏰ LOGIN: Updating last login timestamp after successful login...'
      );
      try {
        const authCode = userData.authCode || userData.auth_code;
        if (authCode) {
          const updateResult = await updateLastLogin(authCode);
          if (updateResult.success) {
            console.log('✅ LOGIN: Last login updated successfully');
          } else {
            console.warn(
              '⚠️ LOGIN: Failed to update last login:',
              updateResult.error
            );
            // Continue with navigation even if update fails
          }
        } else {
          console.warn(
            '⚠️ LOGIN: No auth code found in user data for last login update'
          );
        }
      } catch (updateError) {
        console.error('❌ LOGIN: Error updating last login:', updateError);
        // Continue with navigation even if update fails
      }

      // Navigate to appropriate screen based on user type
      if (userData.userType === 'teacher') {
        navigation.replace('TeacherScreen', { userData });
      } else if (userData.userType === 'student') {
        // For direct student login, navigate to home screen
        console.log(
          '✅ STUDENT LOGIN: Student logged in successfully, navigating to home'
        );
        Alert.alert(
          'Login Successful',
          `Welcome ${userData.name}! You can now access the calendar and other school resources.`,
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('Home'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Login completion error:', error);
      Alert.alert('Error', 'Failed to complete login process');
    }
  };

  // Handle age verification completion
  const handleAgeVerified = async (verificationResult) => {
    try {
      const { storeAgeVerification } = await import(
        '../services/familiesPolicyService'
      );
      await storeAgeVerification(verificationResult);

      setShowAgeVerification(false);

      // Check if parental consent is required
      if (verificationResult.requiresParentalConsent) {
        setShowParentalConsent(true);
      } else {
        // Age verified and no parental consent needed, proceed
        await proceedWithLogin(pendingUserData);
        setPendingUserData(null);
      }
    } catch (error) {
      console.error('Age verification error:', error);
      Alert.alert('Error', 'Failed to verify age. Please try again.');
    }
  };

  // Handle parental consent completion
  const handleConsentGranted = async (consentData) => {
    try {
      const { storeParentalConsent } = await import(
        '../services/familiesPolicyService'
      );
      await storeParentalConsent(consentData);

      setShowParentalConsent(false);

      // Consent granted, proceed with login
      await proceedWithLogin(pendingUserData);
      setPendingUserData(null);
    } catch (error) {
      console.error('Parental consent error:', error);
      Alert.alert(
        'Error',
        'Failed to process parental consent. Please try again.'
      );
    }
  };

  // Handle compliance flow cancellation
  const handleComplianceCancel = () => {
    setShowAgeVerification(false);
    setShowParentalConsent(false);
    setPendingUserData(null);
    setLoading(false);
  };

  // Show age verification screen
  if (showAgeVerification) {
    return (
      <AgeVerification
        onAgeVerified={handleAgeVerified}
        onCancel={handleComplianceCancel}
        userType={pendingUserData?.userType || 'student'}
      />
    );
  }

  // Show parental consent screen
  if (showParentalConsent) {
    return (
      <ParentalConsent
        studentData={pendingUserData}
        onConsentGranted={handleConsentGranted}
        onConsentDenied={handleComplianceCancel}
        onBack={() => {
          setShowParentalConsent(false);
          setShowAgeVerification(true);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesomeIcon icon={faArrowLeft} size={20} color='#007AFF' />
        </TouchableOpacity>
        <Animated.Image
          source={logoSource}
          style={styles.logo}
          resizeMode='contain'
        />

        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          style={styles.formContainer}
        >
          <Text style={styles.title}>
            {isAddingStudent
              ? 'Add Student Account'
              : routeLoginType
              ? `${t(routeLoginType)} ${t('login')}`
              : t('login')}
          </Text>

          {/* Login Type Selector - only show if not coming from a specific route */}
          {!routeLoginType && (
            <View style={styles.loginTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.loginTypeButton,
                  loginType === 'teacher' && styles.activeLoginType,
                ]}
                onPress={() => setLoginType('teacher')}
              >
                <Text
                  style={[
                    styles.loginTypeText,
                    loginType === 'teacher' && styles.activeLoginTypeText,
                  ]}
                >
                  {t('teacher')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.loginTypeButton,
                  loginType === 'student' && styles.activeLoginType,
                ]}
                onPress={() => setLoginType('student')}
              >
                <Text
                  style={[
                    styles.loginTypeText,
                    loginType === 'student' && styles.activeLoginTypeText,
                  ]}
                >
                  {t('student')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TextInput
            style={styles.input}
            placeholder={loginType === 'teacher' ? 'Teacher ID' : 'Student ID'}
            placeholderTextColor={theme.colors.textLight}
            value={username}
            onChangeText={setUsername}
            autoCapitalize='none'
          />

          <TextInput
            style={styles.input}
            placeholder={t('password')}
            placeholderTextColor={theme.colors.textLight}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color='#fff' size='small' />
            ) : (
              <Text style={styles.loginButtonText}>
                {`${t(loginType)} ${t('login')}`}
              </Text>
            )}
          </TouchableOpacity>

          {/* Debug Information for App Review */}
          {Config.DEV.ENABLE_DEBUG_MODE && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugTitle}>Debug Info (App Review)</Text>
              <Text style={styles.debugText}>
                API URL: {Config.API_BASE_URL}
              </Text>
              <Text style={styles.debugText}>
                Device Token: {deviceToken ? 'Available' : 'Not Available'}
              </Text>
              <Text style={styles.debugText}>Platform: {Platform.OS}</Text>
              <Text style={styles.debugText}>
                Dummy Data: {Config.DEV.USE_DUMMY_DATA ? 'Enabled' : 'Disabled'}
              </Text>
              <Text style={styles.debugText}>
                Network Timeout: {Config.NETWORK.TIMEOUT}ms
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>{t('forgotPassword')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme, fontSizes) =>
  StyleSheet.create({
    scrollContainer: {
      flexGrow: 1,
      alignItems: 'center',
    },
    backButton: {
      position: 'absolute',
      top: 40,
      left: 20,
      zIndex: 10,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    logo: {
      width: width * 0.3,
      height: height * 0.15,
      marginTop: height * 0.1,
    },
    formContainer: {
      width: '100%',
      paddingHorizontal: 30,
      marginTop: height * 0.05,
    },
    title: {
      fontSize: fontSizes.title,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 30,
      textAlign: 'center',
      fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
    },
    input: {
      width: '100%',
      height: 50,
      backgroundColor: theme.colors.surface,
      borderRadius: 10,
      marginBottom: 15,
      paddingHorizontal: 15,
      fontSize: fontSizes.body,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    loginButton: {
      width: '100%',
      height: 50,
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 15,
      ...createSmallShadow(theme),
    },
    loginButtonText: {
      color: '#fff',
      fontSize: fontSizes.buttonText,
      fontWeight: '600',
    },
    forgotPassword: {
      marginTop: 15,
      alignItems: 'center',
    },
    forgotPasswordText: {
      color: theme.colors.primary,
      fontSize: fontSizes.bodySmall,
    },
    loginTypeContainer: {
      flexDirection: 'row',
      marginBottom: 20,
      borderRadius: 10,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    loginTypeButton: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
    },
    activeLoginType: {
      backgroundColor: theme.colors.primary,
    },
    loginTypeText: {
      fontSize: fontSizes.body,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
    activeLoginTypeText: {
      color: '#fff',
    },
    debugContainer: {
      marginTop: 20,
      padding: 15,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    debugTitle: {
      fontSize: fontSizes.small,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 8,
    },
    debugText: {
      fontSize: fontSizes.small,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
  });
