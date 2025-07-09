import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
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
  scrollViewRef, // Reference to parent ScrollView for scroll locking
}) => {
  const { theme, fontSizes } = useTheme();
  const styles = createStyles(theme, fontSizes);

  // Animation values for swipe gestures
  const translateX = useSharedValue(0);
  const [isRevealed, setIsRevealed] = useState(false);

  // Swipe thresholds
  const BUTTON_WIDTH = 80;
  const TOTAL_BUTTON_WIDTH = BUTTON_WIDTH * 2; // Delete + Leave buttons
  const MARK_READ_BUTTON_WIDTH = 80;
  const FORCE_DELETE_THRESHOLD = 200; // Force delete when swiped this far

  // Helper functions that can be called from gesture handlers
  const lockScroll = () => {
    if (scrollViewRef?.current) {
      scrollViewRef.current.setNativeProps({ scrollEnabled: false });
    }
  };

  const unlockScroll = () => {
    if (scrollViewRef?.current) {
      scrollViewRef.current.setNativeProps({ scrollEnabled: true });
    }
  };

  const handleForceDelete = () => {
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
  };

  const handleMarkAsRead = () => {
    onMarkAsRead(conversation);
    resetPosition();
  };

  // Create pan gesture for swipe actions
  const panGesture = Gesture.Pan()
    .onStart(() => {
      runOnJS(lockScroll)();
    })
    .onUpdate((event) => {
      const { translationX } = event;

      // Left swipe to reveal action buttons
      if (translationX < 0) {
        translateX.value = Math.max(translationX, -TOTAL_BUTTON_WIDTH);
      } else if (
        translationX > 0 &&
        onMarkAsRead &&
        conversation.unread_count > 0
      ) {
        // Right swipe for mark as read (only if unread)
        translateX.value = Math.min(translationX, MARK_READ_BUTTON_WIDTH);
      } else if (translationX > 0 && isRevealed) {
        // Allow right swipe to hide buttons when revealed
        const currentOffset = isRevealed ? -TOTAL_BUTTON_WIDTH : 0;
        translateX.value = Math.min(currentOffset + translationX, 0);
      }
    })
    .onEnd((event) => {
      const { translationX } = event;

      runOnJS(unlockScroll)();

      // Check for force delete (very long left swipe)
      if (translationX < -FORCE_DELETE_THRESHOLD && onDelete) {
        runOnJS(handleForceDelete)();
      } else if (translationX < -TOTAL_BUTTON_WIDTH / 2 && !isRevealed) {
        // Swipe left enough to reveal action buttons
        translateX.value = withSpring(-TOTAL_BUTTON_WIDTH);
        runOnJS(setIsRevealed)(true);
      } else if (translationX > TOTAL_BUTTON_WIDTH / 2 && isRevealed) {
        // Swipe right enough to hide action buttons
        translateX.value = withSpring(0);
        runOnJS(setIsRevealed)(false);
      } else if (
        translationX > MARK_READ_BUTTON_WIDTH / 2 &&
        onMarkAsRead &&
        conversation.unread_count > 0 &&
        !isRevealed
      ) {
        // Swipe right enough to trigger mark as read (only when not revealed)
        runOnJS(handleMarkAsRead)();
      } else {
        // Snap to appropriate position based on current state
        const targetValue = isRevealed ? -TOTAL_BUTTON_WIDTH : 0;
        translateX.value = withSpring(targetValue);
      }
    })
    .activeOffsetX([-10, 10]) // Only activate when horizontal movement is significant
    .failOffsetY([-20, 20]); // Fail if vertical movement is too large

  // Reset position animation
  const resetPosition = () => {
    translateX.value = withSpring(0);
    setIsRevealed(false);
  };

  // Animated style for the conversation item
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      // Dynamic rounded corners for the conversation item
      borderTopRightRadius: interpolate(
        translateX.value,
        [-TOTAL_BUTTON_WIDTH, 0],
        [0, 16]
      ),
      borderBottomRightRadius: interpolate(
        translateX.value,
        [-TOTAL_BUTTON_WIDTH, 0],
        [0, 16]
      ),
      borderTopLeftRadius: interpolate(
        translateX.value,
        [0, MARK_READ_BUTTON_WIDTH],
        [16, 0]
      ),
      borderBottomLeftRadius: interpolate(
        translateX.value,
        [0, MARK_READ_BUTTON_WIDTH],
        [16, 0]
      ),
    };
  });

  // Animated style for delete button
  const deleteButtonStyle = useAnimatedStyle(() => {
    const flex = interpolate(
      translateX.value,
      [-FORCE_DELETE_THRESHOLD, -TOTAL_BUTTON_WIDTH, 0],
      [2.5, 1, 1]
    );

    // Use string interpolation for backgroundColor
    const redValue = Math.round(
      interpolate(
        translateX.value,
        [-FORCE_DELETE_THRESHOLD, -TOTAL_BUTTON_WIDTH, 0],
        [26, 59, 59] // RGB values for red component
      )
    );

    return {
      flex,
      backgroundColor: `rgb(255, ${redValue}, ${redValue})`,
    };
  });

  // Animated style for delete icon
  const deleteIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(
            translateX.value,
            [-FORCE_DELETE_THRESHOLD, -TOTAL_BUTTON_WIDTH, 0],
            [1.2, 1, 1]
          ),
        },
      ],
    };
  });

  // Animated style for mark as read button
  const markReadStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        translateX.value,
        [0, MARK_READ_BUTTON_WIDTH / 2, MARK_READ_BUTTON_WIDTH],
        [0, 0.7, 1]
      ),
    };
  });

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

  // Get all member photos for composite avatar
  const getAllMemberPhotos = () => {
    let allMembers = [];

    // Handle grouped members structure (staff/students)
    if (conversation.members?.staff || conversation.members?.students) {
      allMembers = [
        ...(conversation.members.staff || []),
        ...(conversation.members.students || []),
      ];
    }
    // Handle flat members array
    else if (Array.isArray(conversation.members)) {
      allMembers = conversation.members;
    }

    // Filter members with photos and limit to first 4 for display
    const membersWithPhotos = allMembers
      .filter((member) => member.photo)
      .slice(0, 4);

    return membersWithPhotos;
  };

  // Get positioning for composite avatar images
  const getCompositeAvatarPosition = (index, totalCount) => {
    const size = 24; // Half of the container size (48/2)

    if (totalCount === 2) {
      return {
        width: size,
        height: size,
        position: 'absolute',
        top: index === 0 ? 0 : size,
        left: size / 2,
      };
    } else if (totalCount === 3) {
      if (index === 0) {
        return {
          width: size,
          height: size,
          position: 'absolute',
          top: 0,
          left: size / 2,
        };
      } else {
        return {
          width: size,
          height: size,
          position: 'absolute',
          top: size,
          left: index === 1 ? 0 : size,
        };
      }
    } else if (totalCount >= 4) {
      return {
        width: size,
        height: size,
        position: 'absolute',
        top: index < 2 ? 0 : size,
        left: index % 2 === 0 ? 0 : size,
      };
    }

    return {};
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
              deleteButtonStyle,
            ]}
          >
            <TouchableOpacity
              style={styles.deleteButtonContent}
              onPress={handleDelete}
            >
              <Animated.View style={deleteIconStyle}>
                <FontAwesomeIcon icon={faTrash} size={18} color='#FFFFFF' />
              </Animated.View>
              <Text style={styles.actionText}>Delete</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Mark as read action (right swipe) */}
      {conversation.unread_count > 0 && (
        <Animated.View style={[styles.markReadAction, markReadStyle]}>
          <FontAwesomeIcon icon={faCheckCircle} size={20} color='#FFFFFF' />
          <Text style={styles.actionText}>Mark Read</Text>
        </Animated.View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {renderSwipeActions()}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.animatedContainer, animatedStyle]}>
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
              {(() => {
                const membersWithPhotos = getAllMemberPhotos();

                // Show composite avatar if multiple photos available
                if (membersWithPhotos.length > 1) {
                  return (
                    <View style={styles.compositeAvatar}>
                      {membersWithPhotos.map((member, index) => (
                        <Image
                          key={member.id}
                          source={{ uri: member.photo }}
                          style={[
                            styles.compositeAvatarImage,
                            getCompositeAvatarPosition(
                              index,
                              membersWithPhotos.length
                            ),
                          ]}
                          resizeMode='cover'
                        />
                      ))}
                    </View>
                  );
                }

                // Show single photo if available
                if (membersWithPhotos.length === 1) {
                  return (
                    <Image
                      source={{ uri: membersWithPhotos[0].photo }}
                      style={styles.avatarImage}
                      resizeMode='cover'
                    />
                  );
                }

                // Show creator photo if no member photos
                if (conversation.creator?.photo) {
                  return (
                    <Image
                      source={{ uri: conversation.creator.photo }}
                      style={styles.avatarImage}
                      resizeMode='cover'
                    />
                  );
                }

                // Default icon
                return (
                  <FontAwesomeIcon
                    icon={getConversationIcon()}
                    size={20}
                    color={theme.colors.primary}
                  />
                );
              })()}
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
      </GestureDetector>
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
    compositeAvatar: {
      width: 48,
      height: 48,
      position: 'relative',
    },
    compositeAvatarImage: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.surface,
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
