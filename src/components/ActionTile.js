import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { createSmallShadow, createMediumShadow } from '../utils/commonStyles';

/**
 * ActionTile Component
 *
 * A reusable tile component for dashboard quick actions and menu items.
 *
 * @param {Object} props
 * @param {string} props.title - The main title text
 * @param {string} props.subtitle - The subtitle text
 * @param {Object} props.icon - FontAwesome icon object
 * @param {string} props.backgroundColor - Background color for the tile
 * @param {string} props.iconColor - Color for the icon
 * @param {Function} props.onPress - Callback function when tile is pressed
 * @param {Object} props.theme - Theme object containing colors and styles
 * @param {Object} props.style - Additional styles for the tile container
 * @param {string} props.size - Tile size: 'small', 'medium', 'large'
 * @param {boolean} props.disabled - Whether the tile is disabled
 * @param {React.ReactNode} props.badge - Optional badge component to display
 * @param {string} props.variant - Tile variant: 'filled', 'outlined', 'minimal'
 */
const ActionTile = ({
  title,
  subtitle,
  icon,
  backgroundColor,
  iconColor,
  onPress,
  theme,
  style = {},
  size = 'medium',
  disabled = false,
  badge,
  variant = 'filled',
}) => {
  const styles = createStyles(theme);

  const getTileStyle = () => {
    const baseStyle = [
      styles.tile,
      styles[`${size}Tile`],
      styles[`${variant}Tile`],
    ];

    if (backgroundColor && variant === 'filled') {
      baseStyle.push({ backgroundColor });
    }

    if (disabled) {
      baseStyle.push(styles.disabledTile);
    }

    return [...baseStyle, style];
  };

  const getIconContainerStyle = () => {
    const baseStyle = [styles.iconContainer, styles[`${size}IconContainer`]];

    if (variant === 'outlined' || variant === 'minimal') {
      baseStyle.push({
        backgroundColor: backgroundColor
          ? `${backgroundColor}20`
          : `${theme.colors.primary}20`,
      });
    }

    return baseStyle;
  };

  const getTextColor = () => {
    if (disabled) {
      return theme.colors.textLight;
    }

    switch (variant) {
      case 'filled':
        return theme.colors.headerText;
      case 'outlined':
      case 'minimal':
        return theme.colors.text;
      default:
        return theme.colors.headerText;
    }
  };

  const getSubtitleColor = () => {
    if (disabled) {
      return theme.colors.textLight;
    }

    switch (variant) {
      case 'filled':
        return `${theme.colors.headerText}CC`;
      case 'outlined':
      case 'minimal':
        return theme.colors.textSecondary;
      default:
        return `${theme.colors.headerText}CC`;
    }
  };

  return (
    <TouchableOpacity
      style={getTileStyle()}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {badge && <View style={styles.badgeContainer}>{badge}</View>}

      <View style={getIconContainerStyle()}>
        <FontAwesomeIcon
          icon={icon}
          size={size === 'small' ? 18 : size === 'large' ? 32 : 24}
          color={
            disabled
              ? theme.colors.textLight
              : iconColor ||
                (variant === 'filled'
                  ? theme.colors.headerText
                  : theme.colors.primary)
          }
        />
      </View>

      <Text
        style={[
          styles.title,
          styles[`${size}Title`],
          { color: getTextColor() },
        ]}
        numberOfLines={2}
      >
        {title}
      </Text>

      {subtitle.length > 0 && (
        <Text
          style={[
            styles.subtitle,
            styles[`${size}Subtitle`],
            { color: getSubtitleColor() },
          ]}
          numberOfLines={2}
        >
          {subtitle}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    // Base tile styles
    tile: {
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    filledTile: {
      backgroundColor: theme.colors.primary,
      ...createMediumShadow(theme),
    },
    outlinedTile: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...createSmallShadow(theme),
    },
    minimalTile: {
      backgroundColor: theme.colors.surface,
    },
    disabledTile: {
      opacity: 0.5,
    },

    // Size variants
    smallTile: {
      minHeight: 80,
      padding: 12,
    },
    mediumTile: {
      minHeight: 120,
      padding: 16,
    },
    largeTile: {
      minHeight: 160,
      padding: 20,
    },

    // Icon container styles
    iconContainer: {
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    smallIconContainer: {
      width: 32,
      height: 32,
    },
    mediumIconContainer: {
      width: 48,
      height: 48,
    },
    largeIconContainer: {
      width: 64,
      height: 64,
    },

    // Text styles
    title: {
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 4,
    },
    smallTitle: {
      fontSize: 12,
    },
    mediumTitle: {
      fontSize: 14,
    },
    largeTitle: {
      fontSize: 16,
    },

    subtitle: {
      textAlign: 'center',
      lineHeight: 16,
    },
    smallSubtitle: {
      fontSize: 10,
    },
    mediumSubtitle: {
      fontSize: 12,
    },
    largeSubtitle: {
      fontSize: 14,
    },

    // Badge container
    badgeContainer: {
      position: 'absolute',
      top: 8,
      right: 8,
      zIndex: 1,
    },
  });

export default ActionTile;
