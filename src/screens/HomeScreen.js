import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  Alert,
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
import {
  isIPad,
  isTablet,
  getIPadLayoutConfig,
  getResponsiveFontSizes,
  getResponsiveSpacing,
  getOptimalColumns,
} from '../utils/deviceDetection';
import { lockOrientationForDevice } from '../utils/orientationLock';
import { createSmallShadow, createCustomShadow } from '../utils/commonStyles';
import { updateCurrentUserLastLogin } from '../services/deviceService';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { theme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const fontSizes = getLanguageFontSizes(currentLanguage);
  // Lock orientation based on device type
  React.useEffect(() => {
    lockOrientationForDevice();
  }, []);

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
      // Check if teacher is already logged in
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedUserData = JSON.parse(userData);
        // Only navigate to teacher screen if the logged in user is a teacher
        if (parsedUserData.userType === 'teacher') {
          // Update last login timestamp when user opens the app
          console.log(
            '⏰ HOME: Updating last login for existing teacher user...'
          );
          try {
            const updateResult = await updateCurrentUserLastLogin();
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

          navigation.navigate('TeacherScreen', { userData: parsedUserData });
          return;
        }
      }
      // If not logged in or not a teacher, go to login screen with teacher type
      navigation.navigate('Login', { loginType: 'teacher' });
    } catch (error) {
      navigation.navigate('Login', { loginType: 'teacher' });
    }
  };

  const handleParentPress = async () => {
    // Navigate to parent screen - no login check needed as parents can add students later
    navigation.navigate('ParentScreen');
  };

  // Helper function to get all available user data for school resources
  const getAllUserData = async () => {
    const allUsers = [];

    try {
      // Check for direct login userData (teacher or student)
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        allUsers.push(user);
      }

      // Check for student accounts in parent system
      const studentAccountsStr = await AsyncStorage.getItem('studentAccounts');
      if (studentAccountsStr) {
        const studentAccounts = JSON.parse(studentAccountsStr);
        allUsers.push(...studentAccounts);
      }
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
      Alert.alert('Error', `Unable to access ${screenName}. Please try again.`);
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
      // Show login options on error
      Alert.alert('Login Required', 'Please log in to access the calendar.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Login as Teacher',
          onPress: () => navigation.navigate('Login', { loginType: 'teacher' }),
        },
        {
          text: 'Login as Student',
          onPress: () => navigation.navigate('Login', { loginType: 'student' }),
        },
      ]);
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
        <Image
          source={require('../../assets/app_logo.png')}
          style={styles.logo}
          resizeMode='contain'
        />

        <Text style={styles.title}>{t('welcomeTo')}</Text>
        <Image
          source={require('../../assets/EduNova School Logo.png')}
          style={styles.secondaryLogo}
          resizeMode='contain'
        />
        <Text style={styles.subtitle}>Choose your role to continue</Text>

        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          style={styles.buttonsContainer}
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
                {t('Access classes and grades')}
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
                {t('Monitor student progress')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Second row with additional buttons */}
          <Text style={styles.sectionTitle}>School Resources</Text>
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
              <Text style={styles.resourceText}>Calendar</Text>
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
              <Text style={styles.resourceText}>About Us</Text>
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
              <Text style={styles.resourceText}>Contact Us</Text>
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
              <Text style={styles.resourceText}>FAQ</Text>
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
              <Text style={styles.socialMediaText}>Connect With Us</Text>
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
                <FontAwesomeIcon icon={faXTwitter} size={18} color='#000000' />
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
      marginBottom: isIPadDevice ? responsiveSpacing.lg : 20,
      textAlign: 'center',
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
      padding: 15,
      marginBottom: 10,
      ...theme.shadows.small,
      marginLeft: 0,
      elevation: 5,
    },
    roleButtonHorizontal: {
      width: '48%',
      height: 160,
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
    },
    roleDescription: {
      fontSize: fontSizes.bodySmall,
      color: theme.colors.textSecondary,
      lineHeight: fontSizes.bodySmall + 2,
    },
    sectionTitle: {
      fontSize: fontSizes.subtitle,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 10,
      alignSelf: 'flex-start',
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
      padding: 12,
      marginBottom: 15,
      width: '48%',
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
  });
