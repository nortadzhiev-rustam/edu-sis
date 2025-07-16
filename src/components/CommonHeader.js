import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { isIPad, isTablet } from '../utils/deviceDetection';

/**
 * CommonHeader Component
 *
 * A reusable header component with back button, title, and action buttons.
 *
 * @param {Object} props
 * @param {string} props.title - The title to display in the header
 * @param {Function} props.onBackPress - Callback function when back button is pressed
 * @param {Array} props.rightActions - Array of action objects for right side buttons
 * @param {Object} props.theme - Theme object containing colors and styles
 * @param {Object} props.style - Additional styles for the header container
 * @param {Object} props.titleStyle - Additional styles for the title text
 * @param {boolean} props.showBackButton - Whether to show the back button (default: true)
 * @param {React.ReactNode} props.leftComponent - Custom component to replace back button
 * @param {React.ReactNode} props.rightComponent - Custom component to replace right actions
 */
const CommonHeader = ({
  title,
  onBackPress,
  rightActions = [],
  theme,
  style = {},
  titleStyle = {},
  showBackButton = true,
  leftComponent,
  rightComponent,
}) => {
  const styles = createStyles(theme);

  // Calculate responsive font size based on device width and number of buttons
  const getResponsiveTitleFontSize = () => {
    const { width } = Dimensions.get('window');
    const buttonCount = rightActions.length + (showBackButton ? 1 : 0);

    // Base font sizes for different device types
    let baseFontSize = 18; // Default phone size

    if (isIPad()) {
      baseFontSize = 22; // iPad base size
    } else if (isTablet()) {
      baseFontSize = 20; // Tablet base size
    }

    // Adjust font size based on screen width
    if (width < 375) {
      // Small phones (iPhone SE, etc.)
      baseFontSize = Math.max(baseFontSize - 2, 14);
    } else if (width >= 768) {
      // Large tablets/iPads
      baseFontSize = Math.min(baseFontSize + 2, 24);
    }

    // Reduce font size based on number of buttons to prevent overflow
    if (buttonCount > 2) {
      baseFontSize = Math.max(baseFontSize - 2, 14);
    } else if (buttonCount > 1) {
      baseFontSize = Math.max(baseFontSize - 1, 15);
    }

    // Additional reduction for very long titles
    if (title && title.length > 20) {
      baseFontSize = Math.max(baseFontSize - 1, 14);
    } else if (title && title.length > 15) {
      baseFontSize = Math.max(baseFontSize - 0.5, 14);
    }

    // Ensure minimum readable size
    return Math.max(baseFontSize, 12);
  };

  const renderLeftComponent = () => {
    if (leftComponent) {
      return leftComponent;
    }

    if (showBackButton) {
      return (
        <TouchableOpacity style={styles.headerButton} onPress={onBackPress}>
          <FontAwesomeIcon
            icon={faArrowLeft}
            size={20}
            color={theme.colors.headerText}
          />
        </TouchableOpacity>
      );
    }

    return <View style={styles.headerButton} />;
  };

  const renderRightComponent = () => {
    if (rightComponent) {
      return rightComponent;
    }

    if (rightActions.length === 0) {
      return <View style={styles.headerRight} />;
    }

    return (
      <View style={styles.headerRight}>
        {rightActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.headerButton, action.style]}
            onPress={action.onPress}
            disabled={action.disabled}
          >
            {action.icon && (
              <FontAwesomeIcon
                icon={action.icon}
                size={action.iconSize || 20}
                color={
                  action.disabled
                    ? theme.colors.textLight
                    : action.iconColor || theme.colors.headerText
                }
              />
            )}
            {action.text && (
              <Text
                style={[
                  styles.actionText,
                  action.textStyle,
                  action.disabled && styles.disabledText,
                ]}
              >
                {action.text}
              </Text>
            )}
            {action.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{action.badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.header, style]}>
      <View style={styles.headerLeft}>{renderLeftComponent()}</View>

      <View style={styles.headerCenter}>
        <Text
          style={[
            styles.headerTitle,
            { fontSize: getResponsiveTitleFontSize() },
            titleStyle,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.8}
        >
          {title}
        </Text>
      </View>

      {renderRightComponent()}
    </View>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.headerBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      minHeight: 56,
    },
    headerLeft: {
      flex: 1,
      alignItems: 'flex-start',
    },
    headerCenter: {
      flex: 2,
      alignItems: 'center',
      paddingHorizontal: 8, // Add padding to prevent text overflow
    },
    headerRight: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    headerButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 4,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.headerText,
      textAlign: 'center',
    },
    actionText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.headerText,
    },
    disabledText: {
      color: theme.colors.textLight,
    },
    badge: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: theme.colors.error,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
    },
    badgeText: {
      color: theme.colors.headerText,
      fontSize: 12,
      fontWeight: 'bold',
    },
  });

export default CommonHeader;
