import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Vibration,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faUser,
  faUsers,
  faTrash,
  faCheckCircle,
  faSignOutAlt,
  faCheck,
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
  const [isConfirmDeleteMode, setIsConfirmDeleteMode] = useState(false);
  const [isConfirmLeaveMode, setIsConfirmLeaveMode] = useState(false);

  // Swipe thresholds
  const BUTTON_WIDTH = 80;
  const TOTAL_BUTTON_WIDTH =
    conversation.unread_count > 0 && onMarkAsRead
      ? BUTTON_WIDTH * 3 // Delete + Leave + Mark Read buttons
      : BUTTON_WIDTH * 2; // Delete + Leave buttons

  // Optimized spring configuration for smooth animations
  const springConfig = {
    damping: 20,
    mass: 0.8,
    stiffness: 150,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  };

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

  const handleDeletePress = () => {
    // Light haptic feedback
    Vibration.vibrate(10);
    setIsConfirmDeleteMode(true);
  };

  const handleConfirmDelete = () => {
    // Stronger haptic feedback for confirmation
    Vibration.vibrate(50);
    onDelete(conversation);
    resetPosition();
    setIsConfirmDeleteMode(false);
  };

  const handleLeavePress = () => {
    // Light haptic feedback
    Vibration.vibrate(10);
    setIsConfirmLeaveMode(true);
  };

  const handleConfirmLeave = () => {
    // Stronger haptic feedback for confirmation
    Vibration.vibrate(50);
    onLeave(conversation);
    resetPosition();
    setIsConfirmLeaveMode(false);
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
      } else if (translationX > 0 && isRevealed) {
        // Allow right swipe to hide buttons when revealed
        const currentOffset = isRevealed ? -TOTAL_BUTTON_WIDTH : 0;
        translateX.value = Math.min(currentOffset + translationX, 0);
      }
    })
    .onEnd((event) => {
      const { translationX } = event;

      runOnJS(unlockScroll)();

      if (translationX < -TOTAL_BUTTON_WIDTH / 2 && !isRevealed) {
        // Swipe left enough to reveal action buttons
        translateX.value = withSpring(-TOTAL_BUTTON_WIDTH, springConfig);
        runOnJS(setIsRevealed)(true);
      } else if (translationX > TOTAL_BUTTON_WIDTH / 2 && isRevealed) {
        // Swipe right enough to hide action buttons
        translateX.value = withSpring(0, springConfig);
        runOnJS(setIsRevealed)(false);
        runOnJS(setIsConfirmDeleteMode)(false); // Reset confirm modes when hiding buttons
        runOnJS(setIsConfirmLeaveMode)(false);
      } else {
        // Snap to appropriate position based on current state
        const targetValue = isRevealed ? -TOTAL_BUTTON_WIDTH : 0;
        translateX.value = withSpring(targetValue, springConfig);
      }
    })
    .activeOffsetX([-10, 10]) // Only activate when horizontal movement is significant
    .failOffsetY([-20, 20]); // Fail if vertical movement is too large

  // Reset position animation
  const resetPosition = () => {
    translateX.value = withSpring(0, springConfig);
    setIsRevealed(false);
    setIsConfirmDeleteMode(false); // Reset confirm modes when hiding buttons
    setIsConfirmLeaveMode(false);
  };

  // Animated style for the conversation item
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      // When swiped left, make right side straight while keeping left side rounded
      borderTopRightRadius: isRevealed ? 0 : 12,
      borderBottomRightRadius: isRevealed ? 0 : 12,
      borderTopLeftRadius: 12,
      borderBottomLeftRadius: 12,
    };
  });

  // Animated style for delete button
  const deleteButtonStyle = useAnimatedStyle(() => {
    'worklet';

    return {
      width: isConfirmDeleteMode
        ? TOTAL_BUTTON_WIDTH
        : isConfirmLeaveMode
        ? 0
        : BUTTON_WIDTH, // Fill space in delete confirm mode, hide in leave confirm mode
      opacity: isConfirmLeaveMode ? 0 : 1, // Hide when leave is in confirm mode
      overflow: 'hidden', // Hide content when width becomes 0
      backgroundColor: isConfirmDeleteMode ? '#FF1744' : '#FF3B30', // More intense red in confirm mode
    };
  });

  // Animated style for delete icon
  const deleteIconStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        {
          scale: isConfirmDeleteMode ? 1.1 : 1, // Slightly larger in confirm mode
        },
      ],
    };
  });

  // Animated style for leave button - disappears in delete confirm mode, expands in leave confirm mode
  const leaveButtonStyle = useAnimatedStyle(() => {
    'worklet';

    return {
      width: isConfirmLeaveMode
        ? TOTAL_BUTTON_WIDTH
        : isConfirmDeleteMode
        ? 0
        : BUTTON_WIDTH, // Fill space in leave confirm mode, hide in delete confirm mode
      opacity: isConfirmDeleteMode ? 0 : 1, // Hide when delete is in confirm mode
      overflow: 'hidden', // Hide content when width becomes 0
      backgroundColor: isConfirmLeaveMode ? '#FF8C00' : '#FF9500', // More intense orange in confirm mode
      transform: [
        {
          scale: isConfirmDeleteMode ? 0.1 : 1, // Scale down when delete is in confirm mode
        },
      ],
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

  // Render swipe action backgrounds
  const renderSwipeActions = () => (
    <View style={styles.swipeActionsContainer}>
      {/* Action buttons behind (left swipe) */}
      <View style={styles.leftActions}>
        {/* Mark as read button - only show if unread */}
        {conversation.unread_count > 0 && onMarkAsRead && (
          <View style={[styles.actionButton, styles.markReadAction]}>
            <TouchableOpacity
              style={styles.markReadButtonContent}
              onPress={handleMarkAsRead}
            >
              <FontAwesomeIcon icon={faCheckCircle} size={18} color='#FFFFFF' />
              <Text style={styles.actionText}>Mark Read</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Leave button - fades out during force swipe */}
        {onLeave && (
          <Animated.View
            style={[styles.actionButton, styles.leaveAction, leaveButtonStyle]}
          >
            <TouchableOpacity
              style={styles.leaveButtonContent}
              onPress={
                isConfirmLeaveMode ? handleConfirmLeave : handleLeavePress
              }
            >
              <FontAwesomeIcon
                icon={isConfirmLeaveMode ? faCheck : faSignOutAlt}
                size={18}
                color='#FFFFFF'
              />
              <Text style={styles.actionText}>
                {isConfirmLeaveMode ? 'Confirm' : 'Leave'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
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
              onPress={
                isConfirmDeleteMode ? handleConfirmDelete : handleDeletePress
              }
            >
              <Animated.View style={deleteIconStyle}>
                <FontAwesomeIcon
                  icon={isConfirmDeleteMode ? faCheck : faTrash}
                  size={18}
                  color='#FFFFFF'
                />
              </Animated.View>
              <Text style={styles.actionText}>
                {isConfirmDeleteMode ? 'Confirm' : 'Delete'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
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
            onPress={() => {
              if (isRevealed || isConfirmDeleteMode || isConfirmLeaveMode) {
                // If buttons are revealed or in any confirm mode, close them first
                resetPosition();
              } else {
                // Otherwise, handle normal press
                onPress(conversation);
              }
            }}
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
      marginHorizontal: 16,
      ...theme.shadows.small,
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
      borderRadius: 12,
      marginVertical: 4,
      overflow: 'hidden',
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
      height: '100%',
      width: 80, // Default width, will be overridden by animated styles
    },
    markReadAction: {
      backgroundColor: '#34C759', // Green for mark as read
    },
    leaveAction: {
      backgroundColor: '#FF9500', // Orange for leave
      // No rounded corners - connects to conversation item on left and delete button on right
    },
    deleteAction: {
      backgroundColor: '#FF3B30', // Red for delete
    },
    markReadButtonContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      height: '100%',
    },
    deleteButtonContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      height: '100%',
    },
    leaveButtonContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      height: '100%',
    },

    actionText: {
      color: '#FFFFFF',
      fontSize: safeFontSizes.small,
      fontWeight: '600',
      marginTop: 4,
    },
    animatedContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12, // Rounded conversation items

      marginVertical: 4, // Add spacing between items\
      overflow: 'hidden',
    },
    conversationItem: {
      flexDirection: 'row',
      padding: 16,
      backgroundColor: theme.colors.surface,

      
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
