import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faCog,
  faLanguage,
  faCheck,
  faChevronRight,
  faMoon,
  faSun,
  faInfo,
  faBell,
  faBellSlash,
  faVolumeUp,
  faMobile,
  faGraduationCap,
  faClipboardCheck,
  faBook,
  faGavel,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSchoolLogo } from '../hooks/useThemeLogo';
import { Config } from '../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export default function SettingsScreen({ navigation }) {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { currentLanguage, changeLanguage, t, languages } = useLanguage();
  const schoolLogoSource = useSchoolLogo();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    enabled: true,
    sound: true,
    vibration: true,
    showPreviews: true,
    categories: {
      grades: true,
      attendance: true,
      homework: true,
      behavior: true,
      announcements: true,
      emergency: true,
    },
  });

  // Load notification settings on component mount
  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('notificationSettings');
      if (savedSettings) {
        setNotificationSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const saveNotificationSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem(
        'notificationSettings',
        JSON.stringify(newSettings)
      );
      setNotificationSettings(newSettings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const toggleNotificationSetting = (key, categoryKey = null) => {
    const newSettings = { ...notificationSettings };

    if (categoryKey) {
      newSettings.categories[categoryKey] =
        !newSettings.categories[categoryKey];
    } else {
      newSettings[key] = !newSettings[key];
    }

    saveNotificationSettings(newSettings);
  };

  const requestNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive important updates.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => Notifications.openSettingsAsync(),
            },
          ]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  };

  const handleNotificationToggle = async (enabled) => {
    if (enabled) {
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        return; // Don't enable if permission denied
      }
    }

    toggleNotificationSetting('enabled');
  };

  const styles = createStyles(theme);

  const handleLanguageSelect = async (languageCode) => {
    if (isChangingLanguage || languageCode === currentLanguage) {
      return;
    }

    try {
      setIsChangingLanguage(true);

      // Close modal first
      setShowLanguageModal(false);

      // Wait for modal animation to complete
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Change language
      await changeLanguage(languageCode);
    } catch (error) {
      console.error('Error in handleLanguageSelect:', error);
    } finally {
      setIsChangingLanguage(false);
    }
  };

  const showAboutInfo = () => {
    setShowAboutModal(true);
  };

  const LanguageModal = () => (
    <Modal
      visible={showLanguageModal}
      transparent={true}
      animationType='fade'
      onRequestClose={() => setShowLanguageModal(false)}
      statusBarTranslucent={false}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('language')}</Text>
            <TouchableOpacity
              onPress={() => setShowLanguageModal(false)}
              style={styles.modalCloseButton}
            >
              <FontAwesomeIcon
                icon={faArrowLeft}
                size={18}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.languageList}
            showsVerticalScrollIndicator={false}
          >
            {Object.values(languages).map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageItem,
                  currentLanguage === language.code &&
                    styles.selectedLanguageItem,
                ]}
                onPress={() => handleLanguageSelect(language.code)}
                disabled={isChangingLanguage}
              >
                <View style={styles.languageInfo}>
                  <Text style={styles.languageFlag}>{language.flag}</Text>
                  <View style={styles.languageText}>
                    <Text
                      style={[
                        styles.languageName,
                        currentLanguage === language.code &&
                          styles.selectedLanguageName,
                      ]}
                    >
                      {language.name}
                    </Text>
                    <Text
                      style={[
                        styles.languageNative,
                        currentLanguage === language.code &&
                          styles.selectedLanguageNative,
                      ]}
                    >
                      {language.nativeName}
                    </Text>
                  </View>
                </View>
                {currentLanguage === language.code && !isChangingLanguage && (
                  <View style={styles.checkIconContainer}>
                    <FontAwesomeIcon
                      icon={faCheck}
                      size={18}
                      color={theme.colors.primary}
                    />
                  </View>
                )}
                {isChangingLanguage && (
                  <ActivityIndicator
                    size='small'
                    color={theme.colors.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const AboutModal = () => (
    <Modal
      visible={showAboutModal}
      transparent={true}
      animationType='fade'
      onRequestClose={() => setShowAboutModal(false)}
      statusBarTranslucent={false}
    >
      <TouchableOpacity
        style={styles.aboutModalOverlay}
        activeOpacity={1}
        onPress={() => setShowAboutModal(false)}
      >
        <TouchableOpacity
          style={styles.aboutModalContent}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* EduNova School Logo */}
          <Image
            source={schoolLogoSource}
            style={styles.aboutLogo}
            resizeMode='contain'
          />

          {/* App Information */}
          <View style={styles.aboutInfo}>
            <Text style={styles.aboutVersion}>
              {t('version')}: {Config.APP.VERSION}
            </Text>
            <Text style={styles.aboutDeveloper}>
              Developed by EduNova Myanmar
            </Text>
          </View>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.aboutCloseButton}
            onPress={() => setShowAboutModal(false)}
          >
            <Text style={styles.aboutCloseText}>{t('ok')}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesomeIcon
            icon={faArrowLeft}
            size={18}
            color={theme.colors.headerText}
          />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <FontAwesomeIcon
            icon={faCog}
            size={20}
            color={theme.colors.headerText}
          />
          <Text style={styles.headerTitle}>{t('settings')}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('theme')}</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View
                style={[
                  styles.settingIcon,
                  { backgroundColor: theme.colors.warning + '15' },
                ]}
              >
                <FontAwesomeIcon
                  icon={isDarkMode ? faMoon : faSun}
                  size={20}
                  color={theme.colors.warning}
                />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>
                  {isDarkMode ? t('darkMode') : t('lightMode')}
                </Text>
                <Text style={styles.settingSubtitle}>
                  {isDarkMode ? 'Dark theme enabled' : 'Light theme enabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary + '50',
              }}
              thumbColor={
                isDarkMode ? theme.colors.primary : theme.colors.surface
              }
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          {/* Master notification toggle */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View
                style={[
                  styles.settingIcon,
                  { backgroundColor: theme.colors.primary + '15' },
                ]}
              >
                <FontAwesomeIcon
                  icon={notificationSettings.enabled ? faBell : faBellSlash}
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingSubtitle}>
                  {notificationSettings.enabled ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={notificationSettings.enabled}
              onValueChange={handleNotificationToggle}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary + '50',
              }}
              thumbColor={
                notificationSettings.enabled
                  ? theme.colors.primary
                  : theme.colors.surface
              }
            />
          </View>

          {/* Sound toggle */}
          {notificationSettings.enabled && (
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.settingIcon,
                    { backgroundColor: theme.colors.warning + '15' },
                  ]}
                >
                  <FontAwesomeIcon
                    icon={faVolumeUp}
                    size={20}
                    color={theme.colors.warning}
                  />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Sound</Text>
                  <Text style={styles.settingSubtitle}>
                    Play sound for notifications
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationSettings.sound}
                onValueChange={() => toggleNotificationSetting('sound')}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.warning + '50',
                }}
                thumbColor={
                  notificationSettings.sound
                    ? theme.colors.warning
                    : theme.colors.surface
                }
              />
            </View>
          )}

          {/* Vibration toggle */}
          {notificationSettings.enabled && (
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.settingIcon,
                    { backgroundColor: theme.colors.info + '15' },
                  ]}
                >
                  <FontAwesomeIcon
                    icon={faMobile}
                    size={20}
                    color={theme.colors.info}
                  />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Vibration</Text>
                  <Text style={styles.settingSubtitle}>
                    Vibrate for notifications
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationSettings.vibration}
                onValueChange={() => toggleNotificationSetting('vibration')}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.info + '50',
                }}
                thumbColor={
                  notificationSettings.vibration
                    ? theme.colors.info
                    : theme.colors.surface
                }
              />
            </View>
          )}
        </View>

        {/* Notification Categories */}
        {notificationSettings.enabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notification Types</Text>

            {/* Grades */}
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.settingIcon,
                    { backgroundColor: '#FF9500' + '15' },
                  ]}
                >
                  <FontAwesomeIcon
                    icon={faGraduationCap}
                    size={20}
                    color='#FF9500'
                  />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Grades</Text>
                  <Text style={styles.settingSubtitle}>
                    New grades and academic updates
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationSettings.categories.grades}
                onValueChange={() => toggleNotificationSetting(null, 'grades')}
                trackColor={{
                  false: theme.colors.border,
                  true: '#FF9500' + '50',
                }}
                thumbColor={
                  notificationSettings.categories.grades
                    ? '#FF9500'
                    : theme.colors.surface
                }
              />
            </View>

            {/* Attendance */}
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.settingIcon,
                    { backgroundColor: '#34C759' + '15' },
                  ]}
                >
                  <FontAwesomeIcon
                    icon={faClipboardCheck}
                    size={20}
                    color='#34C759'
                  />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Attendance</Text>
                  <Text style={styles.settingSubtitle}>
                    Attendance reminders and updates
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationSettings.categories.attendance}
                onValueChange={() =>
                  toggleNotificationSetting(null, 'attendance')
                }
                trackColor={{
                  false: theme.colors.border,
                  true: '#34C759' + '50',
                }}
                thumbColor={
                  notificationSettings.categories.attendance
                    ? '#34C759'
                    : theme.colors.surface
                }
              />
            </View>

            {/* Homework */}
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.settingIcon,
                    { backgroundColor: '#007AFF' + '15' },
                  ]}
                >
                  <FontAwesomeIcon icon={faBook} size={20} color='#007AFF' />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Homework</Text>
                  <Text style={styles.settingSubtitle}>
                    Assignment due dates and updates
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationSettings.categories.homework}
                onValueChange={() =>
                  toggleNotificationSetting(null, 'homework')
                }
                trackColor={{
                  false: theme.colors.border,
                  true: '#007AFF' + '50',
                }}
                thumbColor={
                  notificationSettings.categories.homework
                    ? '#007AFF'
                    : theme.colors.surface
                }
              />
            </View>

            {/* Behavior */}
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.settingIcon,
                    { backgroundColor: '#5856D6' + '15' },
                  ]}
                >
                  <FontAwesomeIcon icon={faGavel} size={20} color='#5856D6' />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Behavior Points</Text>
                  <Text style={styles.settingSubtitle}>
                    BPS updates and behavior notifications
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationSettings.categories.behavior}
                onValueChange={() =>
                  toggleNotificationSetting(null, 'behavior')
                }
                trackColor={{
                  false: theme.colors.border,
                  true: '#5856D6' + '50',
                }}
                thumbColor={
                  notificationSettings.categories.behavior
                    ? '#5856D6'
                    : theme.colors.surface
                }
              />
            </View>

            {/* Emergency */}
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.settingIcon,
                    { backgroundColor: '#FF3B30' + '15' },
                  ]}
                >
                  <FontAwesomeIcon
                    icon={faExclamationTriangle}
                    size={20}
                    color='#FF3B30'
                  />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Emergency Alerts</Text>
                  <Text style={styles.settingSubtitle}>
                    Important school announcements
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationSettings.categories.emergency}
                onValueChange={() =>
                  toggleNotificationSetting(null, 'emergency')
                }
                trackColor={{
                  false: theme.colors.border,
                  true: '#FF3B30' + '50',
                }}
                thumbColor={
                  notificationSettings.categories.emergency
                    ? '#FF3B30'
                    : theme.colors.surface
                }
              />
            </View>
          </View>
        )}

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('language')}</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowLanguageModal(true)}
          >
            <View style={styles.settingLeft}>
              <View
                style={[
                  styles.settingIcon,
                  { backgroundColor: theme.colors.info + '15' },
                ]}
              >
                <FontAwesomeIcon
                  icon={faLanguage}
                  size={20}
                  color={theme.colors.info}
                />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{t('language')}</Text>
                <Text style={styles.settingSubtitle}>
                  {languages[currentLanguage]?.nativeName}
                </Text>
              </View>
            </View>
            <FontAwesomeIcon
              icon={faChevronRight}
              size={16}
              color={theme.colors.textLight}
            />
          </TouchableOpacity>
        </View>

        {/* App Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('about')}</Text>

          <TouchableOpacity style={styles.settingItem} onPress={showAboutInfo}>
            <View style={styles.settingLeft}>
              <View
                style={[
                  styles.settingIcon,
                  { backgroundColor: theme.colors.success + '15' },
                ]}
              >
                <FontAwesomeIcon
                  icon={faInfo}
                  size={20}
                  color={theme.colors.success}
                />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{t('about')}</Text>
                <Text style={styles.settingSubtitle}>
                  {t('version')} {Config.APP.VERSION}
                </Text>
              </View>
            </View>
            <FontAwesomeIcon
              icon={faChevronRight}
              size={16}
              color={theme.colors.textLight}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <LanguageModal />
      <AboutModal />
    </SafeAreaView>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.headerBackground,
      padding: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginHorizontal: 16,
      borderRadius: 16,
      ...theme.shadows.small,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerCenter: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
    headerTitle: {
      color: theme.colors.headerText,
      fontSize: 20,
      fontWeight: 'bold',
      marginLeft: 8,
    },
    headerRight: {
      width: 36,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    section: {
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 15,
    },
    settingItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
      ...theme.shadows.small,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingIcon: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
    },
    settingText: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    settingSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },

    // Modal Styles
    modalContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: 50,
    },
    modalCard: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 25,
      borderTopRightRadius: 25,
      ...theme.shadows.medium,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '30',
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      flex: 1,
      textAlign: 'center',
    },
    modalCloseButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      left: 20,
    },
    languageList: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 10,
    },
    languageItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 18,
      paddingHorizontal: 16,
      marginVertical: 4,
      borderRadius: 12,
      backgroundColor: theme.colors.background,
    },
    selectedLanguageItem: {
      backgroundColor: theme.colors.primary + '10',
      borderWidth: 1,
      borderColor: theme.colors.primary + '30',
    },
    languageInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    languageFlag: {
      fontSize: 24,
      marginRight: 15,
    },
    languageText: {
      flex: 1,
    },
    languageName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    selectedLanguageName: {
      color: theme.colors.primary,
      fontWeight: 'bold',
    },
    languageNative: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    selectedLanguageNative: {
      color: theme.colors.primary + 'AA',
    },
    checkIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
    },

    // About Modal Styles
    aboutModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    aboutModalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 30,
      alignItems: 'center',
      maxWidth: 350,
      width: '100%',
      ...theme.shadows.medium,
    },
    aboutLogo: {
      width: 120,
      height: 50,
      marginTop: 20,
    },
    aboutInfo: {
      alignItems: 'center',
      marginBottom: 25,
    },
    aboutAppName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    aboutVersion: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: 8,
      textAlign: 'center',
    },
    aboutDeveloper: {
      fontSize: 14,
      color: theme.colors.textLight,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    aboutCloseButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 30,
      paddingVertical: 12,
      borderRadius: 25,
      minWidth: 100,
    },
    aboutCloseText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
  });
