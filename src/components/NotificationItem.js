import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faBell,
  faGraduationCap,
  faCalendarCheck,
  faChartLine,
  faBullhorn,
  faCircle,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationItem = ({ notification, onPress }) => {
  const { theme } = useTheme();
  const { markAsRead } = useNotifications();
  const styles = createStyles(theme);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'attendance':
        return faCalendarCheck;
      case 'grade':
        return faGraduationCap;
      case 'announcement':
        return faBullhorn;
      case 'timetable':
        return faCalendarCheck;
      default:
        return faBell;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'attendance':
        return '#FF9500';
      case 'grade':
        return '#34C759';
      case 'announcement':
        return '#007AFF';
      case 'timetable':
        return '#AF52DE';
      default:
        return '#8E8E93';
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
      // Default action - show notification details
      Alert.alert(
        notification.title,
        notification.body,
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const iconColor = getNotificationColor(notification.type);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !notification.read && styles.unreadContainer,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
          <FontAwesomeIcon
            icon={getNotificationIcon(notification.type)}
            size={20}
            color={iconColor}
          />
        </View>
        
        <View style={styles.textContainer}>
          <View style={styles.header}>
            <Text style={[styles.title, !notification.read && styles.unreadTitle]}>
              {notification.title}
            </Text>
            {!notification.read && (
              <FontAwesomeIcon
                icon={faCircle}
                size={8}
                color="#007AFF"
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
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
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

export default NotificationItem;
