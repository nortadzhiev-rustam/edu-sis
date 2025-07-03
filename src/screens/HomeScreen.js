import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Config, buildWebUrl } from '../config/env';
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
  faTwitter,
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Absolute positioned Settings Button */}
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => navigation.navigate('SettingsScreen')}
      >
        <FontAwesomeIcon icon={faCog} size={20} color={theme.colors.text} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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
              onPress={() =>
                navigation.navigate('WebView', {
                  url: buildWebUrl(Config.WEB_ENDPOINTS.CALENDAR),
                  title: 'School Calendar',
                })
              }
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
              onPress={() =>
                navigation.navigate('WebView', {
                  url: buildWebUrl(Config.WEB_ENDPOINTS.ABOUT),
                  title: 'About Us',
                })
              }
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
              onPress={() =>
                navigation.navigate('WebView', {
                  url: buildWebUrl(Config.WEB_ENDPOINTS.CONTACTS),
                  title: 'Contact Us',
                })
              }
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
              onPress={() =>
                navigation.navigate('WebView', {
                  url: buildWebUrl(Config.WEB_ENDPOINTS.FAQ),
                  title: 'FAQ',
                })
              }
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
                <FontAwesomeIcon icon={faTwitter} size={18} color='#1DA1F2' />
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
      </ScrollView>
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
      marginTop: Platform.OS === 'android' ? 40 : 0,
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
      marginTop: isIPadDevice ? height * 0.03 : height * 0.05,
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
      marginBottom: 20,
      ...createSmallShadow(theme),
      marginLeft: 0,
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
      marginTop: 5,
      marginBottom: 10,
      alignSelf: 'flex-start',
    },
    resourcesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
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
      ...createSmallShadow(theme),
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
      marginTop: 20,
      marginBottom: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    socialMediaButton: {
      backgroundColor: '#007AFF',
      borderRadius: 25,
      paddingVertical: 12,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 15,
      alignSelf: 'center', // This should center it within the ScrollView
      ...createCustomShadow(theme, {
        height: 2,
        opacity: 0.2,
        radius: 3,
        elevation: 3,
      }),
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
      backgroundColor: '#f0f0f0',
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 10,
      ...createCustomShadow(theme, {
        height: 1,
        opacity: 0.1,
        radius: 2,
        elevation: 2,
      }),
    },
  });
