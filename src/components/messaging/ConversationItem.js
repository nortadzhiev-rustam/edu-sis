import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Alert,
  PanResponder,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faUser,
  faUsers,
  faTrash,
  faCheckCircle,
  faSignOutAlt,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { processHtmlContent } from '../../utils/htmlUtils';

const ConversationItem = ({
  conversation,
  onPress,
  onDelete,
  onLeave,
  onMarkAsRead,
  showUnreadBadge = true,
  showMemberCount = true,
}) => {
  const { theme, fontSizes } = useTheme();
  const styles = createStyles(theme, fontSizes);

  // Animation values for swipe gestures
  const [translateX] = useState(new Animated.Value(0));
  const [isRevealed, setIsRevealed] = useState(false);

  // Swipe thresholds
  const BUTTON_WIDTH = 80;
  const TOTAL_BUTTON_WIDTH = BUTTON_WIDTH * 2; // Delete + Leave buttons
  const MARK_READ_BUTTON_WIDTH = 80;
  const FORCE_DELETE_THRESHOLD = 200; // Force delete when swiped this far

  // Create PanResponder for swipe gestures
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_evt, gestureState) => {
      // Only respond to horizontal swipes
      return (
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
        Math.abs(gestureState.dx) > 5
      );
    },
    onPanResponderGrant: () => {
      // Stop any ongoing animations
      translateX.stopAnimation();
      translateX.setOffset(translateX._value);
      translateX.setValue(0);
    },
    onPanResponderMove: (_evt, gestureState) => {
      // Left swipe to reveal action buttons
      if (gestureState.dx < 0) {
        const newValue = Math.max(gestureState.dx, -TOTAL_BUTTON_WIDTH);
        translateX.setValue(newValue);
      } else if (
        gestureState.dx > 0 &&
        onMarkAsRead &&
        conversation.unread_count > 0
      ) {
        // Right swipe for mark as read (only if unread)
        const newValue = Math.min(gestureState.dx, MARK_READ_BUTTON_WIDTH);
        translateX.setValue(newValue);
      } else if (gestureState.dx > 0 && isRevealed) {
        // Allow right swipe to hide buttons when revealed
        const currentOffset = isRevealed ? -TOTAL_BUTTON_WIDTH : 0;
        const newValue = Math.min(currentOffset + gestureState.dx, 0);
        translateX.setValue(newValue);
      }
    },
    onPanResponderRelease: (_evt, gestureState) => {
      translateX.flattenOffset();

      // Check for force delete (very long left swipe)
      if (gestureState.dx < -FORCE_DELETE_THRESHOLD && onDelete) {
        Alert.alert(
          'Delete Conversation',
          'Are you sure you want to delete this conversation?',
          [
            { text: 'Cancel', style: 'cancel', onPress: resetPosition },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => {
                onDelete(conversation);
                resetPosition();
              },
            },
          ]
        );
      } else if (gestureState.dx < -TOTAL_BUTTON_WIDTH / 2 && !isRevealed) {
        // Swipe left enough to reveal action buttons
        Animated.spring(translateX, {
          toValue: -TOTAL_BUTTON_WIDTH,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }).start();
        setIsRevealed(true);
      } else if (gestureState.dx > TOTAL_BUTTON_WIDTH / 2 && isRevealed) {
        // Swipe right enough to hide action buttons
        resetPosition();
      } else if (
        gestureState.dx > MARK_READ_BUTTON_WIDTH / 2 &&
        onMarkAsRead &&
        conversation.unread_count > 0 &&
        !isRevealed
      ) {
        // Swipe right enough to trigger mark as read (only when not revealed)
        onMarkAsRead(conversation);
        resetPosition();
      } else {
        // Snap to appropriate position based on current state
        const targetValue = isRevealed ? -TOTAL_BUTTON_WIDTH : 0;
        Animated.spring(translateX, {
          toValue: targetValue,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }).start();
      }
    },
  });

  // Reset position animation
  const resetPosition = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
    setIsRevealed(false);
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInHours < 168) {
      // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Get conversation icon based on member count
  const getConversationIcon = () => {
    // Handle new grouped members structure
    const memberCount =
      conversation.members?.staff?.length +
        conversation.members?.students?.length ||
      conversation.members?.length ||
      0;
    return memberCount > 2 ? faUsers : faUser;
  };

  // Get last message preview
  const getLastMessagePreview = () => {
    if (!conversation.last_message) {
      return 'No messages yet';
    }

    const { content, message_type } = conversation.last_message;

    if (message_type === 'text') {
      // Process HTML content and limit to single line for preview
      const processedContent = processHtmlContent(content || 'Message');
      // Replace line breaks with spaces for preview and limit length
      return (
        processedContent.replace(/\n/g, ' ').substring(0, 100) +
        (processedContent.length > 100 ? '...' : '')
      );
    } else if (message_type === 'image') {
      return '📷 Image';
    } else if (message_type === 'file') {
      return '📎 File';
    } else {
      return 'Message';
    }
  };

  // Handle delete button press
  const handleDelete = () => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(conversation);
            resetPosition();
          },
        },
      ]
    );
  };

  // Handle leave button press
  const handleLeave = () => {
    Alert.alert(
      'Leave Conversation',
      'Are you sure you want to leave this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            onLeave(conversation);
            resetPosition();
          },
        },
      ]
    );
  };

  // Render swipe action backgrounds
  const renderSwipeActions = () => (
    <View style={styles.swipeActionsContainer}>
      {/* Action buttons behind (left swipe) */}
      <View style={styles.leftActions}>
        {/* Leave button */}
        {onLeave && (
          <TouchableOpacity
            style={[styles.actionButton, styles.leaveAction]}
            onPress={handleLeave}
          >
            <FontAwesomeIcon icon={faSignOutAlt} size={18} color='#FFFFFF' />
            <Text style={styles.actionText}>Leave</Text>
          </TouchableOpacity>
        )}

        {/* Delete button - expands when force swiping */}
        {onDelete && (
          <Animated.View
            style={[
              styles.actionButton,
              styles.deleteAction,
              {
                flex: translateX.interpolate({
                  inputRange: [-FORCE_DELETE_THRESHOLD, -TOTAL_BUTTON_WIDTH, 0],
                  outputRange: [2.5, 1, 1], // Expands using flex instead of width
                  extrapolate: 'clamp',
                }),
                backgroundColor: translateX.interpolate({
                  inputRange: [-FORCE_DELETE_THRESHOLD, -TOTAL_BUTTON_WIDTH, 0],
                  outputRange: ['#FF1A1A', '#FF3B30', '#FF3B30'], // Darker red when force swiping
                  extrapolate: 'clamp',
                }),
              },
            ]}
          >
            <TouchableOpacity
              style={styles.deleteButtonContent}
              onPress={handleDelete}
            >
              <Animated.View
                style={{
                  transform: [
                    {
                      scale: translateX.interpolate({
                        inputRange: [
                          -FORCE_DELETE_THRESHOLD,
                          -TOTAL_BUTTON_WIDTH,
                          0,
                        ],
                        outputRange: [1.2, 1, 1], // Scale up icon when force swiping
                        extrapolate: 'clamp',
                      }),
                    },
                  ],
                }}
              >
                <FontAwesomeIcon icon={faTrash} size={18} color='#FFFFFF' />
              </Animated.View>
              <Text style={styles.actionText}>Delete</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Mark as read action (right swipe) */}
      {conversation.unread_count > 0 && (
        <Animated.View
          style={[
            styles.markReadAction,
            {
              opacity: translateX.interpolate({
                inputRange: [
                  0,
                  MARK_READ_BUTTON_WIDTH / 2,
                  MARK_READ_BUTTON_WIDTH,
                ],
                outputRange: [0, 0.7, 1],
                extrapolate: 'clamp',
              }),
            },
          ]}
        >
          <FontAwesomeIcon icon={faCheckCircle} size={20} color='#FFFFFF' />
          <Text style={styles.actionText}>Mark Read</Text>
        </Animated.View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {renderSwipeActions()}
      <Animated.View
        style={[
          styles.animatedContainer,
          {
            transform: [{ translateX }],
            // Dynamic rounded corners for the conversation item
            borderTopRightRadius: translateX.interpolate({
              inputRange: [-TOTAL_BUTTON_WIDTH, 0],
              outputRange: [0, 16], // Remove right radius when swiped left
              extrapolate: 'clamp',
            }),
            borderBottomRightRadius: translateX.interpolate({
              inputRange: [-TOTAL_BUTTON_WIDTH, 0],
              outputRange: [0, 16], // Remove right radius when swiped left
              extrapolate: 'clamp',
            }),
            borderTopLeftRadius: translateX.interpolate({
              inputRange: [0, MARK_READ_BUTTON_WIDTH],
              outputRange: [16, 0], // Remove left radius when swiped right
              extrapolate: 'clamp',
            }),
            borderBottomLeftRadius: translateX.interpolate({
              inputRange: [0, MARK_READ_BUTTON_WIDTH],
              outputRange: [16, 0], // Remove left radius when swiped right
              extrapolate: 'clamp',
            }),
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={[
            styles.conversationItem,
            conversation.unread_count > 0 && styles.unreadConversation,
          ]}
          onPress={() => onPress(conversation)}
          activeOpacity={0.7}
        >
          {/* Conversation Icon/Avatar */}
          <View style={styles.conversationIcon}>
            {conversation.creator?.photo ? (
              <Image
                source={{ uri: conversation.creator.photo }}
                style={styles.avatarImage}
                resizeMode='cover'
              />
            ) : (
              <FontAwesomeIcon
                icon={getConversationIcon()}
                size={20}
                color={theme.colors.primary}
              />
            )}
          </View>

          {/* Conversation Content */}
          <View style={styles.conversationContent}>
            <View style={styles.conversationHeader}>
              <Text
                style={[
                  styles.conversationTopic,
                  conversation.unread_count > 0 && styles.unreadTopic,
                ]}
                numberOfLines={1}
              >
                {conversation.topic}
              </Text>
              <Text style={styles.conversationTime}>
                {formatTimestamp(conversation.updated_at)}
              </Text>
            </View>

            <Text
              style={[
                styles.lastMessage,
                conversation.unread_count > 0 && styles.unreadLastMessage,
              ]}
              numberOfLines={2}
            >
              {getLastMessagePreview()}
            </Text>

            <View style={styles.conversationFooter}>
              {showMemberCount && (
                <Text style={styles.memberCount}>
                  {(() => {
                    // Handle new grouped members structure
                    const memberCount =
                      conversation.members?.staff?.length +
                        conversation.members?.students?.length ||
                      conversation.members?.length ||
                      0;
                    return `${memberCount} member${
                      memberCount !== 1 ? 's' : ''
                    }`;
                  })()}
                </Text>
              )}

              {showUnreadBadge && conversation.unread_count > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>
                    {conversation.unread_count > 99
                      ? '99+'
                      : conversation.unread_count}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const createStyles = (theme, fontSizes) => {
  // Safety check for fontSizes
  const safeFontSizes = fontSizes || {
    small: 12,
    medium: 16,
    large: 20,
  };

  return StyleSheet.create({
    container: {
      position: 'relative',
    },
    swipeActionsContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    leftActions: {
      flexDirection: 'row',
      height: '100%',
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
    },
    actionButton: {
      justifyContent: 'center',
      alignItems: 'center',
      flex: 1, // Use flex instead of fixed width
      height: '100%',
      minWidth: 80, // Minimum width
    },
    leaveAction: {
      backgroundColor: '#FF9500', // Orange for leave
      // No rounded corners - connects to conversation item on left and delete button on right
    },
    deleteAction: {
      backgroundColor: '#FF3B30', // Red for delete
      borderTopRightRadius: 16, // Only right corners rounded (outer edge)
      borderBottomRightRadius: 16,
    },
    deleteButtonContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      height: '100%',
    },
    markReadAction: {
      backgroundColor: '#34C759',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      height: '100%',
      minWidth: 80,
      borderTopLeftRadius: 16,
      borderBottomLeftRadius: 16,
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
    },
    actionText: {
      color: '#FFFFFF',
      fontSize: safeFontSizes.small,
      fontWeight: '600',
      marginTop: 4,
    },
    animatedContainer: {
      backgroundColor: theme.colors.surface,
    },
    conversationItem: {
      flexDirection: 'row',
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      borderRadius: 16,
    },
    unreadConversation: {
      backgroundColor: theme.colors.primary + '05',
    },
    conversationIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      overflow: 'hidden',
    },
    avatarImage: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    conversationContent: {
      flex: 1,
    },
    conversationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    conversationTopic: {
      flex: 1,
      fontSize: safeFontSizes.medium,
      fontWeight: '600',
      color: theme.colors.text,
      marginRight: 8,
    },
    unreadTopic: {
      fontWeight: '700',
      color: theme.colors.text,
    },
    conversationTime: {
      fontSize: safeFontSizes.small,
      color: theme.colors.textSecondary,
    },
    lastMessage: {
      fontSize: safeFontSizes.small,
      color: theme.colors.textSecondary,
      marginBottom: 8,
      lineHeight: 18,
    },
    unreadLastMessage: {
      fontWeight: '500',
      color: theme.colors.text,
    },
    conversationFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    memberCount: {
      fontSize: safeFontSizes.small,
      color: theme.colors.textSecondary,
    },
    unreadBadge: {
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
    },
    unreadText: {
      fontSize: safeFontSizes.small,
      fontWeight: 'bold',
      color: theme.colors.headerText,
    },
  });
};

export default ConversationItem;
