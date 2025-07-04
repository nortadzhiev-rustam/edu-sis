import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useMessaging } from '../contexts/MessagingContext';
import { useTheme } from '../contexts/ThemeContext';

/**
 * MessageBadge Component
 * Displays unread message count badge for messaging
 * Uses MessagingContext for accurate message counts
 */
const MessageBadge = ({ 
  style, 
  textStyle, 
  showZero = false,
  userType = 'teacher' // 'teacher', 'student', 'parent'
}) => {
  const { totalUnreadMessages } = useMessaging();
  const { theme } = useTheme();

  // For now, all user types use the same messaging context
  // In the future, this could be extended to handle different contexts
  const unreadCount = totalUnreadMessages;

  if (!showZero && unreadCount === 0) {
    return null;
  }

  const styles = createStyles(theme);

  return (
    <View style={[styles.badge, style]}>
      <Text style={[styles.badgeText, textStyle]}>
        {unreadCount > 99 ? '99+' : unreadCount.toString()}
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

export default MessageBadge;
