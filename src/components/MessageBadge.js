import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useMessaging } from '../contexts/MessagingContext';
import { useTheme } from '../contexts/ThemeContext';
import { getUnreadConversationsCount } from '../services/messagingService';

/**
 * MessageBadge Component
 * Displays unread message count badge for messaging
 * Uses MessagingContext for accurate message counts
 */
const MessageBadge = ({
  style,
  textStyle,
  showZero = false,
  userType = 'teacher', // 'teacher', 'student', 'parent'
  selectedStudent = null, // For parent view - show specific student's count
  showAllStudents = false, // For parent view - show all students' count
}) => {
  const { totalUnreadMessages } = useMessaging();
  const { theme } = useTheme();
  const [studentUnreadCount, setStudentUnreadCount] = useState(0);

  // Load unread count for specific student (parent view)
  useEffect(() => {
    if (selectedStudent && !showAllStudents) {
      const loadStudentUnreadCount = async () => {
        try {
          const response = await getUnreadConversationsCount(
            selectedStudent.authCode
          );
          if (response.success && response.data) {
            setStudentUnreadCount(response.data.total_unread_messages || 0);
          }
        } catch (error) {
          console.error('Error loading student unread count:', error);
          setStudentUnreadCount(0);
        }
      };

      loadStudentUnreadCount();
    }
  }, [selectedStudent, showAllStudents]);

  // Determine which count to show
  const unreadCount =
    selectedStudent && !showAllStudents
      ? studentUnreadCount
      : totalUnreadMessages;

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

export default MessageBadge;
