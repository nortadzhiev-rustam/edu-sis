import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Language-specific font size adjustments
const getFontSize = (baseSize, language) => {
  const adjustments = {
    my: 0.85, // Myanmar - reduce by 15%
    zh: 0.95, // Chinese - reduce by 5%
    th: 0.95, // Thai - reduce by 5%
    en: 1.0, // English - no change
  };

  const multiplier = adjustments[language] || 1.0;
  return Math.round(baseSize * multiplier);
};

// Helper function to get language-aware font sizes
export const getLanguageFontSizes = (language) => ({
  // Header sizes
  headerTitle: getFontSize(20, language),
  headerSubtitle: getFontSize(16, language),

  // Body text sizes
  title: getFontSize(24, language),
  subtitle: getFontSize(18, language),
  body: getFontSize(16, language),
  bodySmall: getFontSize(14, language),
  caption: getFontSize(12, language),

  // Button sizes
  buttonText: getFontSize(16, language),
  buttonTextSmall: getFontSize(14, language),

  // Profile specific sizes
  profileName: getFontSize(24, language),
  profileRole: getFontSize(16, language),
  profileId: getFontSize(14, language),
  sectionTitle: getFontSize(18, language),
  profileItemLabel: getFontSize(14, language),
  profileItemValue: getFontSize(16, language),

  // Feature sizes
  featureTitle: getFontSize(16, language),
  featureSubtitle: getFontSize(14, language),

  // Tile sizes
  tileTitle: getFontSize(16, language),
  tileSubtitle: getFontSize(12, language),

  // Badge sizes
  badgeText: getFontSize(10, language),
  comingSoonText: getFontSize(10, language),
});

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Light theme colors
const lightTheme = {
  mode: 'light',
  colors: {
    primary: '#007AFF',
    secondary: '#007AFF', // Changed from purple to blue for better consistency
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#333333',
    textSecondary: '#666666',
    textLight: '#999999',
    border: '#e0e0e0',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#007AFF',
    card: '#ffffff',
    headerBackground: '#007AFF',
    headerText: '#ffffff',
    tabBackground: '#ffffff',
    tabActive: '#007AFF', // Changed from purple to blue
    tabInactive: '#999999',
    shadow: '#000000',
    // BPS-specific colors for better UX
    bpsPositive: '#34C759', // Green for positive behavior
    bpsNegative: '#FF3B30', // Red for negative behavior
    bpsSelected: '#007AFF', // Blue for selected items
    bpsBackground: '#F8F9FA', // Light background for BPS cards
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

// Dark theme colors
const darkTheme = {
  mode: 'dark',
  colors: {
    primary: '#6B69FF',
    secondary: '#0A84FF',
    background: '#000000',
    surface: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#AEAEB2',
    textLight: '#8E8E93',
    border: '#38383A',
    success: '#30D158',
    warning: '#FF9F0A',
    error: '#FF453A',
    info: '#0A84FF',
    card: '#1C1C1E',
    headerBackground: '#1C1C1E',
    headerText: '#FFFFFF',
    tabBackground: '#1C1C1E',
    tabActive: '#6B69FF',
    tabInactive: '#8E8E93',
    shadow: '#000000',
    // BPS-specific colors for better UX
    bpsPositive: '#30D158', // Green for positive behavior
    bpsNegative: '#FF453A', // Red for negative behavior
    bpsSelected: '#0A84FF', // Blue for selected items
    bpsBackground: '#2C2C2E', // Dark background for BPS cards
  },
  shadows: {
    small: {
      shadowColor: '#ccc',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#ccc',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#ccc',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference from storage
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themeMode');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await AsyncStorage.setItem('themeMode', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const setTheme = async (mode) => {
    try {
      const isDark = mode === 'dark';
      setIsDarkMode(isDark);
      await AsyncStorage.setItem('themeMode', mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  const value = {
    theme,
    isDarkMode,
    toggleTheme,
    setTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export default ThemeContext;
