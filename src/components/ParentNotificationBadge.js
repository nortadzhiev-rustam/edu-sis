import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useParentNotifications } from '../hooks/useParentNotifications';
import { useTheme } from '../contexts/ThemeContext';

const ParentNotificationBadge = ({
  style,
  textStyle,
  showZero = false,
  selectedStudent = null,
  showAllStudents = false,
}) => {
  const { getTotalUnreadCount, getStudentUnreadCount } =
    useParentNotifications();
  const { theme } = useTheme();

  // If selectedStudent is provided, show only that student's count
  // Otherwise, show total count across all students (default behavior)
  const unreadCount =
    selectedStudent && !showAllStudents
      ? getStudentUnreadCount(selectedStudent.authCode) || 0
      : getTotalUnreadCount();

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
      top: -1,
      right: -1,
    },
    badgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: 'bold',
      textAlign: 'center',
    },
  });

export default ParentNotificationBadge;
