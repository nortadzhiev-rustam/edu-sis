import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { createSmallShadow } from '../utils/commonStyles';

/**
 * CommonCard Component
 *
 * A reusable card component for displaying various types of content.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to display inside the card
 * @param {Function} props.onPress - Callback function when card is pressed
 * @param {Object} props.theme - Theme object containing colors and styles
 * @param {Object} props.style - Additional styles for the card container
 * @param {boolean} props.elevated - Whether card should have elevation/shadow
 * @param {string} props.variant - Card variant: 'default', 'outlined', 'filled'
 */
const CommonCard = ({
  children,
  onPress,
  theme,
  style = {},
  elevated = true,
  variant = 'default',
}) => {
  const styles = createStyles(theme);

  const cardStyle = [
    styles.card,
    styles[`${variant}Card`],
    elevated && styles.elevatedCard,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

/**
 * StatCard Component
 *
 * A specialized card for displaying statistics with icon, title, and value.
 */
const StatCard = ({
  icon,
  title,
  value,
  subtitle,
  iconColor,
  iconBackgroundColor,
  onPress,
  theme,
  style = {},
}) => {
  const styles = createStyles(theme);

  return (
    <CommonCard
      onPress={onPress}
      theme={theme}
      style={[styles.statCard, style]}
    >
      <View style={styles.statContent}>
        {icon && (
          <View
            style={[
              styles.statIconContainer,
              iconBackgroundColor && { backgroundColor: iconBackgroundColor },
            ]}
          >
            <FontAwesomeIcon
              icon={icon}
              size={20}
              color={iconColor || theme.colors.primary}
            />
          </View>
        )}
        <View style={styles.statTextContainer}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
      </View>
    </CommonCard>
  );
};

/**
 * RecordCard Component
 *
 * A specialized card for displaying record information with header and details.
 */
const RecordCard = ({
  title,
  subtitle,
  details,
  icon,
  iconColor,
  iconBackgroundColor,
  badge,
  badgeColor,
  onPress,
  theme,
  style = {},
  children,
}) => {
  const styles = createStyles(theme);

  return (
    <CommonCard
      onPress={onPress}
      theme={theme}
      style={[styles.recordCard, style]}
    >
      <View style={styles.recordHeader}>
        {icon && (
          <View
            style={[
              styles.recordIconContainer,
              iconBackgroundColor && { backgroundColor: iconBackgroundColor },
            ]}
          >
            <FontAwesomeIcon
              icon={icon}
              size={16}
              color={iconColor || theme.colors.primary}
            />
          </View>
        )}
        <View style={styles.recordInfo}>
          <Text style={styles.recordTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.recordSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        {badge && (
          <View
            style={[
              styles.recordBadge,
              badgeColor && { backgroundColor: badgeColor },
            ]}
          >
            <Text style={styles.recordBadgeText}>{badge}</Text>
          </View>
        )}
      </View>

      {details && (
        <View style={styles.recordDetails}>
          {details.map((detail, index) => (
            <Text key={index} style={styles.recordDetailText}>
              {detail}
            </Text>
          ))}
        </View>
      )}

      {children}
    </CommonCard>
  );
};

/**
 * InfoCard Component
 *
 * A specialized card for displaying informational content with optional actions.
 */
const InfoCard = ({
  title,
  description,
  icon,
  iconColor,
  actions = [],
  theme,
  style = {},
}) => {
  const styles = createStyles(theme);

  return (
    <CommonCard theme={theme} style={[styles.infoCard, style]}>
      <View style={styles.infoHeader}>
        {icon && (
          <FontAwesomeIcon
            icon={icon}
            size={24}
            color={iconColor || theme.colors.primary}
            style={styles.infoIcon}
          />
        )}
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>{title}</Text>
          {description && (
            <Text style={styles.infoDescription}>{description}</Text>
          )}
        </View>
      </View>

      {actions.length > 0 && (
        <View style={styles.infoActions}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.infoActionButton}
              onPress={action.onPress}
            >
              <Text style={styles.infoActionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </CommonCard>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    // Base card styles
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginVertical: 4,
    },
    defaultCard: {
      // Default styling
    },
    outlinedCard: {
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    filledCard: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    elevatedCard: {
      ...createSmallShadow(theme),
    },

    // StatCard styles
    statCard: {
      padding: 12,
    },
    statContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: `${theme.colors.primary}20`,
      marginRight: 12,
    },
    statTextContainer: {
      flex: 1,
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    statTitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    statSubtitle: {
      fontSize: 12,
      color: theme.colors.textLight,
      marginTop: 1,
    },

    // RecordCard styles
    recordCard: {
      padding: 12,
    },
    recordHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    recordIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: `${theme.colors.primary}20`,
      marginRight: 10,
    },
    recordInfo: {
      flex: 1,
    },
    recordTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    recordSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    recordBadge: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    recordBadgeText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: theme.colors.headerText,
    },
    recordDetails: {
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    recordDetailText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },

    // InfoCard styles
    infoCard: {
      padding: 16,
    },
    infoHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    infoIcon: {
      marginRight: 12,
      marginTop: 2,
    },
    infoContent: {
      flex: 1,
    },
    infoTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    infoDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    infoActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 16,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    infoActionButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginLeft: 8,
    },
    infoActionText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
    },
  });

export { CommonCard, StatCard, RecordCard, InfoCard };
export default CommonCard;
