import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  AccessibilityInfo,
  PixelRatio,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faChalkboardTeacher,
  faUserGraduate,
  faCalendarAlt,
  faInfoCircle,
  faEnvelope,
  faQuestionCircle,
  faShareAlt,
  faCog,
} from '@fortawesome/free-solid-svg-icons';
import {
  faFacebookF,
  faXTwitter,
  faInstagram,
  faYoutube,
} from '@fortawesome/free-brands-svg-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Platform } from 'expo-modules-core';
import { useTheme, getLanguageFontSizes } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import useThemeLogo, { useSchoolLogo } from '../hooks/useThemeLogo';
import {
  isIPad,
  getResponsiveFontSizes,
  getResponsiveSpacing,
} from '../utils/deviceDetection';
import { lockOrientationForDevice } from '../utils/orientationLock';
import { createSmallShadow, createMediumShadow } from '../utils/commonStyles';
import { updateCurrentUserLastLogin } from '../services/deviceService';
import {
  getValidatedUserData,
  getValidatedStudentAccounts,
  validateAndSanitizeAllData,
} from '../utils/dataValidation';
import {
  runHomescreenDiagnostics,
  generateUserFriendlyErrorMessage,
  logDiagnostics,
  clearAllUserData,
} from '../utils/homescreenDiagnostics';
import {
  wrapWithTimeout,
  usePerformanceMonitoring,
} from '../utils/performanceMonitor';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { theme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const fontSizes = getLanguageFontSizes(currentLanguage);
  const logoSource = useThemeLogo();
  const schoolLogoSource = useSchoolLogo();

  // iOS fallback state to ensure content appears
  const [contentVisible, setContentVisible] = React.useState(
    Platform.OS !== 'ios'
  );

  // Device state tracking for debugging
  const [deviceState, setDeviceState] = React.useState({
    reduceMotion: false,
    fontScale: 1.0,
    screenReader: false,
    debugInfo: '',
  });

  // Debug logging for iOS content visibility
  React.useEffect(() => {
    if (Platform.OS === 'ios') {
      console.log('🍎 iOS: Content visibility state changed:', contentVisible);
      console.log('🍎 iOS: Device state:', deviceState);
    }
  }, [contentVisible, deviceState]);

  // Use performance monitoring
  const { logMetrics } = usePerformanceMonitoring();

  // Comprehensive iOS accessibility and device state detection
  React.useEffect(() => {
    if (Platform.OS === 'ios') {
      console.log('🍎 iOS: Starting comprehensive device state detection...');

      const detectDeviceState = async () => {
        try {
          // Get device accessibility and performance info
          const [reduceMotion, screenReader] = await Promise.all([
            AccessibilityInfo.isReduceMotionEnabled(),
            AccessibilityInfo.isScreenReaderEnabled(),
          ]);

          const fontScale = PixelRatio.getFontScale();
          const pixelRatio = PixelRatio.get();

          // Create debug info string
          const debugInfo = `FontScale: ${fontScale}, PixelRatio: ${pixelRatio}, ReduceMotion: ${reduceMotion}, ScreenReader: ${screenReader}`;

          // Update device state
          const newDeviceState = {
            reduceMotion,
            fontScale,
            screenReader,
            debugInfo,
          };

          setDeviceState(newDeviceState);

          console.log('🍎 iOS: Device State Detection Results:');
          console.log(`- Reduce Motion: ${reduceMotion}`);
          console.log(`- Font Scale: ${fontScale}`);
          console.log(`- Screen Reader: ${screenReader}`);
          console.log(`- Pixel Ratio: ${pixelRatio}`);

          // Determine if we should skip animations and show content immediately
          const shouldSkipAnimation =
            reduceMotion || // User has Reduce Motion enabled
            fontScale > 1.3 || // User has large text enabled
            screenReader; // User has screen reader enabled

          if (shouldSkipAnimation) {
            console.log(
              '🍎 iOS: Accessibility settings detected - showing content immediately'
            );
            console.log(
              `- Reason: ${
                reduceMotion
                  ? 'Reduce Motion'
                  : fontScale > 1.3
                  ? 'Large Text'
                  : 'Screen Reader'
              }`
            );
            setContentVisible(true);
            return;
          }

          // If no accessibility issues, use progressive fallback timers
          console.log(
            '🍎 iOS: No accessibility issues detected - using fallback timers'
          );

          // Immediate fallback for performance issues
          const immediateTimer = setTimeout(() => {
            console.log('🍎 iOS: Immediate fallback (100ms) - showing content');
            setContentVisible(true);
          }, 100);

          // Secondary fallback
          const secondaryTimer = setTimeout(() => {
            console.log(
              '🍎 iOS: Secondary fallback (500ms) - ensuring content visibility'
            );
            setContentVisible(true);
          }, 500);

          // Final fallback
          const finalTimer = setTimeout(() => {
            console.log(
              '🍎 iOS: Final fallback (1500ms) - forcing content visibility'
            );
            setContentVisible(true);
          }, 1500);

          // Cleanup function
          return () => {
            clearTimeout(immediateTimer);
            clearTimeout(secondaryTimer);
            clearTimeout(finalTimer);
          };
        } catch (error) {
          console.error('🍎 iOS: Error detecting device state:', error);
          // Fallback to showing content immediately if detection fails
          setContentVisible(true);
        }
      };

      // Run detection
      const cleanup = detectDeviceState();

      // Return cleanup function if it exists
      return () => {
        if (cleanup && typeof cleanup.then === 'function') {
          cleanup.then((cleanupFn) => cleanupFn && cleanupFn());
        }
      };
    }
  }, []);

  // Lock orientation based on device type with iOS-specific handling
  React.useEffect(() => {
    const handleOrientationLock = async () => {
      try {
        if (Platform.OS === 'ios') {
          console.log('🍎 iOS: Setting up orientation lock with timeout...');
          // Use timeout protection for iOS orientation lock
          await wrapWithTimeout(
            lockOrientationForDevice,
            5000, // 5 second timeout for iOS
            'iOS Orientation Lock'
          );
        } else {
          await lockOrientationForDevice();
        }
      } catch (error) {
        console.warn('⚠️ HOME: Orientation lock failed:', error);
        // Continue without orientation lock on iOS
        if (Platform.OS === 'ios') {
          console.log('🍎 iOS: Continuing despite orientation lock failure');
        }
      }
    };

    handleOrientationLock();
  }, []);

  // Validate and sanitize data on component mount with timeout protection
  React.useEffect(() => {
    const validateData = async () => {
      try {
        console.log('🔍 HOME: Validating stored data on mount...');

        // Wrap validation with timeout protection
        const validationResults = await wrapWithTimeout(
          validateAndSanitizeAllData,
          15000, // 15 second timeout
          'Data Validation'
        );

        if (
          !validationResults.userData.valid &&
          !validationResults.studentAccounts.count
        ) {
          console.log('⚠️ HOME: No valid user data found');
        } else {
          console.log('✅ HOME: Data validation complete:', validationResults);
        }

        // Log performance metrics after validation
        logMetrics();
      } catch (error) {
        console.error('❌ HOME: Error during data validation:', error);

        // If validation times out or fails, continue anyway
        console.log('🔄 HOME: Continuing despite validation error...');
      }
    };

    validateData();
  }, []);

  // Diagnostic function for troubleshooting navigation issues
  const runDiagnostics = async () => {
    try {
      console.log('🔍 HOME: Running diagnostics...');
      const diagnostics = await runHomescreenDiagnostics();
      logDiagnostics(diagnostics);

      const userMessage = generateUserFriendlyErrorMessage(diagnostics);

      Alert.alert('Navigation Diagnostics', userMessage, [
        { text: 'OK', style: 'default' },
        {
          text: 'Clear Data & Restart',
          style: 'destructive',
          onPress: async () => {
            const cleared = await clearAllUserData();
            if (cleared) {
              Alert.alert(
                'Data Cleared',
                'All user data has been cleared. Please restart the app and log in again.',
                [{ text: 'OK' }]
              );
            } else {
              Alert.alert(
                'Error',
                'Failed to clear data. Please restart the app manually.'
              );
            }
          },
        },
      ]);
    } catch (error) {
      console.error('❌ HOME: Diagnostics failed:', error);
      Alert.alert(t('diagnosticsError'), t('unableToRunDiagnostics'));
    }
  };

  // iPad-specific configurations
  const isIPadDevice = isIPad();
  const responsiveFonts = getResponsiveFontSizes();
  const responsiveSpacing = getResponsiveSpacing();

  const styles = createStyles(
    theme,
    fontSizes,
    isIPadDevice,
    responsiveFonts,
    responsiveSpacing
  );

  const handleTeacherPress = async () => {
    try {
      console.log('👨‍🏫 HOME: Teacher button pressed, starting navigation...');

      // Use validated user data with timeout protection
      const userData = await wrapWithTimeout(
        getValidatedUserData,
        10000, // 10 second timeout
        'Get Teacher Data'
      );

      if (userData && userData.userType === 'teacher') {
        // Update last login timestamp when user opens the app
        console.log(
          '⏰ HOME: Updating last login for existing teacher user...'
        );
        try {
          // Wrap last login update with timeout
          const updateResult = await wrapWithTimeout(
            updateCurrentUserLastLogin,
            5000, // 5 second timeout
            'Update Last Login'
          );

          if (updateResult.success) {
            console.log('✅ HOME: Last login updated successfully');
          } else {
            console.warn(
              '⚠️ HOME: Failed to update last login:',
              updateResult.error
            );
            // Continue with navigation even if update fails
          }
        } catch (updateError) {
          console.error('❌ HOME: Error updating last login:', updateError);
          // Continue with navigation even if update fails
        }

        console.log('🚀 HOME: Navigating to teacher screen...');
        navigation.navigate('TeacherScreen', { userData });
        return;
      }

      // If not logged in or not a teacher, go to login screen with teacher type
      console.log('🔄 HOME: No valid teacher data found, redirecting to login');
      navigation.navigate('Login', { loginType: 'teacher' });
    } catch (error) {
      console.error('❌ HOME: Unexpected error in handleTeacherPress:', error);
      Alert.alert(
        'Navigation Error',
        'Unable to access teacher screen. This might be due to corrupted data.',
        [
          { text: 'Try Again', onPress: () => handleTeacherPress() },
          { text: 'Run Diagnostics', onPress: () => runDiagnostics() },
          {
            text: 'Go to Login',
            onPress: () =>
              navigation.navigate('Login', { loginType: 'teacher' }),
          },
        ]
      );
    }
  };

  const handleParentPress = async () => {
    try {
      // Navigate to parent screen - no login check needed as parents can add students later
      console.log('👨‍👩‍👧‍👦 HOME: Navigating to parent screen');
      navigation.navigate('ParentScreen');
    } catch (error) {
      console.error('❌ HOME: Error navigating to parent screen:', error);
      Alert.alert(
        'Navigation Error',
        'Unable to access parent screen. Please try again.',
        [
          { text: 'Try Again', onPress: () => handleParentPress() },
          { text: 'Run Diagnostics', onPress: () => runDiagnostics() },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  // Helper function to get all available user data for school resources
  const getAllUserData = async () => {
    const allUsers = [];

    try {
      // Use validated user data utilities
      const userData = await getValidatedUserData();
      if (userData) {
        allUsers.push(userData);
      }

      // Get validated student accounts
      const studentAccounts = await getValidatedStudentAccounts();
      allUsers.push(...studentAccounts);

      console.log(`📊 HOME: Found ${allUsers.length} valid user accounts`);
    } catch (error) {
      console.error('❌ HOME: Error getting user data:', error);
    }

    return allUsers;
  };

  // Helper function to determine which branches to show for school resources
  const getUniqueBranches = (users) => {
    const branchMap = new Map();

    users.forEach((user) => {
      const branchId =
        user.branch_id || user.branchId || user.branch?.branch_id;
      const branchName =
        user.branch_name || user.branchName || user.branch?.branch_name;

      if (branchId && branchName) {
        branchMap.set(branchId, {
          branchId,
          branchName,
          userType: user.userType,
          userName: user.name,
        });
      }
    });

    return Array.from(branchMap.values());
  };

  // Generic handler for school resources (About Us, Contacts, FAQ)
  const handleSchoolResourcePress = async (screenName) => {
    try {
      const allUsers = await getAllUserData();

      if (allUsers.length === 0) {
        // No user data found - show options
        Alert.alert(
          `Access ${screenName}`,
          'To view school information, you can either login directly or add a student account.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Add Student',
              onPress: () => navigation.navigate('ParentScreen'),
            },
            {
              text: 'Login as Teacher',
              onPress: () =>
                navigation.navigate('Login', { loginType: 'teacher' }),
            },
            {
              text: 'Login as Student',
              onPress: () =>
                navigation.navigate('Login', { loginType: 'student' }),
            },
          ]
        );
        return;
      }

      const uniqueBranches = getUniqueBranches(allUsers);

      console.log(
        `🏠 HOME: ${screenName} access - found ${uniqueBranches.length} unique branches:`,
        uniqueBranches.map((b) => `${b.branchName} (${b.userType})`)
      );

      // Navigate to the screen - the screen will handle showing data for all unique branches
      navigation.navigate(screenName);
    } catch (error) {
      console.error(`❌ HOME: Error accessing ${screenName}:`, error);
      Alert.alert(
        'Navigation Error',
        `Unable to access ${screenName}. This might be due to data issues.`,
        [
          {
            text: 'Try Again',
            onPress: () => handleSchoolResourcePress(screenName),
          },
          { text: 'Run Diagnostics', onPress: () => runDiagnostics() },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleCalendarPress = async () => {
    try {
      // Check for direct login userData first
      const userData = await AsyncStorage.getItem('userData');

      // Check for student accounts in parent system
      const studentAccountsStr = await AsyncStorage.getItem('studentAccounts');
      const selectedStudentStr = await AsyncStorage.getItem('selectedStudent');

      console.log('🏠 HOME: Calendar access check:', {
        hasUserData: !!userData,
        hasStudentAccounts: !!studentAccountsStr,
        hasSelectedStudent: !!selectedStudentStr,
      });

      // If there's direct login data, use it
      if (userData) {
        try {
          const userToUse = JSON.parse(userData);
          console.log('✅ HOME: Using direct login userData:', {
            userType: userToUse.userType,
            username: userToUse.username,
          });
          // Navigate to branch-only calendar from home screen
          navigation.navigate('Calendar', { mode: 'branch-only' });
          return;
        } catch (parseError) {
          console.error('❌ HOME: Error parsing userData:', parseError);
        }
      }

      // If no direct login, check for student accounts
      if (studentAccountsStr) {
        try {
          const studentAccounts = JSON.parse(studentAccountsStr);

          if (studentAccounts.length === 1) {
            // Only one student - use it directly (don't overwrite main userData)
            const student = studentAccounts[0];
            console.log('✅ HOME: Using single student account:', student.name);
            await AsyncStorage.setItem(
              'calendarUserData',
              JSON.stringify(student)
            );
            await AsyncStorage.setItem(
              'selectedStudent',
              JSON.stringify(student)
            );
            // Navigate to branch-only calendar from home screen
            navigation.navigate('Calendar', { mode: 'branch-only' });
            return;
          } else if (studentAccounts.length > 1) {
            // Multiple students - show picker
            Alert.alert(
              'Select Student',
              "Which student's calendar would you like to view?",
              [
                { text: 'Cancel', style: 'cancel' },
                ...studentAccounts.map((student) => ({
                  text: student.name,
                  onPress: async () => {
                    console.log(
                      '✅ HOME: Selected student for calendar:',
                      student.name
                    );
                    await AsyncStorage.setItem(
                      'userData',
                      JSON.stringify(student)
                    );
                    await AsyncStorage.setItem(
                      'selectedStudent',
                      JSON.stringify(student)
                    );
                    // Navigate to branch-only calendar from home screen
                    navigation.navigate('Calendar', { mode: 'branch-only' });
                  },
                })),
              ]
            );
            return;
          }
        } catch (parseError) {
          console.error('❌ HOME: Error parsing studentAccounts:', parseError);
        }
      }

      // If there's a previously selected student, use it (don't overwrite main userData)
      if (selectedStudentStr) {
        try {
          const selectedStudent = JSON.parse(selectedStudentStr);
          console.log(
            '✅ HOME: Using previously selected student:',
            selectedStudent.name
          );
          await AsyncStorage.setItem('calendarUserData', selectedStudentStr);
          // Navigate to branch-only calendar from home screen
          navigation.navigate('Calendar', { mode: 'branch-only' });
          return;
        } catch (parseError) {
          console.error('❌ HOME: Error parsing selectedStudent:', parseError);
        }
      }

      // No user data found - show options
      console.log(
        '❌ HOME: No user data found, showing login/add student options'
      );
      Alert.alert(
        'Access Calendar',
        'To view the calendar, you can either login directly or add a student account.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add Student',
            onPress: () => navigation.navigate('ParentScreen'),
          },
          {
            text: 'Login as Teacher',
            onPress: () =>
              navigation.navigate('Login', { loginType: 'teacher' }),
          },
          {
            text: 'Login as Student',
            onPress: () =>
              navigation.navigate('Login', { loginType: 'student' }),
          },
        ]
      );
    } catch (error) {
      console.error('❌ HOME: Error checking user data for calendar:', error);
      // Show enhanced error options
      Alert.alert(
        'Calendar Access Error',
        'Unable to access calendar. This might be due to data issues or missing login information.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Run Diagnostics', onPress: () => runDiagnostics() },
          {
            text: 'Login as Teacher',
            onPress: () =>
              navigation.navigate('Login', { loginType: 'teacher' }),
          },
          {
            text: 'Login as Student',
            onPress: () =>
              navigation.navigate('Login', { loginType: 'student' }),
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Hide status bar on Android in dark mode to match other screens */}
      <StatusBar
        style={
          Platform.OS === 'android' && theme.mode === 'dark' ? 'light' : 'auto'
        }
        hidden={Platform.OS === 'android' && theme.mode === 'dark'}
      />
      {/* Absolute positioned Settings Button */}
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => navigation.navigate('SettingsScreen')}
      >
        <FontAwesomeIcon icon={faCog} size={20} color={theme.colors.text} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Image source={logoSource} style={styles.logo} resizeMode='contain' />

        <Text style={styles.title}>{t('welcomeTo')}</Text>
        <Image
          source={schoolLogoSource}
          style={styles.secondaryLogo}
          resizeMode='contain'
        />
        <Text style={styles.subtitle}>{t('chooseYourRole')}</Text>

        {/* Debug info for iOS devices (only in development) */}
        {__DEV__ && Platform.OS === 'ios' && (
          <Text style={styles.debugText}>Debug: {deviceState.debugInfo}</Text>
        )}

        <Animated.View
          key={
            Platform.OS === 'ios'
              ? `ios-content-${contentVisible}-${deviceState.debugInfo}`
              : 'android-content'
          }
          entering={
            Platform.OS === 'ios'
              ? deviceState.reduceMotion || deviceState.fontScale > 1.3
                ? undefined // Skip animation for accessibility settings
                : FadeInDown.delay(0).springify() // No delay on iOS
              : FadeInDown.delay(300).springify()
          }
          style={[
            styles.buttonsContainer,
            Platform.OS === 'ios' && {
              opacity: contentVisible ? 1 : 0.3, // Minimum opacity to ensure visibility
              minHeight: deviceState.fontScale > 1.3 ? 500 : 400, // Adjust height for large fonts
            },
          ]}
        >
          {/* First row with Teacher and Parent cards */}
          <View style={styles.roleRow}>
            <TouchableOpacity
              style={[styles.roleButton, styles.roleButtonHorizontal]}
              onPress={handleTeacherPress}
            >
              <View style={[styles.iconContainer, styles.teacherIconContainer]}>
                <FontAwesomeIcon
                  icon={faChalkboardTeacher}
                  size={24}
                  color='#007AFF'
                />
              </View>
              <Text style={styles.roleText}>{t('teacher')}</Text>
              <Text style={styles.roleDescription} numberOfLines={2}>
                {t('teacherDescription')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleButton, styles.roleButtonHorizontal]}
              onPress={handleParentPress}
            >
              <View style={[styles.iconContainer, styles.parentIconContainer]}>
                <FontAwesomeIcon
                  icon={faUserGraduate}
                  size={24}
                  color='#FF9500'
                />
              </View>
              <Text style={styles.roleText}>{t('parent')}</Text>
              <Text style={styles.roleDescription} numberOfLines={2}>
                {t('parentDescription')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Second row with additional buttons */}
          <Text style={styles.sectionTitle}>{t('schoolResources')}</Text>
          <View style={styles.resourcesContainer}>
            <TouchableOpacity
              style={styles.resourceButton}
              onPress={handleCalendarPress}
            >
              <View
                style={[
                  styles.resourceIconContainer,
                  { backgroundColor: 'rgba(88, 86, 214, 0.1)' },
                ]}
              >
                <FontAwesomeIcon
                  icon={faCalendarAlt}
                  size={20}
                  color='#5856D6'
                />
              </View>
              <Text
                style={styles.resourceText}
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {t('calendar')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resourceButton}
              onPress={() => handleSchoolResourcePress('AboutUs')}
            >
              <View
                style={[
                  styles.resourceIconContainer,
                  { backgroundColor: 'rgba(52, 199, 89, 0.1)' },
                ]}
              >
                <FontAwesomeIcon
                  icon={faInfoCircle}
                  size={20}
                  color='#34C759'
                />
              </View>
              <Text
                style={styles.resourceText}
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {t('aboutUs')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resourceButton}
              onPress={() => handleSchoolResourcePress('Contacts')}
            >
              <View
                style={[
                  styles.resourceIconContainer,
                  { backgroundColor: 'rgba(255, 69, 58, 0.1)' },
                ]}
              >
                <FontAwesomeIcon icon={faEnvelope} size={20} color='#FF3B30' />
              </View>
              <Text
                style={styles.resourceText}
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {t('contactUs')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resourceButton}
              onPress={() => handleSchoolResourcePress('FAQ')}
            >
              <View
                style={[
                  styles.resourceIconContainer,
                  { backgroundColor: 'rgba(255, 149, 0, 0.1)' },
                ]}
              >
                <FontAwesomeIcon
                  icon={faQuestionCircle}
                  size={20}
                  color='#FF9500'
                />
              </View>
              <Text
                style={styles.resourceText}
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {t('faq')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Social Media Section */}
          <View style={styles.socialMediaSection}>
            <TouchableOpacity
              style={styles.socialMediaButton}
              onPress={() => alert('Connect with us on social media!')}
            >
              <View style={styles.socialMediaIconContainer}>
                <FontAwesomeIcon icon={faShareAlt} size={20} color='#fff' />
              </View>
              <Text style={styles.socialMediaText}>{t('connectWithUs')}</Text>
            </TouchableOpacity>

            <View style={styles.socialIconsRow}>
              <TouchableOpacity
                style={styles.socialIcon}
                onPress={() => alert('Facebook page coming soon!')}
              >
                <FontAwesomeIcon icon={faFacebookF} size={18} color='#3b5998' />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialIcon}
                onPress={() => alert('Twitter page coming soon!')}
              >
                <FontAwesomeIcon
                  icon={faXTwitter}
                  size={18}
                  color={theme.mode === 'dark' ? '#fff' : '#000000'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialIcon}
                onPress={() => alert('Instagram page coming soon!')}
              >
                <FontAwesomeIcon icon={faInstagram} size={18} color='#C13584' />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialIcon}
                onPress={() => alert('YouTube channel coming soon!')}
              >
                <FontAwesomeIcon icon={faYoutube} size={18} color='#FF0000' />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (
  theme,
  fontSizes,
  isIPadDevice,
  responsiveFonts,
  responsiveSpacing
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    settingsButton: {
      position: 'absolute',
      top: Platform.OS === 'android' ? 50 : 60,
      left: 20,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      ...createSmallShadow(theme),
    },
    scrollContainer: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: isIPadDevice ? responsiveSpacing.xl : 20,
      maxWidth: isIPadDevice ? 800 : '100%', // Limit content width on iPad
      alignSelf: 'center',
      width: '100%',
      paddingBottom: 10, // Extra padding for landscape scrolling
      minHeight: '100%', // Ensure content takes full height
    },
    logo: {
      width: isIPadDevice ? Math.min(width * 0.3, 300) : width * 0.4,
      height: isIPadDevice ? Math.min(height * 0.12, 150) : height * 0.15,
      // marginTop: isIPadDevice ? height * 0.03 : height * 0.001,
      marginBottom: isIPadDevice ? responsiveSpacing.lg : 20,
      ...createMediumShadow(theme),
    },
    secondaryLogo: {
      width: isIPadDevice ? Math.min(width * 0.2, 200) : width * 0.3,
      height: isIPadDevice ? Math.min(height * 0.08, 50) : height * 0.05,
    },
    title: {
      fontSize: isIPadDevice ? responsiveFonts.largeTitle : fontSizes.title,
      fontWeight: 'bold',
      color: theme.colors.text,

      textAlign: 'center',
    },
    subtitle: {
      fontSize: isIPadDevice ? responsiveFonts.subtitle : fontSizes.body,
      color: theme.colors.textSecondary,
      marginBottom: isIPadDevice ? responsiveSpacing.lg : 10,
      textAlign: 'center',
      lineHeight: fontSizes.bodyLineHeight,
    },
    buttonsContainer: {
      width: '100%',
      alignItems: 'center',
    },
    roleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginBottom: 5,
    },
    roleButton: {
      backgroundColor: theme.colors.surface,
      borderRadius: 15,
      paddingHorizontal: 15,
      paddingVertical: 10,
      marginBottom: 10,
      ...theme.shadows.small,
      marginLeft: 0,
      elevation: 5,
    },
    roleButtonHorizontal: {
      width: '48%',
      height: 150,
    },
    iconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    teacherIconContainer: {
      backgroundColor: 'rgba(0, 122, 255, 0.1)',
    },
    parentIconContainer: {
      backgroundColor: 'rgba(255, 149, 0, 0.1)',
    },
    roleText: {
      fontSize: fontSizes.body,
      fontWeight: '600',
      color: theme.colors.text,
      lineHeight: fontSizes.bodyLineHeight,
    },
    roleDescription: {
      fontSize: fontSizes.bodySmall,
      color: theme.colors.textSecondary,
      lineHeight: fontSizes.bodySmallLineHeight,
    },
    sectionTitle: {
      fontSize: fontSizes.subtitle,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 5,
      alignSelf: 'flex-start',
      lineHeight: fontSizes.subtitleLineHeight,
    },
    resourcesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between', // Works well for 4 items (2x2 grid)
      width: '100%',
    },
    resourceButton: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 15,
      marginBottom: 15,
      width: '48%',
      minHeight: 70,
      flexDirection: 'row',
      alignItems: 'center',
      ...theme.shadows.small,
      elevation: 5,
    },
    resourceIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    resourceText: {
      fontSize: fontSizes.body,
      fontWeight: '500',
      color: theme.colors.text,
      lineHeight: fontSizes.bodyLineHeight,
      flex: 1,
      textAlign: 'left',
    },
    socialMediaSection: {
      width: '100%',
      marginTop: 10,
      marginBottom: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    socialMediaButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 25,
      paddingVertical: 12,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 15,
      alignSelf: 'center', // This should center it within the ScrollView
      ...theme.shadows.small,
    },
    socialMediaIconContainer: {
      marginRight: 10,
    },
    socialMediaText: {
      color: '#fff',
      fontSize: fontSizes.body,
      fontWeight: '600',
      lineHeight: fontSizes.bodyLineHeight,
    },
    socialIconsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      width: '100%',
    },
    socialIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 10,
      ...theme.shadows.small,
    },
    debugText: {
      fontSize: 10,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 10,
      paddingHorizontal: 20,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
  });
