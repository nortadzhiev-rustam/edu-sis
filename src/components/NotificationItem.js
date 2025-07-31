import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PropTypes from 'prop-types';
import {
  faBell,
  faGraduationCap,
  faCalendarCheck,
  faBullhorn,
  faCircle,
  faUserCheck,
  faBookOpen,
  faExclamationTriangle,
  faComments,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
import { createCustomShadow } from '../utils/commonStyles';

const NotificationItem = ({ notification, onPress, userType }) => {
  const { theme } = useTheme();
  const { markAsRead } = useNotifications();
  const navigation = useNavigation();
  const styles = createStyles(theme);

  const getNotificationIcon = (type, body = '') => {
    switch (type) {
      // Behavior notifications - dynamic icon based on body content
      case 'behavior':
      case 'bps_record':
      case 'bps':
      case 'discipline':
      case 'behavior_positive':
      case 'behavior_negative':
        // Check if body contains dps/DPS for warning icon
        if (body.toLowerCase().includes('dps')) {
          return faExclamationTriangle;
        }
        // Default to positive icon for prs/PRS or other behavior notifications
        return faUserCheck;

      // Attendance notifications
      case 'attendance':
      case 'attendance_absent':
      case 'attendance_late':
      case 'attendance_present':
      case 'attendance_reminder':
        return faCalendarCheck;

      // Grade notifications
      case 'grade':
      case 'assessment':
      case 'grade_updated':
      case 'assessment_published':
      case 'grade_released':
      case 'test_result':
        return faGraduationCap;

      // Homework notifications
      case 'homework':
      case 'homework_assigned':
      case 'homework_due':
      case 'homework_submitted':
      case 'homework_graded':
        return faBookOpen;

      // Announcement notifications
      case 'announcement':
      case 'general':
      case 'news':
      case 'event':
      case 'reminder':
        return faBullhorn;

      case 'timetable':
        return faCalendarCheck;
      // Messaging notifications
      case 'message':
      case 'messaging':
      case 'new_message':
      case 'message_received':
      case 'conversation':
      case 'chat':
        return faComments;
      default:
        return faBell;
    }
  };

  const getNotificationColor = (type, body = '') => {
    switch (type) {
      // Behavior notifications - dynamic color based on body content
      case 'behavior':
      case 'bps_record':
      case 'bps':
      case 'discipline':
      case 'behavior_positive':
      case 'behavior_negative':
        // Check if body contains dps/DPS for red warning color
        if (
          body.toLowerCase().includes('dps') ||
          body.toLowerCase().includes('negative')
        ) {
          return '#FF3B30'; // Red for negative behavior (DPS)
        }
        // Check if body contains prs/PRS for green positive color
        if (
          body.toLowerCase().includes('prs') ||
          body.toLowerCase().includes('positive')
        ) {
          return '#34C759'; // Green for positive behavior (PRS)
        }
        // Default red for other behavior notifications
        return '#FF3B30';

      // Attendance notifications - Orange
      case 'attendance':
      case 'attendance_absent':
      case 'attendance_late':
      case 'attendance_present':
      case 'attendance_reminder':
        return '#FF9500';

      // Grade notifications - Green
      case 'grade':
      case 'assessment':
      case 'grade_updated':
      case 'assessment_published':
      case 'grade_released':
      case 'test_result':
        return '#34C759';

      // Homework notifications - Purple
      case 'homework':
      case 'homework_assigned':
      case 'homework_due':
      case 'homework_submitted':
      case 'homework_graded':
        return '#5856D6';

      // Announcement notifications - Blue
      case 'announcement':
      case 'general':
      case 'news':
      case 'event':
      case 'reminder':
        return '#007AFF';

      case 'timetable':
        return '#AF52DE'; // Purple for timetable
      // Messaging notifications - Pink
      case 'message':
      case 'messaging':
      case 'new_message':
      case 'message_received':
      case 'conversation':
      case 'chat':
        return '#FF2D55';
      default:
        return '#8E8E93'; // Gray for others
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const handlePress = async () => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    if (onPress) {
      onPress(notification);
    } else {
      // Navigate to appropriate screen based on notification type
      navigateToScreen(notification.type);
    }
  };

  const getNavigationParams = async () => {
    try {
      let authCode = null;
      let studentName = null;

      // First, check if notification has a specific authCode (for student notifications in parent context)
      if (notification.studentAuthCode) {
        authCode = notification.studentAuthCode;

        // Try to get student name from stored student accounts (for parent context)
        try {
          const savedStudents = await AsyncStorage.getItem('studentAccounts');
          if (savedStudents) {
            const students = JSON.parse(savedStudents);
            const student = students.find((s) => s.authCode === authCode);
            if (student) {
              studentName = student.name;
            }
          }
        } catch (error) {
          console.log('Could not get student name:', error);
        }
      } else {
        // Get the current user's authCode from AsyncStorage
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          authCode = user.authCode || user.auth_code;
          studentName = user.name; // Use current user's name if available
        }
      }

      // Create navigation params object
      const params = {};
      if (authCode) params.authCode = authCode;
      if (studentName) params.studentName = studentName;

      return params;
    } catch (error) {
      console.error('Error getting navigation params:', error);
      return {};
    }
  };

  const showNotificationAlert = (
    title = notification.title,
    body = notification.body
  ) => {
    Alert.alert(title, body, [{ text: 'OK', style: 'default' }]); // TODO: Replace 'OK' with t('ok') when context is available
  };

  const navigateToScreen = async (type) => {
    try {
      const navigationParams = await getNavigationParams();

      console.log('Navigating with params:', navigationParams); // Debug log

      switch (type) {
        // Behavior notifications
        case 'behavior':
        case 'bps_record':
        case 'bps':
        case 'discipline':
        case 'behavior_positive':
        case 'behavior_negative':
          // Navigate to Behavior screen
          navigation.navigate('BehaviorScreen', navigationParams);
          break;

        // Attendance notifications
        case 'attendance':
        case 'attendance_absent':
        case 'attendance_late':
        case 'attendance_present':
        case 'attendance_reminder':
          // Navigate to Attendance screen
          navigation.navigate('AttendanceScreen', navigationParams);
          break;

        // Grade notifications
        case 'grade':
        case 'assessment':
        case 'grade_updated':
        case 'assessment_published':
        case 'grade_released':
        case 'test_result':
          // Navigate to Grades screen
          navigation.navigate('GradesScreen', navigationParams);
          break;

        // Homework notifications
        case 'homework':
        case 'homework_assigned':
        case 'homework_due':
        case 'homework_submitted':
        case 'homework_graded': {
          // Navigate to appropriate homework screen based on user context
          const homeworkUserData = await AsyncStorage.getItem('userData');

          // Check if this notification has a specific student auth code (from parent context)
          const isStudentNotification = notification.studentAuthCode;

          // Determine the effective user type (prioritize passed userType prop)
          let effectiveUserType = userType;
          if (!effectiveUserType && homeworkUserData) {
            const user = JSON.parse(homeworkUserData);
            effectiveUserType = user.userType || user.user_type || user.type;
          }

          console.log('📚 NOTIFICATION: Homework navigation context:', {
            effectiveUserType,
            isStudentNotification,
            hasStudentAuthCode: !!notification.studentAuthCode,
            passedUserType: userType,
          });

          // If this is a student-specific notification (from parent screen) or user is a student,
          // always navigate to AssignmentsScreen
          if (
            isStudentNotification ||
            effectiveUserType === 'student' ||
            effectiveUserType === 'parent'
          ) {
            console.log(
              '📚 NOTIFICATION: Navigating to student assignments screen'
            );
            navigation.navigate('AssignmentsScreen', navigationParams);
          }
          // Only navigate to teacher homework screen if user is actually a teacher AND
          // this is not a student-specific notification
          else if (
            (effectiveUserType === 'teacher' ||
              effectiveUserType === 'staff') &&
            !isStudentNotification
          ) {
            console.log(
              '📚 NOTIFICATION: Navigating to teacher homework screen'
            );

            // Get additional teacher data if available
            let teacherName = navigationParams.studentName;
            let selectedBranchId = null;

            if (homeworkUserData) {
              const user = JSON.parse(homeworkUserData);
              teacherName = teacherName || user.name;
              selectedBranchId = user.branches?.[0]?.branch_id || null;
            }

            navigation.navigate('TeacherHomework', {
              authCode: navigationParams.authCode,
              teacherName,
              selectedBranchId,
            });
          } else {
            // Default to student assignments screen for any other case
            console.log(
              '📚 NOTIFICATION: Defaulting to student assignments screen'
            );
            navigation.navigate('AssignmentsScreen', navigationParams);
          }
          break;
        }

        // Announcement notifications
        case 'announcement':
        case 'general':
        case 'news':
        case 'event':
        case 'reminder':
          // For announcements, show alert since there's no dedicated announcements screen
          showNotificationAlert();
          break;

        case 'timetable':
          // Navigate to Timetable screen
          navigation.navigate('TimetableScreen', navigationParams);
          break;

        // Messaging notifications
        case 'message':
        case 'messaging':
        case 'new_message':
        case 'message_received':
        case 'conversation':
        case 'chat': {
          // Navigate to appropriate messaging screen based on user type
          const messagingUserData = await AsyncStorage.getItem('userData');
          if (messagingUserData) {
            const user = JSON.parse(messagingUserData);
            const userType = user.user_type || user.type;

            if (userType === 'teacher' || userType === 'staff') {
              navigation.navigate('TeacherMessagingScreen', {
                authCode: navigationParams.authCode,
                teacherName: navigationParams.studentName || user.name,
              });
            } else if (userType === 'student') {
              navigation.navigate('StudentMessagingScreen', {
                authCode: navigationParams.authCode,
                studentName: navigationParams.studentName || user.name,
              });
            } else {
              // Fallback for unknown user types
              showNotificationAlert(
                'Messaging',
                'Please check your messages in the app.'
              );
            }
          } else {
            showNotificationAlert(
              'Error',
              'Unable to determine user type for messaging navigation.'
            );
          }
          break;
        }

        default:
          // Show notification details in alert for unknown types
          showNotificationAlert();
          break;
      }
    } catch (error) {
      console.log('Navigation error:', error);
      // Fallback to showing alert if navigation fails
      showNotificationAlert();
    }
  };

  const iconColor = getNotificationColor(notification.type, notification.body);

  return (
    <TouchableOpacity
      style={[styles.container, !notification.read && styles.unreadContainer]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View
          style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}
        >
          <FontAwesomeIcon
            icon={getNotificationIcon(notification.type, notification.body)}
            size={20}
            color={iconColor}
          />
        </View>

        <View style={styles.textContainer}>
          <View style={styles.header}>
            <Text
              style={[styles.title, !notification.read && styles.unreadTitle]}
            >
              {notification.title}
            </Text>
            {!notification.read && (
              <FontAwesomeIcon
                icon={faCircle}
                size={8}
                color='#007AFF'
                style={styles.unreadDot}
              />
            )}
          </View>

          <Text style={styles.body} numberOfLines={2}>
            {notification.body}
          </Text>

          <Text style={styles.timestamp}>
            {formatTimestamp(notification.timestamp)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginVertical: 4,
      marginHorizontal: 16,
      ...createCustomShadow(theme, {
        height: 1,
        opacity: 0.1,
        radius: 3,
        elevation: 2,
      }),
    },
    unreadContainer: {
      borderLeftWidth: 4,
      borderLeftColor: '#007AFF',
    },
    content: {
      flexDirection: 'row',
      padding: 16,
      alignItems: 'flex-start',
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    textContainer: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
    },
    unreadTitle: {
      fontWeight: '700',
    },
    unreadDot: {
      marginLeft: 8,
    },
    body: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
      marginBottom: 8,
    },
    timestamp: {
      fontSize: 12,
      color: theme.colors.textLight,
      fontWeight: '500',
    },
  });

NotificationItem.propTypes = {
  notification: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    body: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    read: PropTypes.bool.isRequired,
    studentAuthCode: PropTypes.string,
  }).isRequired,
  onPress: PropTypes.func,
  userType: PropTypes.string,
};

export default NotificationItem;
