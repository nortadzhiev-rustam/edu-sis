/**
 * Notification Demo Screen
 * Demonstrates all notification API features
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNotificationAPI } from '../hooks/useNotificationAPI';
import NotificationManager from '../components/NotificationManager';
import { Colors, Typography, Spacing } from '../styles/GlobalStyles';

const NotificationDemoScreen = ({ navigation }) => {
  const {
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    fetchCategories,
    fetchStatistics,
    sendGradeNotification,
    sendAttendanceNotification,
    sendHomeworkNotification,
    sendAnnouncement,
    sendEmergencyNotification,
    clearError,
  } = useNotificationAPI();

  const [notifications, setNotifications] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [showNotificationManager, setShowNotificationManager] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load notifications
      const notificationsResponse = await fetchNotifications({ page: 1, limit: 10 });
      if (notificationsResponse?.success) {
        setNotifications(notificationsResponse.data || []);
      }

      // Load categories
      const categoriesResponse = await fetchCategories();
      if (categoriesResponse?.success) {
        setCategories(categoriesResponse.data || []);
      }

      // Load statistics (if user is staff)
      const statsResponse = await fetchStatistics();
      if (statsResponse?.success) {
        setStatistics(statsResponse.data);
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await markAsRead(notificationId);
      if (response?.success) {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        );
        Alert.alert('Success', 'Notification marked as read');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await markAllAsRead();
      if (response?.success) {
        setNotifications(prev =>
          prev.map(notification => ({ ...notification, read: true }))
        );
        Alert.alert('Success', 'All notifications marked as read');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  // Demo functions for different notification types

  const sendDemoGradeNotification = async () => {
    try {
      const response = await sendGradeNotification(
        123, // student ID
        'Mathematics',
        'A+',
        'Excellent work on your algebra test!'
      );
      if (response?.success) {
        Alert.alert('Success', 'Grade notification sent!');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to send grade notification');
    }
  };

  const sendDemoAttendanceNotification = async () => {
    try {
      const response = await sendAttendanceNotification(
        123, // student ID
        '2024-01-15',
        'Present',
        'Thank you for attending today\'s class.'
      );
      if (response?.success) {
        Alert.alert('Success', 'Attendance notification sent!');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to send attendance notification');
    }
  };

  const sendDemoHomeworkNotification = async () => {
    try {
      const response = await sendHomeworkNotification(
        [123, 124, 125], // student IDs
        'Science',
        '2024-01-20',
        'Complete Chapter 5 exercises and prepare for lab session.'
      );
      if (response?.success) {
        Alert.alert('Success', 'Homework notification sent!');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to send homework notification');
    }
  };

  const sendDemoAnnouncement = async () => {
    try {
      const response = await sendAnnouncement(
        'School Holiday Notice',
        'School will be closed on January 26th for Republic Day. Classes will resume on January 27th.',
        'all',
        'normal'
      );
      if (response?.success) {
        Alert.alert('Success', 'Announcement sent!');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to send announcement');
    }
  };

  const sendDemoEmergencyNotification = async () => {
    try {
      const response = await sendEmergencyNotification(
        'Weather Alert',
        'Due to heavy rainfall, all outdoor activities are cancelled. Students should remain indoors.',
        'all'
      );
      if (response?.success) {
        Alert.alert('Success', 'Emergency notification sent!');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to send emergency notification');
    }
  };

  const renderDemoButton = (title, onPress, icon, color = Colors.primary) => (
    <TouchableOpacity
      style={[styles.demoButton, { backgroundColor: color }]}
      onPress={onPress}
      disabled={loading}
    >
      <Icon name={icon} size={20} color={Colors.surface} />
      <Text style={styles.demoButtonText}>{title}</Text>
    </TouchableOpacity>
  );

  const renderNotificationItem = (notification) => (
    <View key={notification.id} style={styles.notificationItem}>
      <View style={styles.notificationHeader}>
        <Text style={styles.notificationTitle}>{notification.title}</Text>
        {!notification.read && <View style={styles.unreadDot} />}
      </View>
      <Text style={styles.notificationMessage}>{notification.message}</Text>
      <View style={styles.notificationActions}>
        <Text style={styles.notificationDate}>
          {new Date(notification.created_at).toLocaleDateString()}
        </Text>
        {!notification.read && (
          <TouchableOpacity
            onPress={() => handleMarkAsRead(notification.id)}
            style={styles.markReadButton}
          >
            <Text style={styles.markReadButtonText}>Mark as Read</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification API Demo</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError} style={styles.clearErrorButton}>
              <Text style={styles.clearErrorButtonText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}

        {/* Statistics */}
        {statistics && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Statistics</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{statistics.total || 0}</Text>
                <Text style={styles.statLabel}>Total Notifications</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{statistics.unread || 0}</Text>
                <Text style={styles.statLabel}>Unread</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{statistics.sent_today || 0}</Text>
                <Text style={styles.statLabel}>Sent Today</Text>
              </View>
            </View>
          </View>
        )}

        {/* Demo Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Demo Actions</Text>
          
          {renderDemoButton(
            'Send Grade Notification',
            sendDemoGradeNotification,
            'grade',
            Colors.success
          )}
          
          {renderDemoButton(
            'Send Attendance Notification',
            sendDemoAttendanceNotification,
            'event-available',
            Colors.info
          )}
          
          {renderDemoButton(
            'Send Homework Notification',
            sendDemoHomeworkNotification,
            'assignment',
            Colors.warning
          )}
          
          {renderDemoButton(
            'Send Announcement',
            sendDemoAnnouncement,
            'campaign',
            Colors.primary
          )}
          
          {renderDemoButton(
            'Send Emergency Alert',
            sendDemoEmergencyNotification,
            'warning',
            Colors.error
          )}
          
          {renderDemoButton(
            'Open Notification Manager',
            () => setShowNotificationManager(true),
            'settings',
            Colors.secondary
          )}
        </View>

        {/* Recent Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Notifications</Text>
            <TouchableOpacity
              onPress={handleMarkAllAsRead}
              style={styles.markAllButton}
            >
              <Text style={styles.markAllButtonText}>Mark All Read</Text>
            </TouchableOpacity>
          </View>
          
          {notifications.length > 0 ? (
            notifications.map(renderNotificationItem)
          ) : (
            <Text style={styles.emptyText}>No notifications found</Text>
          )}
        </View>

        {/* Categories */}
        {categories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Categories</Text>
            <View style={styles.categoriesContainer}>
              {categories.map((category) => (
                <View key={category.id} style={styles.categoryChip}>
                  <Text style={styles.categoryChipText}>{category.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <NotificationManager
        visible={showNotificationManager}
        onClose={() => setShowNotificationManager(false)}
        userRole="staff"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.small,
    marginRight: Spacing.medium,
  },
  headerTitle: {
    ...Typography.heading2,
    color: Colors.text,
  },
  content: {
    flex: 1,
    padding: Spacing.medium,
  },
  errorContainer: {
    backgroundColor: Colors.error,
    padding: Spacing.medium,
    borderRadius: 8,
    marginBottom: Spacing.medium,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    ...Typography.body2,
    color: Colors.surface,
    flex: 1,
  },
  clearErrorButton: {
    padding: Spacing.small,
  },
  clearErrorButtonText: {
    ...Typography.body2,
    color: Colors.surface,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: Spacing.large,
  },
  loadingText: {
    ...Typography.body1,
    color: Colors.textSecondary,
    marginTop: Spacing.small,
  },
  section: {
    marginBottom: Spacing.large,
  },
  sectionTitle: {
    ...Typography.heading3,
    color: Colors.text,
    marginBottom: Spacing.medium,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.medium,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    padding: Spacing.medium,
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...Typography.heading2,
    color: Colors.primary,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.medium,
    borderRadius: 8,
    marginBottom: Spacing.small,
  },
  demoButtonText: {
    ...Typography.body1,
    color: Colors.surface,
    fontWeight: '600',
    marginLeft: Spacing.small,
  },
  notificationItem: {
    backgroundColor: Colors.surface,
    padding: Spacing.medium,
    borderRadius: 8,
    marginBottom: Spacing.small,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  notificationTitle: {
    ...Typography.body1,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  notificationMessage: {
    ...Typography.body2,
    color: Colors.textSecondary,
    marginBottom: Spacing.small,
  },
  notificationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  markReadButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.small,
    paddingVertical: 4,
    borderRadius: 4,
  },
  markReadButtonText: {
    ...Typography.caption,
    color: Colors.surface,
    fontWeight: '600',
  },
  markAllButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: 4,
  },
  markAllButtonText: {
    ...Typography.body2,
    color: Colors.surface,
    fontWeight: '600',
  },
  emptyText: {
    ...Typography.body1,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryChip: {
    backgroundColor: Colors.lightGray,
    paddingHorizontal: Spacing.small,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: Spacing.small,
    marginBottom: Spacing.small,
  },
  categoryChipText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});

export default NotificationDemoScreen;
