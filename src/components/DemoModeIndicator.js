/**
 * Demo Mode Indicator Component
 * Shows a banner when the app is running in demo mode
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faFlask } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { isDemoMode } from '../services/authService';

const DemoModeIndicator = ({ userData, style }) => {
  const { theme } = useTheme();
  
  // Only show if user is in demo mode
  if (!isDemoMode(userData)) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.warning || '#FF9500' }, style]}>
      <FontAwesomeIcon 
        icon={faFlask} 
        size={14} 
        color="#fff" 
        style={styles.icon}
      />
      <Text style={styles.text}>DEMO MODE</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginVertical: 4,
  },
  icon: {
    marginRight: 6,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default DemoModeIndicator;
