import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faInbox } from '@fortawesome/free-solid-svg-icons';
import CommonButton from './CommonButton';

/**
 * EmptyState Component
 * 
 * A reusable component for displaying empty states with icon, message, and optional action.
 * 
 * @param {Object} props
 * @param {Object} props.icon - FontAwesome icon object
 * @param {string} props.title - Main title text
 * @param {string} props.message - Descriptive message text
 * @param {string} props.actionText - Text for action button
 * @param {Function} props.onActionPress - Callback when action button is pressed
 * @param {Object} props.theme - Theme object containing colors and styles
 * @param {Object} props.style - Additional styles for container
 * @param {string} props.size - Component size: 'small', 'medium', 'large'
 * @param {string} props.variant - Visual variant: 'default', 'minimal', 'illustration'
 * @param {React.ReactNode} props.illustration - Custom illustration component
 * @param {React.ReactNode} props.children - Custom content to display
 */
const EmptyState = ({
  icon = faInbox,
  title,
  message,
  actionText,
  onActionPress,
  theme,
  style = {},
  size = 'medium',
  variant = 'default',
  illustration,
  children,
}) => {
  const styles = createStyles(theme);

  const renderIcon = () => {
    if (illustration) {
      return <View style={styles.illustrationContainer}>{illustration}</View>;
    }

    if (variant === 'minimal') {
      return null;
    }

    return (
      <View style={[styles.iconContainer, styles[`${size}IconContainer`]]}>
        <FontAwesomeIcon
          icon={icon}
          size={size === 'small' ? 32 : size === 'large' ? 64 : 48}
          color={theme.colors.textLight}
        />
      </View>
    );
  };

  const renderContent = () => {
    if (children) {
      return children;
    }

    return (
      <>
        {title && (
          <Text style={[styles.title, styles[`${size}Title`]]}>
            {title}
          </Text>
        )}
        
        {message && (
          <Text style={[styles.message, styles[`${size}Message`]]}>
            {message}
          </Text>
        )}
        
        {actionText && onActionPress && (
          <CommonButton
            title={actionText}
            onPress={onActionPress}
            variant="outline"
            size={size === 'small' ? 'small' : 'medium'}
            theme={theme}
            style={styles.actionButton}
          />
        )}
      </>
    );
  };

  return (
    <View style={[styles.container, styles[`${size}Container`], style]}>
      {renderIcon()}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
};

/**
 * LoadingState Component
 * 
 * A reusable component for displaying loading states.
 */
const LoadingState = ({
  message = 'Loading...',
  theme,
  style = {},
  size = 'medium',
  showSpinner = true,
}) => {
  const styles = createStyles(theme);

  return (
    <View style={[styles.container, styles[`${size}Container`], style]}>
      {showSpinner && (
        <View style={[styles.iconContainer, styles[`${size}IconContainer`]]}>
          {/* You can replace this with ActivityIndicator or custom spinner */}
          <View style={styles.spinner} />
        </View>
      )}
      <Text style={[styles.message, styles[`${size}Message`]]}>
        {message}
      </Text>
    </View>
  );
};

/**
 * ErrorState Component
 * 
 * A reusable component for displaying error states.
 */
const ErrorState = ({
  title = 'Something went wrong',
  message = 'Please try again later',
  retryText = 'Retry',
  onRetry,
  theme,
  style = {},
  size = 'medium',
}) => {
  const styles = createStyles(theme);

  return (
    <EmptyState
      icon={require('@fortawesome/free-solid-svg-icons').faExclamationTriangle}
      title={title}
      message={message}
      actionText={retryText}
      onActionPress={onRetry}
      theme={theme}
      style={style}
      size={size}
    />
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    // Container styles
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    smallContainer: {
      paddingVertical: 24,
      paddingHorizontal: 16,
    },
    mediumContainer: {
      paddingVertical: 48,
      paddingHorizontal: 32,
    },
    largeContainer: {
      paddingVertical: 64,
      paddingHorizontal: 48,
    },

    // Icon container styles
    iconContainer: {
      marginBottom: 16,
      opacity: 0.6,
    },
    smallIconContainer: {
      marginBottom: 12,
    },
    mediumIconContainer: {
      marginBottom: 16,
    },
    largeIconContainer: {
      marginBottom: 24,
    },

    // Illustration container
    illustrationContainer: {
      marginBottom: 24,
    },

    // Content styles
    content: {
      alignItems: 'center',
      maxWidth: 300,
    },

    // Text styles
    title: {
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    smallTitle: {
      fontSize: 16,
    },
    mediumTitle: {
      fontSize: 18,
    },
    largeTitle: {
      fontSize: 20,
    },

    message: {
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
    smallMessage: {
      fontSize: 12,
      marginBottom: 16,
    },
    mediumMessage: {
      fontSize: 14,
      marginBottom: 24,
    },
    largeMessage: {
      fontSize: 16,
      marginBottom: 32,
    },

    // Action button
    actionButton: {
      minWidth: 120,
    },

    // Loading spinner (basic implementation)
    spinner: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 3,
      borderColor: theme.colors.border,
      borderTopColor: theme.colors.primary,
      // Note: You would typically use Animated.View with rotation animation here
    },
  });

export { EmptyState, LoadingState, ErrorState };
export default EmptyState;
