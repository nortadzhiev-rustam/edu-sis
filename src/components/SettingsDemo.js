import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function SettingsDemo() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { currentLanguage, changeLanguage, t } = useLanguage();

  const styles = createStyles(theme);

  const handleLanguageChange = () => {
    const languages = ['en', 'my', 'zh'];
    const currentIndex = languages.indexOf(currentLanguage);
    const nextIndex = (currentIndex + 1) % languages.length;
    changeLanguage(languages[nextIndex]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings Demo</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('theme')}</Text>
        <TouchableOpacity style={styles.button} onPress={toggleTheme}>
          <Text style={styles.buttonText}>
            {isDarkMode ? t('lightMode') : t('darkMode')}
          </Text>
        </TouchableOpacity>
        <Text style={styles.info}>
          Current: {isDarkMode ? 'Dark' : 'Light'} Mode
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('language')}</Text>
        <TouchableOpacity style={styles.button} onPress={handleLanguageChange}>
          <Text style={styles.buttonText}>Change Language</Text>
        </TouchableOpacity>
        <Text style={styles.info}>
          Current: {currentLanguage.toUpperCase()}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Translated Text Examples</Text>
        <Text style={styles.translatedText}>{t('welcome')}</Text>
        <Text style={styles.translatedText}>{t('settings')}</Text>
        <Text style={styles.translatedText}>{t('grades')}</Text>
        <Text style={styles.translatedText}>{t('attendance')}</Text>
      </View>
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    ...theme.shadows.small,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 15,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  translatedText: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 8,
    paddingLeft: 10,
  },
});
