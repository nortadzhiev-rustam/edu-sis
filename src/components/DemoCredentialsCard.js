/**
 * Demo Credentials Card Component
 * Displays demo login credentials for easy access
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Clipboard,
  Alert,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faFlask,
  faCopy,
  faChevronDown,
  faChevronUp,
  faUser,
  faGraduationCap,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getDemoCredentials } from '../services/authService';

const DemoCredentialsCard = ({ onCredentialSelect, currentLoginType }) => {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const demoCredentials = getDemoCredentials();

  const copyToClipboard = (text, type) => {
    Clipboard.setString(text);
    Alert.alert('Copied', `${type} copied to clipboard`);
  };

  const handleCredentialPress = (username, password) => {
    if (onCredentialSelect) {
      onCredentialSelect(username, password);
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'teacher':
        return faUser;
      case 'student':
        return faGraduationCap;
      case 'parent':
        return faUsers;
      default:
        return faFlask;
    }
  };

  const getColorForType = (type) => {
    switch (type) {
      case 'teacher':
        return '#007AFF';
      case 'student':
        return '#34C759';
      case 'parent':
        return '#AF52DE';
      default:
        return '#FF9500';
    }
  };

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View style={styles.headerLeft}>
          <FontAwesomeIcon icon={faFlask} size={16} color={theme.colors.primary} />
          <Text style={styles.headerTitle}>Demo Credentials</Text>
        </View>
        <FontAwesomeIcon
          icon={isExpanded ? faChevronUp : faChevronDown}
          size={14}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          <Text style={styles.description}>
            Use these credentials to explore the app in demo mode with sample data:
          </Text>

          {Object.entries(demoCredentials).map(([type, creds]) => (
            <View key={type} style={styles.credentialItem}>
              <View style={styles.credentialHeader}>
                <FontAwesomeIcon
                  icon={getIconForType(type)}
                  size={16}
                  color={getColorForType(type)}
                />
                <Text style={[styles.credentialType, { color: getColorForType(type) }]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </View>

              <View style={styles.credentialRow}>
                <View style={styles.credentialField}>
                  <Text style={styles.fieldLabel}>Username:</Text>
                  <TouchableOpacity
                    style={styles.fieldValue}
                    onPress={() => copyToClipboard(creds.username, 'Username')}
                  >
                    <Text style={styles.fieldText}>{creds.username}</Text>
                    <FontAwesomeIcon icon={faCopy} size={12} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.credentialField}>
                  <Text style={styles.fieldLabel}>Password:</Text>
                  <TouchableOpacity
                    style={styles.fieldValue}
                    onPress={() => copyToClipboard(creds.password, 'Password')}
                  >
                    <Text style={styles.fieldText}>{creds.password}</Text>
                    <FontAwesomeIcon icon={faCopy} size={12} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.credentialDescription}>{creds.description}</Text>

              {currentLoginType === type && (
                <TouchableOpacity
                  style={[styles.useButton, { backgroundColor: getColorForType(type) }]}
                  onPress={() => handleCredentialPress(creds.username, creds.password)}
                >
                  <Text style={styles.useButtonText}>Use These Credentials</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          <View style={styles.note}>
            <Text style={styles.noteText}>
              💡 Demo mode includes sample data for all features including timetables, grades, 
              attendance, homework, behavior points, and notifications.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginVertical: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginLeft: 8,
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    description: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 16,
      lineHeight: 20,
    },
    credentialItem: {
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    credentialHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    credentialType: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    credentialRow: {
      marginBottom: 8,
    },
    credentialField: {
      marginBottom: 6,
    },
    fieldLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    fieldValue: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.surface,
      padding: 8,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    fieldText: {
      fontSize: 14,
      color: theme.colors.text,
      fontFamily: 'monospace',
    },
    credentialDescription: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
      marginBottom: 8,
    },
    useButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      alignItems: 'center',
    },
    useButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    note: {
      backgroundColor: theme.colors.info || '#E3F2FD',
      padding: 12,
      borderRadius: 8,
      marginTop: 8,
    },
    noteText: {
      fontSize: 12,
      color: theme.colors.text,
      lineHeight: 16,
    },
  });

export default DemoCredentialsCard;
