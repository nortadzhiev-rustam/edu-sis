import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faBell,
  faTrash,
  faCheckDouble,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationItem from '../components/NotificationItem';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const {
    notifications,
    unreadCount,
    loading,
    refreshNotifications,
    clearAll,
    markAsRead,
    markAllAPINotificationsAsRead,
    markAllStudentNotificationsAsRead,
    currentStudentAuthCode,
    getCurrentStudentNotifications,
    getCurrentStudentUnreadCount,
    studentNotifications,
    studentUnreadCounts,
    loadStudentNotifications,
    setCurrentStudent,
  } = useNotifications();

  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'behavior', 'attendance', 'grade', 'homework', 'announcement', 'messaging'
  const [refreshing, setRefreshing] = useState(false);
  const [userType, setUserType] = useState(null);

  // Get user type from route params or AsyncStorage
  useEffect(() => {
    const getUserType = async () => {
      try {
        // First check route params (if passed from parent screen)
        if (route?.params?.userType) {
          setUserType(route.params.userType);

          // If this is a parent viewing student notifications
          if (route.params.userType === 'parent' && route?.params?.authCode) {
            const studentAuthCode = route.params.authCode;
            console.log(
              '📱 NOTIFICATION: Parent viewing student notifications for authCode:',
              studentAuthCode
            );

            // Set the current student context for parent view
            setCurrentStudent(studentAuthCode);

            // Load notifications for this specific student if not already loaded
            if (!studentNotifications[studentAuthCode]) {
              console.log(
                '📱 NOTIFICATION: Loading notifications for student...'
              );
              await loadStudentNotifications(studentAuthCode);
            }
          }
          // If this is a student accessing directly (not through parent),
          // we need to ensure their notifications are loaded
          else if (route.params.userType === 'student') {
            // Check if we have student authCode from route params
            const studentAuthCode = route?.params?.authCode;
            if (studentAuthCode && !studentNotifications[studentAuthCode]) {
              // Load notifications for this specific student
              await loadStudentNotifications(studentAuthCode);
            }
          }
          return;
        }

        // Otherwise get from AsyncStorage
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          // Use the actual user type from userData
          const actualUserType = user.userType || user.user_type || user.type;
          setUserType(actualUserType);
          console.log(
            '📱 NOTIFICATION: Detected user type from userData:',
            actualUserType
          );
        } else {
          // No user data found - user is not logged in
          console.warn(
            '⚠️ NOTIFICATION: No user data found, user not logged in'
          );
          console.log('🔄 NOTIFICATION: Redirecting to home screen...');

          // Navigate back to home screen since no user is logged in
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
          return;
        }
      } catch (error) {
        console.error('❌ NOTIFICATION: Error getting user type:', error);
        // Navigate back to home screen on error
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      }
    };

    getUserType();
  }, [route?.params?.userType, route?.params?.authCode, navigation]);

  const styles = createStyles(theme);

  useEffect(() => {
    // Load notifications when screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      refreshNotifications();
    });

    return unsubscribe;
  }, [navigation, refreshNotifications]);

  // Load notifications on component mount
  useEffect(() => {
    refreshNotifications();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            const success = await clearAll();
            if (success) {
              Alert.alert('Success', 'All notifications have been cleared.');
            } else {
              Alert.alert('Error', 'Failed to clear notifications.');
            }
          },
        },
      ]
    );
  };

  const handleMarkAllAsRead = async () => {
    try {
      let apiResponse;

      // Use appropriate API method based on user type and context
      if (userType === 'parent' && currentStudentAuthCode) {
        // In parent context, mark student notifications as read
        apiResponse = await markAllStudentNotificationsAsRead(
          currentStudentAuthCode
        );
      } else {
        // For teachers and students, mark their own notifications as read
        apiResponse = await markAllAPINotificationsAsRead();
      }

      if (apiResponse?.success) {
        Alert.alert('Success', 'All notifications marked as read.');
        await refreshNotifications(); // Refresh to get updated data
        return;
      }

      // Fallback to local method
      const activeNotifications = getActiveNotifications();
      const unreadNotifications = activeNotifications.filter((n) => !n.read);

      for (const notification of unreadNotifications) {
        await markAsRead(notification.id);
      }

      Alert.alert('Success', 'All notifications marked as read.');
    } catch (error) {
      Alert.alert('Error', 'Failed to mark notifications as read.');
    }
  };

  // Determine which notifications to show based on user type and context
  const getActiveNotifications = () => {
    // If we're in parent context (viewing student notifications), show student notifications
    if (userType === 'parent' && currentStudentAuthCode) {
      return getCurrentStudentNotifications();
    }
    // If we're a student with authCode passed from route params, check if we have student-specific notifications
    if (userType === 'student' && route?.params?.authCode) {
      const studentAuthCode = route.params.authCode;
      const studentNotifs = studentNotifications[studentAuthCode];
      if (studentNotifs && studentNotifs.length > 0) {
        return studentNotifs;
      }
    }
    // For teachers and students (fallback), show their own notifications
    return notifications;
  };

  // Get active unread count
  const getActiveUnreadCount = () => {
    // If we're in parent context (viewing student notifications), show student unread count
    if (userType === 'parent' && currentStudentAuthCode) {
      return getCurrentStudentUnreadCount();
    }
    // If we're a student with authCode passed from route params, check student-specific unread count
    if (userType === 'student' && route?.params?.authCode) {
      const studentAuthCode = route.params.authCode;
      return studentUnreadCounts[studentAuthCode] || 0;
    }
    // For teachers and students (fallback), show their own unread count
    return unreadCount;
  };

  const getFilteredNotifications = () => {
    const activeNotifications = getActiveNotifications();

    switch (filter) {
      case 'unread':
        return activeNotifications.filter((n) => !n.read);
      case 'behavior':
        return activeNotifications.filter((n) =>
          [
            'behavior',
            'bps_record',
            'bps',
            'discipline',
            'behavior_positive',
            'behavior_negative',
          ].includes(n.type)
        );
      case 'attendance':
        return activeNotifications.filter((n) =>
          [
            'attendance',
            'attendance_absent',
            'attendance_late',
            'attendance_present',
            'attendance_reminder',
          ].includes(n.type)
        );
      case 'grade':
        return activeNotifications.filter((n) =>
          [
            'assessment',
            'grade',
            'grade_updated',
            'assessment_published',
            'grade_released',
            'test_result',
          ].includes(n.type)
        );
      case 'homework':
        return activeNotifications.filter((n) =>
          [
            'homework',
            'homework_assigned',
            'homework_due',
            'homework_submitted',
            'homework_graded',
          ].includes(n.type)
        );
      case 'messaging':
        return activeNotifications.filter((n) =>
          [
            'message',
            'messaging',
            'new_message',
            'message_received',
            'conversation',
            'chat',
          ].includes(n.type)
        );
      case 'announcement':
        return activeNotifications.filter((n) =>
          ['announcement', 'general', 'news', 'event', 'reminder'].includes(
            n.type
          )
        );
      default:
        return activeNotifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();

  const renderNotificationItem = ({ item }) => (
    <NotificationItem
      notification={item}
      userType={userType}
      // NotificationItem will handle navigation automatically
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <FontAwesomeIcon icon={faBell} size={64} color={theme.colors.textLight} />
      <Text style={styles.emptyStateTitle}>No Notifications</Text>
      <Text style={styles.emptyStateSubtitle}>
        {filter === 'unread'
          ? "You're all caught up! No unread notifications."
          : "You'll see your notifications here when you receive them."}
      </Text>
      {!loading && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => refreshNotifications()}
        >
          <Text style={styles.retryButtonText}>Refresh</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFilterButton = (filterType, label) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterType && styles.activeFilterButton,
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === filterType && styles.activeFilterButtonText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Compact Header */}
      <View style={styles.compactHeaderContainer}>
        {/* Navigation Header */}
        <View style={styles.navigationHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {getActiveUnreadCount() > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {getActiveUnreadCount()}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.headerActions}>
            {getActiveUnreadCount() > 0 && (
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={handleMarkAllAsRead}
              >
                <FontAwesomeIcon icon={faCheckDouble} size={18} color='#fff' />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={handleClearAll}
            >
              <FontAwesomeIcon icon={faTrash} size={18} color='#fff' />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Buttons Subheader */}
        <View style={styles.subHeader}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
          >
            {renderFilterButton('all', 'All')}
            {renderFilterButton('unread', 'Unread')}
            {renderFilterButton('behavior', 'Behavior')}
            {renderFilterButton('attendance', 'Attendance')}
            {renderFilterButton('grade', 'Grades')}
            {renderFilterButton('homework', 'Homework')}
            {renderFilterButton('messaging', 'Messages')}
            {renderFilterButton('announcement', 'Announcements')}
          </ScrollView>
        </View>
      </View>

      {/* Notifications List */}
      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredNotifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    // Compact Header Styles
    compactHeaderContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 8,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      overflow: 'hidden',
      zIndex: 1,
    },
    navigationHeader: {
      backgroundColor: theme.colors.headerBackground,
      padding: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
    subHeader: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 5,
      paddingBottom: 5,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Legacy header style (keeping for compatibility)
    header: {
      backgroundColor: theme.colors.headerBackground,
      padding: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      ...theme.shadows.medium,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    headerTitle: {
      color: theme.colors.headerText,
      fontSize: 22,
      fontWeight: 'bold',
      marginRight: 8,
    },
    unreadBadge: {
      backgroundColor: '#FF3B30',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
    },
    unreadBadgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: 'bold',
    },
    headerActions: {
      flexDirection: 'row',
      gap: 10,
    },
    headerActionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterContainer: {
      paddingHorizontal: 8,
      paddingVertical: 12,
      backgroundColor: 'transparent',
    },
    filterButton: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
      marginHorizontal: 4,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    activeFilterButton: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    filterButtonText: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.colors.text,
    },
    activeFilterButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    contentContainer: {
      flex: 1,
    },
    listContainer: {
      paddingVertical: 8,
      flexGrow: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyStateTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateSubtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    retryButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
      marginTop: 16,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

export default NotificationScreen;
