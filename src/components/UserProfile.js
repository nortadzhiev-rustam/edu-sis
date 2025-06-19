import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUser, faChevronRight } from '@fortawesome/free-solid-svg-icons';

/**
 * UserProfile Component
 * 
 * A reusable component for displaying user profile information with avatar, name, and details.
 * 
 * @param {Object} props
 * @param {string} props.name - User's name
 * @param {string} props.subtitle - Subtitle text (role, ID, etc.)
 * @param {string} props.photoUrl - URL for user's profile photo
 * @param {Object} props.icon - FontAwesome icon to show if no photo
 * @param {Function} props.onPress - Callback when profile is pressed
 * @param {Function} props.onSubtitlePress - Callback when subtitle is pressed
 * @param {Object} props.theme - Theme object containing colors and styles
 * @param {Object} props.style - Additional styles for container
 * @param {string} props.size - Profile size: 'small', 'medium', 'large'
 * @param {string} props.layout - Layout: 'horizontal', 'vertical'
 * @param {boolean} props.showChevron - Whether to show chevron for subtitle
 * @param {React.ReactNode} props.badge - Optional badge component
 * @param {React.ReactNode} props.rightComponent - Optional right side component
 */
const UserProfile = ({
  name,
  subtitle,
  photoUrl,
  icon = faUser,
  onPress,
  onSubtitlePress,
  theme,
  style = {},
  size = 'medium',
  layout = 'horizontal',
  showChevron = false,
  badge,
  rightComponent,
}) => {
  const styles = createStyles(theme);

  const renderAvatar = () => {
    const avatarStyle = [
      styles.avatar,
      styles[`${size}Avatar`],
    ];

    if (photoUrl) {
      return (
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: photoUrl }}
            style={avatarStyle}
            resizeMode="cover"
          />
          {badge && <View style={styles.badgeContainer}>{badge}</View>}
        </View>
      );
    }

    return (
      <View style={styles.avatarContainer}>
        <View style={[avatarStyle, styles.avatarPlaceholder]}>
          <FontAwesomeIcon
            icon={icon}
            size={size === 'small' ? 16 : size === 'large' ? 32 : 24}
            color={theme.colors.primary}
          />
        </View>
        {badge && <View style={styles.badgeContainer}>{badge}</View>}
      </View>
    );
  };

  const renderUserInfo = () => {
    return (
      <View style={[styles.userInfo, layout === 'vertical' && styles.verticalUserInfo]}>
        <Text
          style={[
            styles.userName,
            styles[`${size}UserName`],
            layout === 'vertical' && styles.centeredText,
          ]}
          numberOfLines={layout === 'vertical' ? 2 : 1}
        >
          {name}
        </Text>
        
        {subtitle && (
          <TouchableOpacity
            onPress={onSubtitlePress}
            disabled={!onSubtitlePress}
            activeOpacity={onSubtitlePress ? 0.7 : 1}
            style={[
              styles.subtitleContainer,
              layout === 'vertical' && styles.centeredSubtitle,
            ]}
          >
            <Text
              style={[
                styles.userSubtitle,
                styles[`${size}UserSubtitle`],
                layout === 'vertical' && styles.centeredText,
                onSubtitlePress && styles.clickableSubtitle,
              ]}
              numberOfLines={layout === 'vertical' ? 2 : 1}
            >
              {subtitle}
            </Text>
            {showChevron && onSubtitlePress && (
              <FontAwesomeIcon
                icon={faChevronRight}
                size={12}
                color={theme.colors.textSecondary}
                style={styles.chevronIcon}
              />
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const containerStyle = [
    styles.container,
    styles[`${layout}Container`],
    styles[`${size}Container`],
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {renderAvatar()}
        {renderUserInfo()}
        {rightComponent && (
          <View style={styles.rightComponent}>{rightComponent}</View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={containerStyle}>
      {renderAvatar()}
      {renderUserInfo()}
      {rightComponent && (
        <View style={styles.rightComponent}>{rightComponent}</View>
      )}
    </View>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    // Container styles
    container: {
      alignItems: 'center',
    },
    horizontalContainer: {
      flexDirection: 'row',
    },
    verticalContainer: {
      flexDirection: 'column',
    },
    smallContainer: {
      padding: 8,
    },
    mediumContainer: {
      padding: 12,
    },
    largeContainer: {
      padding: 16,
    },

    // Avatar styles
    avatarContainer: {
      position: 'relative',
    },
    avatar: {
      borderRadius: 50,
    },
    smallAvatar: {
      width: 32,
      height: 32,
    },
    mediumAvatar: {
      width: 48,
      height: 48,
    },
    largeAvatar: {
      width: 64,
      height: 64,
    },
    avatarPlaceholder: {
      backgroundColor: `${theme.colors.primary}20`,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Badge styles
    badgeContainer: {
      position: 'absolute',
      top: -4,
      right: -4,
    },

    // User info styles
    userInfo: {
      flex: 1,
      marginLeft: 12,
      justifyContent: 'center',
    },
    verticalUserInfo: {
      marginLeft: 0,
      marginTop: 8,
      alignItems: 'center',
    },

    // Text styles
    userName: {
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    smallUserName: {
      fontSize: 14,
    },
    mediumUserName: {
      fontSize: 16,
    },
    largeUserName: {
      fontSize: 18,
    },

    subtitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    centeredSubtitle: {
      justifyContent: 'center',
    },

    userSubtitle: {
      color: theme.colors.textSecondary,
    },
    smallUserSubtitle: {
      fontSize: 12,
    },
    mediumUserSubtitle: {
      fontSize: 14,
    },
    largeUserSubtitle: {
      fontSize: 16,
    },

    clickableSubtitle: {
      color: theme.colors.primary,
    },

    centeredText: {
      textAlign: 'center',
    },

    chevronIcon: {
      marginLeft: 4,
    },

    // Right component
    rightComponent: {
      marginLeft: 12,
    },
  });

export default UserProfile;
