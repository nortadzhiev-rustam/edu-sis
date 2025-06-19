import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

/**
 * CommonButton Component
 * 
 * A reusable button component with different variants and states.
 * 
 * @param {Object} props
 * @param {string} props.title - Button text
 * @param {Function} props.onPress - Callback function when button is pressed
 * @param {string} props.variant - Button variant: 'primary', 'secondary', 'outline', 'ghost', 'danger'
 * @param {string} props.size - Button size: 'small', 'medium', 'large'
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {boolean} props.loading - Whether button is in loading state
 * @param {Object} props.icon - FontAwesome icon object
 * @param {string} props.iconPosition - Icon position: 'left', 'right'
 * @param {Object} props.theme - Theme object containing colors and styles
 * @param {Object} props.style - Additional styles for button container
 * @param {Object} props.textStyle - Additional styles for button text
 * @param {boolean} props.fullWidth - Whether button should take full width
 */
const CommonButton = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  theme,
  style = {},
  textStyle = {},
  fullWidth = false,
}) => {
  const styles = createStyles(theme);

  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[`${variant}Button`], styles[`${size}Button`]];
    
    if (fullWidth) {
      baseStyle.push(styles.fullWidthButton);
    }
    
    if (disabled) {
      baseStyle.push(styles.disabledButton);
    }
    
    return [...baseStyle, style];
  };

  const getTextStyle = () => {
    const baseStyle = [styles.buttonText, styles[`${variant}Text`], styles[`${size}Text`]];
    
    if (disabled) {
      baseStyle.push(styles.disabledText);
    }
    
    return [...baseStyle, textStyle];
  };

  const renderIcon = () => {
    if (!icon) return null;

    return (
      <FontAwesomeIcon
        icon={icon}
        size={size === 'small' ? 14 : size === 'large' ? 20 : 16}
        color={getIconColor()}
        style={iconPosition === 'right' ? styles.iconRight : styles.iconLeft}
      />
    );
  };

  const getIconColor = () => {
    if (disabled) {
      return theme.colors.textLight;
    }

    switch (variant) {
      case 'primary':
        return theme.colors.headerText;
      case 'secondary':
        return theme.colors.headerText;
      case 'outline':
        return theme.colors.primary;
      case 'ghost':
        return theme.colors.primary;
      case 'danger':
        return theme.colors.headerText;
      default:
        return theme.colors.headerText;
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size={size === 'small' ? 'small' : 'small'}
          color={getIconColor()}
        />
      );
    }

    return (
      <View style={styles.contentContainer}>
        {icon && iconPosition === 'left' && renderIcon()}
        <Text style={getTextStyle()}>{title}</Text>
        {icon && iconPosition === 'right' && renderIcon()}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    button: {
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
    },
    contentContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      fontWeight: '600',
      textAlign: 'center',
    },
    iconLeft: {
      marginRight: 8,
    },
    iconRight: {
      marginLeft: 8,
    },

    // Variants
    primaryButton: {
      backgroundColor: theme.colors.primary,
    },
    secondaryButton: {
      backgroundColor: theme.colors.secondary,
    },
    outlineButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    ghostButton: {
      backgroundColor: 'transparent',
    },
    dangerButton: {
      backgroundColor: theme.colors.error,
    },

    // Text colors for variants
    primaryText: {
      color: theme.colors.headerText,
    },
    secondaryText: {
      color: theme.colors.headerText,
    },
    outlineText: {
      color: theme.colors.primary,
    },
    ghostText: {
      color: theme.colors.primary,
    },
    dangerText: {
      color: theme.colors.headerText,
    },

    // Sizes
    smallButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      minHeight: 32,
    },
    mediumButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      minHeight: 40,
    },
    largeButton: {
      paddingHorizontal: 20,
      paddingVertical: 14,
      minHeight: 48,
    },

    // Text sizes
    smallText: {
      fontSize: 14,
    },
    mediumText: {
      fontSize: 16,
    },
    largeText: {
      fontSize: 18,
    },

    // States
    disabledButton: {
      opacity: 0.5,
    },
    disabledText: {
      color: theme.colors.textLight,
    },
    fullWidthButton: {
      width: '100%',
    },
  });

export default CommonButton;
