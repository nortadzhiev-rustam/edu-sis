import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { createSmallShadow } from '../utils/commonStyles';

/**
 * StatsRow Component
 *
 * A reusable component for displaying statistics in a horizontal row layout.
 *
 * @param {Object} props
 * @param {Array} props.stats - Array of stat objects with { label, value, icon?, color? }
 * @param {Object} props.theme - Theme object containing colors and styles
 * @param {Object} props.style - Additional styles for container
 * @param {string} props.variant - Visual variant: 'default', 'compact', 'detailed'
 * @param {boolean} props.showDividers - Whether to show dividers between stats
 * @param {string} props.alignment - Text alignment: 'left', 'center', 'right'
 */
const StatsRow = ({
  stats = [],
  theme,
  style = {},
  variant = 'default',
  showDividers = true,
  alignment = 'center',
}) => {
  const styles = createStyles(theme);

  const renderStat = (stat, index) => {
    const isLast = index === stats.length - 1;

    return (
      <React.Fragment key={index}>
        <View style={[styles.statItem, styles[`${variant}StatItem`]]}>
          {stat.icon && (
            <View style={styles.statIconContainer}>
              <FontAwesomeIcon
                icon={stat.icon}
                size={variant === 'compact' ? 14 : 16}
                color={stat.color || theme.colors.primary}
              />
            </View>
          )}

          <View style={[styles.statContent, styles[`${alignment}Aligned`]]}>
            <Text
              style={[
                styles.statValue,
                styles[`${variant}StatValue`],
                stat.color && { color: stat.color },
              ]}
            >
              {stat.value}
            </Text>
            <Text style={[styles.statLabel, styles[`${variant}StatLabel`]]}>
              {stat.label}
            </Text>
          </View>
        </View>

        {showDividers && !isLast && (
          <View style={[styles.divider, styles[`${variant}Divider`]]} />
        )}
      </React.Fragment>
    );
  };

  return (
    <View style={[styles.container, styles[`${variant}Container`], style]}>
      {stats.map(renderStat)}
    </View>
  );
};

/**
 * StatCard Component
 *
 * A reusable component for displaying a single statistic in card format.
 */
const StatCard = ({
  label,
  value,
  icon,
  color,
  subtitle,
  trend,
  trendDirection, // 'up', 'down', 'neutral'
  theme,
  style = {},
  size = 'medium',
  onPress,
}) => {
  const styles = createStyles(theme);

  const getTrendColor = () => {
    switch (trendDirection) {
      case 'up':
        return theme.colors.success || '#4CAF50';
      case 'down':
        return theme.colors.error || '#F44336';
      default:
        return theme.colors.textSecondary;
    }
  };

  const cardStyle = [styles.card, styles[`${size}Card`], style];

  const CardComponent = onPress
    ? require('react-native').TouchableOpacity
    : View;

  return (
    <CardComponent
      style={cardStyle}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.cardHeader}>
        {icon && (
          <View
            style={[
              styles.cardIconContainer,
              color && { backgroundColor: `${color}20` },
            ]}
          >
            <FontAwesomeIcon
              icon={icon}
              size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
              color={color || theme.colors.primary}
            />
          </View>
        )}

        <View style={styles.cardContent}>
          <Text style={[styles.cardValue, styles[`${size}CardValue`]]}>
            {value}
          </Text>
          <Text style={[styles.cardLabel, styles[`${size}CardLabel`]]}>
            {label}
          </Text>

          {subtitle && (
            <Text style={[styles.cardSubtitle, styles[`${size}CardSubtitle`]]}>
              {subtitle}
            </Text>
          )}

          {trend && (
            <Text
              style={[
                styles.cardTrend,
                styles[`${size}CardTrend`],
                { color: getTrendColor() },
              ]}
            >
              {trend}
            </Text>
          )}
        </View>
      </View>
    </CardComponent>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    // StatsRow styles
    container: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    defaultContainer: {
      paddingVertical: 16,
      paddingHorizontal: 16,
    },
    compactContainer: {
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    detailedContainer: {
      paddingVertical: 20,
      paddingHorizontal: 5,
    },

    // Stat item styles
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    defaultStatItem: {
      paddingVertical: 8,
    },
    compactStatItem: {
      paddingVertical: 4,
    },
    detailedStatItem: {
      paddingVertical: 2,
    },

    statIconContainer: {
      marginBottom: 4,
    },

    statContent: {
      alignItems: 'center',
    },
    leftAligned: {
      alignItems: 'flex-start',
    },
    centerAligned: {
      alignItems: 'center',
    },
    rightAligned: {
      alignItems: 'flex-end',
    },

    // Stat text styles
    statValue: {
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 2,
    },
    defaultStatValue: {
      fontSize: 20,
    },
    compactStatValue: {
      fontSize: 16,
    },
    detailedStatValue: {
      fontSize: 24,
    },

    statLabel: {
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    defaultStatLabel: {
      fontSize: 12,
    },
    compactStatLabel: {
      fontSize: 10,
    },
    detailedStatLabel: {
      fontSize: 14,
    },

    // Divider styles
    divider: {
      backgroundColor: theme.colors.border,
      marginHorizontal: 8,
    },
    defaultDivider: {
      width: 1,
      height: 32,
    },
    compactDivider: {
      width: 1,
      height: 24,
    },
    detailedDivider: {
      width: 1,
      height: 40,
    },

    // StatCard styles
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      ...createSmallShadow(theme),
    },
    smallCard: {
      padding: 12,
    },
    mediumCard: {
      padding: 16,
    },
    largeCard: {
      padding: 20,
    },

    cardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },

    cardIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: `${theme.colors.primary}20`,
      marginRight: 12,
    },

    cardContent: {
      flex: 1,
    },

    cardValue: {
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    smallCardValue: {
      fontSize: 18,
    },
    mediumCardValue: {
      fontSize: 24,
    },
    largeCardValue: {
      fontSize: 32,
    },

    cardLabel: {
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    smallCardLabel: {
      fontSize: 12,
    },
    mediumCardLabel: {
      fontSize: 14,
    },
    largeCardLabel: {
      fontSize: 16,
    },

    cardSubtitle: {
      color: theme.colors.textLight,
      marginBottom: 4,
    },
    smallCardSubtitle: {
      fontSize: 10,
    },
    mediumCardSubtitle: {
      fontSize: 12,
    },
    largeCardSubtitle: {
      fontSize: 14,
    },

    cardTrend: {
      fontWeight: '600',
    },
    smallCardTrend: {
      fontSize: 10,
    },
    mediumCardTrend: {
      fontSize: 12,
    },
    largeCardTrend: {
      fontSize: 14,
    },
  });

export { StatsRow, StatCard };
export default StatsRow;
