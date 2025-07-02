import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useParentNotifications } from '../hooks/useParentNotifications';
import { useTheme } from '../contexts/ThemeContext';

const ParentNotificationBadge = ({ style, textStyle, showZero = false }) => {
  const { getTotalUnreadCount } = useParentNotifications();
  const { theme } = useTheme();

  const totalUnreadCount = getTotalUnreadCount();

  if (!showZero && totalUnreadCount === 0) {
    return null;
  }

  const styles = createStyles(theme);

  return (
    <View style={[styles.badge, style]}>
      <Text style={[styles.badgeText, textStyle]}>
        {totalUnreadCount > 99 ? '99+' : totalUnreadCount.toString()}
      </Text>
    </View>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    badge: {
      backgroundColor: '#FF3B30',
      borderRadius: 9,
      minWidth: 18,
      height: 18,
      justifyContent: 'center',
      alignItems: 'center',

      position: 'absolute',
      top: -10,
      right: -10,
      borderWidth: 2,
      borderColor: theme.colors.background,
    },
    badgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: 'bold',
      textAlign: 'center',
    },
  });

export default ParentNotificationBadge;
