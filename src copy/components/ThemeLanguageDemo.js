import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { 
  faPalette, 
  faLanguage, 
  faSun, 
  faMoon,
  faGlobe,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage, LANGUAGES } from '../contexts/LanguageContext';

export default function ThemeLanguageDemo({ navigation }) {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { currentLanguage, changeLanguage, t, languages } = useLanguage();

  const styles = createStyles(theme);

  const handleLanguageChange = () => {
    const languageKeys = Object.keys(languages);
    const currentIndex = languageKeys.indexOf(currentLanguage);
    const nextIndex = (currentIndex + 1) % languageKeys.length;
    changeLanguage(languageKeys[nextIndex]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>← {t('back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Theme & Language Demo</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Theme Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesomeIcon 
              icon={faPalette} 
              size={24} 
              color={theme.colors.primary} 
            />
            <Text style={styles.sectionTitle}>{t('theme')}</Text>
          </View>
          
          <TouchableOpacity style={styles.actionCard} onPress={toggleTheme}>
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.warning + '15' }]}>
                <FontAwesomeIcon
                  icon={isDarkMode ? faMoon : faSun}
                  size={20}
                  color={theme.colors.warning}
                />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>
                  {isDarkMode ? t('lightMode') : t('darkMode')}
                </Text>
                <Text style={styles.actionSubtitle}>
                  Current: {isDarkMode ? 'Dark' : 'Light'} Mode
                </Text>
              </View>
            </View>
            <FontAwesomeIcon 
              icon={faCheck} 
              size={16} 
              color={theme.colors.success} 
            />
          </TouchableOpacity>
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesomeIcon 
              icon={faLanguage} 
              size={24} 
              color={theme.colors.info} 
            />
            <Text style={styles.sectionTitle}>{t('language')}</Text>
          </View>
          
          <TouchableOpacity style={styles.actionCard} onPress={handleLanguageChange}>
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.info + '15' }]}>
                <FontAwesomeIcon
                  icon={faGlobe}
                  size={20}
                  color={theme.colors.info}
                />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Change Language</Text>
                <Text style={styles.actionSubtitle}>
                  Current: {languages[currentLanguage]?.nativeName}
                </Text>
              </View>
            </View>
            <Text style={styles.languageFlag}>
              {languages[currentLanguage]?.flag}
            </Text>
          </TouchableOpacity>

          {/* Available Languages */}
          <View style={styles.languageList}>
            <Text style={styles.listTitle}>Available Languages:</Text>
            {Object.values(languages).map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageItem,
                  currentLanguage === language.code && styles.selectedLanguage
                ]}
                onPress={() => changeLanguage(language.code)}
              >
                <Text style={styles.languageFlag}>{language.flag}</Text>
                <Text style={styles.languageName}>{language.nativeName}</Text>
                {currentLanguage === language.code && (
                  <FontAwesomeIcon 
                    icon={faCheck} 
                    size={16} 
                    color={theme.colors.primary} 
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Translation Examples */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Translation Examples</Text>
          <View style={styles.translationGrid}>
            {[
              'welcome', 'teacher', 'parent', 'student', 'settings',
              'grades', 'attendance', 'timetable', 'behavior', 'home'
            ].map((key) => (
              <View key={key} style={styles.translationCard}>
                <Text style={styles.translationKey}>{key}</Text>
                <Text style={styles.translationValue}>{t(key)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Theme Colors Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Theme Colors</Text>
          <View style={styles.colorGrid}>
            {[
              { name: 'Primary', color: theme.colors.primary },
              { name: 'Secondary', color: theme.colors.secondary },
              { name: 'Success', color: theme.colors.success },
              { name: 'Warning', color: theme.colors.warning },
              { name: 'Error', color: theme.colors.error },
              { name: 'Info', color: theme.colors.info },
            ].map((item) => (
              <View key={item.name} style={styles.colorCard}>
                <View 
                  style={[styles.colorSwatch, { backgroundColor: item.color }]} 
                />
                <Text style={styles.colorName}>{item.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.headerBackground,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  backButton: {
    marginRight: 15,
  },
  backText: {
    color: theme.colors.headerText,
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: theme.colors.headerText,
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginLeft: 10,
  },
  actionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  languageFlag: {
    fontSize: 24,
  },
  languageList: {
    marginTop: 15,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 10,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    marginBottom: 8,
    ...theme.shadows.small,
  },
  selectedLanguage: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  languageName: {
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: 12,
    flex: 1,
  },
  translationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  translationCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
    width: '48%',
    marginBottom: 10,
    ...theme.shadows.small,
  },
  translationKey: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  translationValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorCard: {
    alignItems: 'center',
    width: '30%',
    marginBottom: 15,
  },
  colorSwatch: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
    ...theme.shadows.small,
  },
  colorName: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
