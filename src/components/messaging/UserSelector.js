import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faUser,
  faCheck,
  faChalkboardTeacher,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../contexts/ThemeContext';

const UserSelector = ({
  user,
  isSelected = false,
  onPress,
  showUserType = true,
  showEmail = true,
  disabled = false,
}) => {
  const { theme, fontSizes } = useTheme();
  const styles = createStyles(theme, fontSizes);

  // Get user type display text
  const getUserTypeText = () => {
    if (user.user_type === 'staff') {
      if (user.role === 'head_of_section') {
        // Check if this is a Head of School (principal or director)
        if (
          user.email &&
          (user.email.toLowerCase().includes('principal') ||
            user.email.toLowerCase().includes('director'))
        ) {
          return 'Head of School';
        }
        return 'Head of Section';
      }
      return 'Teacher';
    } else if (user.user_type === 'student') {
      return 'Student';
    } else {
      return user.user_type || 'User';
    }
  };

  // Get user type icon
  const getUserTypeIcon = () => {
    if (user.user_type === 'staff') {
      return faChalkboardTeacher;
    } else {
      return faUser;
    }
  };

  // Format user details
  const getUserDetails = () => {
    const details = [];

    if (showUserType) {
      details.push(getUserTypeText());
    }

    if (showEmail && user.email) {
      details.push(user.email);
    }

    return details.join(' • ');
  };

  return (
    <TouchableOpacity
      style={[
        styles.userItem,
        isSelected && styles.selectedUserItem,
        disabled && styles.disabledUserItem,
      ]}
      onPress={() => !disabled && onPress(user)}
      activeOpacity={disabled ? 1 : 0.7}
    >
      {/* User Avatar */}
      <View style={styles.userAvatar}>
        {user.photo ? (
          <Image
            source={{ uri: user.photo }}
            style={styles.avatarImage}
            resizeMode='cover'
          />
        ) : (
          <FontAwesomeIcon
            icon={getUserTypeIcon()}
            size={20}
            color={disabled ? theme.colors.textSecondary : theme.colors.primary}
          />
        )}
      </View>

      {/* User Info */}
      <View style={styles.userInfo}>
        <Text
          style={[styles.userName, disabled && styles.disabledText]}
          numberOfLines={1}
        >
          {user.name}
        </Text>

        {getUserDetails() && (
          <Text
            style={[styles.userDetails, disabled && styles.disabledText]}
            numberOfLines={1}
          >
            {getUserDetails()}
          </Text>
        )}

        {user.branch_name && (
          <Text
            style={[styles.userBranch, disabled && styles.disabledText]}
            numberOfLines={1}
          >
            📍 {user.branch_name}
          </Text>
        )}
      </View>

      {/* Selection Indicator */}
      {isSelected && !disabled && (
        <View style={styles.checkIcon}>
          <FontAwesomeIcon
            icon={faCheck}
            size={16}
            color={theme.colors.primary}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (theme, fontSizes) => {
  // Safety check for fontSizes
  const safeFontSizes = fontSizes || {
    small: 12,
    medium: 16,
    large: 20,
  };

  return StyleSheet.create({
    userItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    selectedUserItem: {
      backgroundColor: theme.colors.primary + '10',
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
    },
    disabledUserItem: {
      opacity: 0.5,
    },
    userAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      overflow: 'hidden',
    },
    avatarImage: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: safeFontSizes.medium,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    userDetails: {
      fontSize: safeFontSizes.small,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    userBranch: {
      fontSize: safeFontSizes.small,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },
    disabledText: {
      color: theme.colors.textSecondary,
      opacity: 0.7,
    },
    checkIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
};

export default UserSelector;
