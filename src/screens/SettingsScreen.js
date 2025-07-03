import React, { useState } from 'react';
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
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Config } from '../config/env';

export default function SettingsScreen({ navigation }) {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { currentLanguage, changeLanguage, t, languages } = useLanguage();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

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
      animationType='slide'
      onRequestClose={() => setShowLanguageModal(false)}
      statusBarTranslucent={false}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity
          style={styles.modalContent}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('language')}</Text>
            <TouchableOpacity
              onPress={() => setShowLanguageModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.languageList}>
            {Object.values(languages).map((language) => (
              <TouchableOpacity
                key={language.code}
                style={styles.languageItem}
                onPress={() => handleLanguageSelect(language.code)}
                disabled={isChangingLanguage}
              >
                <View style={styles.languageInfo}>
                  <Text style={styles.languageFlag}>{language.flag}</Text>
                  <View style={styles.languageText}>
                    <Text style={styles.languageName}>{language.name}</Text>
                    <Text style={styles.languageNative}>
                      {language.nativeName}
                    </Text>
                  </View>
                </View>
                {currentLanguage === language.code && !isChangingLanguage && (
                  <FontAwesomeIcon
                    icon={faCheck}
                    size={20}
                    color={theme.colors.primary}
                  />
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
        </TouchableOpacity>
      </TouchableOpacity>
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
            source={require('../../assets/EduNova School Logo.png')}
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
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '70%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    modalCloseButton: {
      padding: 5,
    },
    modalCloseText: {
      fontSize: 16,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    languageList: {
      padding: 20,
    },
    languageItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
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
    languageNative: {
      fontSize: 14,
      color: theme.colors.textSecondary,
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
