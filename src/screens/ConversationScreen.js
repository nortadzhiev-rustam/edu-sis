import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Keyboard,
  AppState,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import Clipboard from '@react-native-clipboard/clipboard';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faPaperPlane,
  faPaperclip,
  faEllipsisV,
  faTrash,
  faSignOutAlt,
  faEdit,
  faCheckCircle,
  faCircle,
  faCopy,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useMessaging } from '../contexts/MessagingContext';
import {
  getConversationMessages,
  sendMessage,
  markMessagesAsRead,
  deleteMessage,
  deleteConversation,
  leaveConversation,
  clearMessageText,
  adminDeleteMessage,
  bulkDeleteMessages,
  editMessage,
} from '../services/messagingService';
import { MessageBubble, AttachmentHandler } from '../components/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const ConversationScreen = ({ navigation, route }) => {
  const { theme, fontSizes } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { markConversationAsReadLocally, markMessageAsReadLocally } =
    useMessaging();
  const {
    conversationUuid,
    conversationTopic,
    teacherName,
    studentName,
    userType = 'teacher',
    authCode,
  } = route.params;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    right: 0,
  });
  const [currentUserId, setCurrentUserId] = useState(null);
  const [hasMarkedAsRead, setHasMarkedAsRead] = useState(false);
  const [isScreenActive, setIsScreenActive] = useState(true);

  // Message management states
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);

  // Animation values for menu options
  const menuOpacity = useSharedValue(0);
  const menuScale = useSharedValue(0.8);
  const menuTranslateY = useSharedValue(10);

  // Individual button animations for staggered effect
  const editOpacity = useSharedValue(0);
  const deleteOpacity = useSharedValue(0);
  const selectOpacity = useSharedValue(0);
  const copyOpacity = useSharedValue(0);

  // Animated style for menu options
  const menuAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: menuOpacity.value,
      transform: [
        { scale: menuScale.value },
        { translateY: menuTranslateY.value },
      ],
    };
  });

  // Individual button animated styles
  const editAnimatedStyle = useAnimatedStyle(() => ({
    opacity: editOpacity.value,
    transform: [
      { translateX: interpolate(editOpacity.value, [0, 1], [-20, 0]) },
    ],
  }));

  const deleteAnimatedStyle = useAnimatedStyle(() => ({
    opacity: deleteOpacity.value,
    transform: [
      { translateX: interpolate(deleteOpacity.value, [0, 1], [-20, 0]) },
    ],
  }));

  const selectAnimatedStyle = useAnimatedStyle(() => ({
    opacity: selectOpacity.value,
    transform: [
      { translateX: interpolate(selectOpacity.value, [0, 1], [-20, 0]) },
    ],
  }));

  const copyAnimatedStyle = useAnimatedStyle(() => ({
    opacity: copyOpacity.value,
    transform: [
      { translateX: interpolate(copyOpacity.value, [0, 1], [-20, 0]) },
    ],
  }));

  // Animation functions
  const showMenuAnimation = () => {
    // Main container animation
    menuOpacity.value = withSpring(1, {
      damping: 20,
      stiffness: 300,
    });
    menuScale.value = withSpring(1, {
      damping: 20,
      stiffness: 300,
    });
    menuTranslateY.value = withSpring(0, {
      damping: 20,
      stiffness: 300,
    });

    // Staggered button animations
    editOpacity.value = withSpring(1, {
      damping: 25,
      stiffness: 400,
    });

    setTimeout(() => {
      deleteOpacity.value = withSpring(1, {
        damping: 25,
        stiffness: 400,
      });
    }, 50);

    setTimeout(() => {
      selectOpacity.value = withSpring(1, {
        damping: 25,
        stiffness: 400,
      });
    }, 100);

    setTimeout(() => {
      copyOpacity.value = withSpring(1, {
        damping: 25,
        stiffness: 400,
      });
    }, 150);
  };

  const hideMenuAnimation = () => {
    // Hide all buttons immediately
    editOpacity.value = withTiming(0, { duration: 150 });
    deleteOpacity.value = withTiming(0, { duration: 150 });
    selectOpacity.value = withTiming(0, { duration: 150 });
    copyOpacity.value = withTiming(0, { duration: 150 });

    // Main container animation
    menuOpacity.value = withTiming(0, {
      duration: 200,
      easing: Easing.out(Easing.quad),
    });
    menuScale.value = withTiming(0.8, {
      duration: 200,
      easing: Easing.out(Easing.quad),
    });
    menuTranslateY.value = withTiming(10, {
      duration: 200,
      easing: Easing.out(Easing.quad),
    });
  };

  // Function to clear selected message (dismiss menu)
  const clearSelectedMessage = () => {
    console.log('Clearing selected message');
    setSelectedMessage(null);
  };

  // Handle options button press and position dropdown
  const handleOptionsPress = () => {
    if (optionsButtonRef.current) {
      optionsButtonRef.current.measure(
        (_x, _y, _width, height, _pageX, pageY) => {
          setDropdownPosition({
            top: pageY + height + 5, // Position below the button with 5px gap
            right: 16, // Align with right edge of screen with padding
          });
          setShowOptionsMenu(true);
        }
      );
    } else {
      // Fallback if ref is not available
      setShowOptionsMenu(true);
    }
  };

  const flatListRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const lastRefreshTime = useRef(0);
  const optionsButtonRef = useRef(null);

  // Animate menu when selectedMessage changes
  useEffect(() => {
    if (selectedMessage) {
      showMenuAnimation();

      // Auto-dismiss menu after 10 seconds
      const timeout = setTimeout(() => {
        console.log('Auto-dismissing menu after timeout');
        clearSelectedMessage();
      }, 10000);

      return () => clearTimeout(timeout);
    } else {
      hideMenuAnimation();
    }
  }, [selectedMessage]);

  // Safety check for fontSizes
  const safeFontSizes = fontSizes || {
    small: 12,
    medium: 16,
    large: 20,
  };

  // Safety check for theme to prevent NaN values
  const safeTheme = {
    ...theme,
    colors: {
      background: '#FFFFFF',
      surface: '#F5F5F5',
      primary: '#007AFF',
      text: '#000000',
      textSecondary: '#666666',
      headerText: '#FFFFFF',
      headerBackground: '#007AFF',
      border: '#E0E0E0',
      error: '#FF3B30',
      warning: '#FF9500',
      ...theme?.colors,
    },
  };

  const styles = createStyles(safeTheme, safeFontSizes);

  // Get current user ID from storage
  const getCurrentUserId = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id || user.user_id;
      }
      return null;
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return null;
    }
  }, []);

  // Initialize current user ID
  useEffect(() => {
    const initializeUserId = async () => {
      console.log('🔍 Initializing current user ID...');
      const userId = await getCurrentUserId();
      console.log(`🔍 Got current user ID: ${userId}`);
      setCurrentUserId(userId);
    };
    initializeUserId();
  }, [getCurrentUserId]);

  // Helper function to determine if a message belongs to the current user
  const determineMessageOwnership = (message, currentUserType) => {
    // If the message already has is_own_message property, use it
    if (message.hasOwnProperty('is_own_message')) {
      return message.is_own_message;
    }

    // Otherwise, determine based on sender type matching current user type
    if (currentUserType === 'teacher') {
      // Teacher's messages are on the right if sender is staff
      return message.sender?.user_type === 'staff';
    } else {
      // Student's messages are on the right if sender is student
      return message.sender?.user_type === 'student';
    }
  };

  // Fetch messages with optional silent refresh
  const fetchMessages = useCallback(
    async (pageNum = 1, append = false, silent = false) => {
      try {
        if (!silent) {
          if (pageNum === 1) setLoading(true);
          else setLoadingMore(true);
        }

        const response = await getConversationMessages(
          conversationUuid,
          pageNum,
          50,
          authCode
        );

        if (response.success && response.data) {
          const newMessages = response.data.messages || [];

          // Sort messages by timestamp (newest first) and determine ownership
          const sortedMessages = newMessages
            .map((message) => ({
              ...message,
              is_own_message: determineMessageOwnership(message, userType),
            }))
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

          if (append) {
            setMessages((prev) => [...prev, ...sortedMessages]);
          } else {
            setMessages(sortedMessages);
          }

          setHasMore(response.data.pagination?.has_more || false);

          // Note: Individual messages will be marked as read when user interacts with them
          // The backend tracks read status using last read time, so unread_count will update automatically
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        if (!silent) {
          Alert.alert(t('error'), t('failedToLoadMessages'));
        }
      } finally {
        if (!silent) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [conversationUuid, authCode, userType]
  );

  // Refresh messages with debouncing
  const refreshMessages = useCallback(async () => {
    const now = Date.now();
    // Debounce: only allow refresh every 5 seconds
    if (now - lastRefreshTime.current < 5000) {
      console.log('📱 CONVERSATION: Skipping refresh - too soon');
      return;
    }

    lastRefreshTime.current = now;
    console.log('🔄 CONVERSATION: Refreshing messages...');

    try {
      await fetchMessages(1, false, true); // Silent refresh
      console.log('✅ CONVERSATION: Messages refreshed successfully');
    } catch (error) {
      console.error('❌ CONVERSATION: Error refreshing messages:', error);
    }
  }, [fetchMessages]);

  // Send message
  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim() || sending) return;

    const tempMessage = {
      message_id: Date.now(),
      content: messageText.trim(),
      message_type: 'text',
      sender: {
        name: userType === 'teacher' ? teacherName : studentName,
        user_type: userType === 'teacher' ? 'staff' : 'student',
      },
      created_at: new Date().toISOString(),
      is_own_message: true, // Always true for messages we send
    };

    try {
      setSending(true);
      setMessageText('');

      // Optimistically add message to UI (at the beginning since it's newest)
      setMessages((prev) => [tempMessage, ...prev]);

      const response = await sendMessage(
        conversationUuid,
        tempMessage.content,
        'text',
        null,
        authCode
      );

      if (response.success && response.data) {
        // Handle both old and new API response structures
        const messageData = response.data.message || response.data;

        // Replace temp message with real message, ensuring all required fields exist
        const serverMessage = {
          message_id:
            response.data.message_id ||
            messageData.message_id ||
            tempMessage.message_id,
          content:
            response.data.content || messageData.content || tempMessage.content,
          message_type:
            response.data.message_type || messageData.message_type || 'text',
          sender:
            response.data.sender || messageData.sender || tempMessage.sender,
          created_at:
            response.data.created_at ||
            messageData.created_at ||
            tempMessage.created_at,
          is_own_message: true,
          attachment_url:
            response.data.attachment_url || messageData.attachment_url || null,
        };

        setMessages((prev) =>
          prev.map((msg) =>
            msg.message_id === tempMessage.message_id ? serverMessage : msg
          )
        );
      } else {
        // Remove temp message on failure
        setMessages((prev) =>
          prev.filter((msg) => msg.message_id !== tempMessage.message_id)
        );
        Alert.alert(t('error'), t('failedToSendMessage'));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) =>
        prev.filter((msg) => msg.message_id !== tempMessage.message_id)
      );
      Alert.alert(t('error'), t('failedToSendMessage'));
    } finally {
      setSending(false);
    }
  }, [
    messageText,
    sending,
    conversationUuid,
    userType,
    teacherName,
    studentName,
    authCode,
  ]);

  // Load more messages
  const loadMoreMessages = useCallback(() => {
    if (hasMore && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMessages(nextPage, true);
    }
  }, [hasMore, loadingMore, page, fetchMessages]);

  // Render message item
  const renderMessageItem = ({ item, index }) => {
    const isSelected = selectedMessages.some(
      (msg) => msg.message_id === item.message_id
    );
    const showActions = selectedMessage?.message_id === item.message_id;

    // Check if we should show sender info
    // For own messages, never show sender
    // For other messages, show sender only if:
    // 1. It's the first message (index 0 - newest message)
    // 2. OR the previous message (chronologically) is from a different sender
    // Since messages are in reverse chronological order, we check the next item in array
    const previousMessage = messages[index + 1];
    const shouldShowSender =
      !item.is_own_message &&
      (!previousMessage || // No previous message (first message in conversation)
        previousMessage.sender?.id !== item.sender?.id); // Different sender than previous

    return (
      <View>
        <View style={styles.messageRow}>
          {/* Selection Checkbox */}
          {selectionMode && (
            <TouchableOpacity
              style={styles.selectionCheckbox}
              onPress={() => handleSelectMessage(item)}
            >
              <FontAwesomeIcon
                icon={isSelected ? faCheckCircle : faCircle}
                size={20}
                color={
                  isSelected
                    ? safeTheme.colors.primary
                    : safeTheme.colors.textSecondary
                }
              />
            </TouchableOpacity>
          )}

          <View style={styles.messageContent}>
            <MessageBubble
              message={item}
              isOwnMessage={item.is_own_message}
              showSender={shouldShowSender}
              isSelected={isSelected}
              selectionMode={selectionMode}
              onAttachmentPress={(url) => {
                // Handle attachment press - could open in browser or download
                console.log('Attachment pressed:', url);
              }}
              onMessagePress={(message) => {
                if (selectionMode) {
                  handleSelectMessage(message);
                } else {
                  // Clear selected message if any menu is open
                  if (selectedMessage) {
                    clearSelectedMessage();
                    return;
                  }

                  // Mark message as read locally if it's not the user's own message and it's unread
                  if (
                    currentUserId &&
                    message.sender?.id !== currentUserId &&
                    !message.is_read
                  ) {
                    markMessageAsReadHandler(message.message_id);
                  }
                  console.log('Message pressed:', message);
                }
              }}
              onMessageLongPress={(message) => {
                // Show inline actions for own messages
                if (message.is_own_message && !selectionMode) {
                  setSelectedMessage(
                    selectedMessage?.message_id === message.message_id
                      ? null
                      : message
                  );
                }
              }}
            />
          </View>
        </View>

        {/* Inline Message Actions */}
        {showActions && item.is_own_message && (
          <Animated.View
            style={[styles.inlineActions, menuAnimatedStyle]}
            pointerEvents='auto'
          >
            {/* Edit Option */}
            <Animated.View style={editAnimatedStyle}>
              <TouchableOpacity
                style={[
                  styles.actionOption,
                  !canEditMessage(item) && styles.disabledOption,
                ]}
                onPress={() =>
                  canEditMessage(item) && handleMessageAction('edit', item)
                }
                disabled={!canEditMessage(item)}
              >
                <FontAwesomeIcon
                  icon={faEdit}
                  size={16}
                  color={
                    canEditMessage(item)
                      ? safeTheme.colors.primary
                      : safeTheme.colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.actionOptionText,
                    !canEditMessage(item) && styles.disabledOptionText,
                  ]}
                >
                  Edit Message
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Delete Option */}
            <Animated.View style={deleteAnimatedStyle}>
              <TouchableOpacity
                style={styles.actionOption}
                onPress={() => handleMessageAction('delete', item)}
              >
                <FontAwesomeIcon
                  icon={faTrash}
                  size={16}
                  color={safeTheme.colors.error}
                />
                <Text
                  style={[
                    styles.actionOptionText,
                    { color: safeTheme.colors.error },
                  ]}
                >
                  Delete Message
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Select Option */}
            <Animated.View style={selectAnimatedStyle}>
              <TouchableOpacity
                style={styles.actionOption}
                onPress={() => handleMessageAction('select', item)}
              >
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  size={16}
                  color={safeTheme.colors.primary}
                />
                <Text style={styles.actionOptionText}>Select Message</Text>
              </TouchableOpacity>
            </Animated.View>
            {/* Copy Option */}
            <Animated.View style={copyAnimatedStyle}>
              <TouchableOpacity
                style={styles.actionOption}
                onPress={() => handleMessageAction('copy', item)}
              >
                <FontAwesomeIcon
                  icon={faCopy}
                  size={16}
                  color={theme.colors.primary}
                />
                <Text style={styles.actionOptionText}>Copy Message</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        )}
      </View>
    );
  };

  // Render loading footer
  const renderLoadingFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size='small' color={theme.colors.primary} />
      </View>
    );
  };

  // Handle message actions (edit, delete, clear, select)
  const handleMessageAction = useCallback(
    (action, message) => {
      setSelectedMessage(null);

      switch (action) {
        case 'edit':
          handleEditMessage(message);
          break;
        case 'delete':
          if (userType === 'student') {
            // Students use clear text function but call it "delete"
            handleClearMessage(message.message_id);
          } else {
            // Staff use actual delete
            handleDeleteMessage(message.message_id);
          }
          break;
        case 'select':
          handleSelectMessage(message);
          break;
        case 'copy':
          handleCopyMessage(message);
          break;
        default:
          break;
      }
    },
    [userType]
  );

  // Handle message editing (1-minute time limit)
  const handleEditMessage = useCallback((message) => {
    setEditingMessage(message);
    setEditText(message.content);
  }, []);

  // Handle message selection for bulk operations
  const handleSelectMessage = useCallback(
    (message) => {
      if (selectionMode) {
        // Toggle selection
        setSelectedMessages((prev) => {
          const isSelected = prev.some(
            (msg) => msg.message_id === message.message_id
          );
          if (isSelected) {
            return prev.filter((msg) => msg.message_id !== message.message_id);
          } else {
            return [...prev, message];
          }
        });
      } else {
        // Enter selection mode
        setSelectionMode(true);
        setSelectedMessages([message]);
      }
    },
    [selectionMode]
  );

  // Check if message can be edited (1-minute limit)
  const canEditMessage = useCallback((message) => {
    const messageAge = Date.now() - new Date(message.created_at).getTime();
    const oneMinute = 60 * 1000;
    return messageAge <= oneMinute;
  }, []);

  // Exit selection mode
  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedMessages([]);
  }, []);

  // Handle copy message to clipboard
  const handleCopyMessage = useCallback((message) => {
    try {
      // Extract plain text from HTML content if needed
      const textContent = message.content.replace(/<[^>]*>/g, '').trim();
      Clipboard.setString(textContent);
      Alert.alert(t('success'), t('messageCopied'));
    } catch (error) {
      console.error('Error copying message:', error);
      Alert.alert(t('error'), t('failedToCopyMessage'));
    }
  }, []);

  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedMessages.length === 0) return;

    const messageIds = selectedMessages.map((msg) => msg.message_id);
    const deleteType = userType === 'student' ? 'soft' : 'hard';

    Alert.alert(
      t('deleteMessages'),
      t('confirmDeleteMessages')
        .replace('{count}', selectedMessages.length.toString())
        .replace('{plural}', selectedMessages.length !== 1 ? 's' : ''),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await bulkDeleteMessages(
                messageIds,
                deleteType,
                authCode
              );
              if (response.success) {
                // Update messages in local state
                if (deleteType === 'hard') {
                  setMessages((prev) =>
                    prev.filter((msg) => !messageIds.includes(msg.message_id))
                  );
                } else {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      messageIds.includes(msg.message_id)
                        ? {
                            ...msg,
                            content: '[Message Deleted]',
                            cleared_at: new Date().toISOString(),
                          }
                        : msg
                    )
                  );
                }
                exitSelectionMode();
                Alert.alert(
                  t('success'),
                  t('messagesDeletedSuccessfully')
                    .replace(
                      '{count}',
                      response.data.successful_deletes.toString()
                    )
                    .replace(
                      '{plural}',
                      response.data.successful_deletes !== 1 ? 's' : ''
                    )
                );
              } else {
                Alert.alert(t('error'), t('failedToDeleteMessages'));
              }
            } catch (error) {
              console.error('Error bulk deleting messages:', error);
              Alert.alert(t('error'), t('failedToDeleteMessages'));
            }
          },
        },
      ]
    );
  }, [selectedMessages, userType, authCode, exitSelectionMode]);

  // Save edited message
  const saveEditedMessage = useCallback(async () => {
    if (!editingMessage || !editText.trim()) return;

    try {
      const response = await editMessage(
        editingMessage.message_id,
        editText.trim(),
        authCode
      );

      if (response.success) {
        // Update message in local state
        setMessages((prev) =>
          prev.map((msg) =>
            msg.message_id === editingMessage.message_id
              ? {
                  ...msg,
                  content: editText.trim(),
                  edited_at: new Date().toISOString(),
                }
              : msg
          )
        );
        setEditingMessage(null);
        setEditText('');
        Alert.alert(t('success'), t('messageEditedSuccessfully'));
      } else {
        Alert.alert(t('error'), response.error || t('failedToEditMessage'));
      }
    } catch (error) {
      console.error('Error editing message:', error);
      Alert.alert(t('error'), t('failedToEditMessage'));
    }
  }, [editingMessage, editText, authCode]);

  // Handle message deletion (sender only, 24h limit)
  const handleDeleteMessage = useCallback(
    async (messageId) => {
      try {
        Alert.alert(
          'Delete Message',
          'Are you sure you want to delete this message? This action cannot be undone.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                try {
                  const response = await deleteMessage(
                    messageId,
                    conversationUuid,
                    authCode
                  );
                  if (response.success) {
                    // Remove message from local state
                    setMessages((prev) =>
                      prev.filter((msg) => msg.message_id !== messageId)
                    );
                    Alert.alert('Success', 'Message deleted successfully');
                  } else {
                    Alert.alert(
                      'Error',
                      response.error || 'Failed to delete message'
                    );
                  }
                } catch (error) {
                  console.error('Error deleting message:', error);
                  Alert.alert('Error', 'Failed to delete message');
                }
              },
            },
          ]
        );
      } catch (error) {
        console.error('Error in handleDeleteMessage:', error);
      }
    },
    [conversationUuid, authCode]
  );

  // Handle clear message text (replace with "[Message Deleted]")
  const handleClearMessage = useCallback(
    async (messageId) => {
      try {
        Alert.alert(
          'Clear Message',
          'This will replace the message content with "[Message Deleted]". The message will remain visible but the content will be cleared.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Clear',
              style: 'destructive',
              onPress: async () => {
                try {
                  const response = await clearMessageText(messageId, authCode);
                  if (response.success) {
                    // Update message in local state
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.message_id === messageId
                          ? {
                              ...msg,
                              content: '[Message Deleted]',
                              cleared_at: new Date().toISOString(),
                            }
                          : msg
                      )
                    );
                    Alert.alert(
                      'Success',
                      'Message content cleared successfully'
                    );
                  } else {
                    Alert.alert(
                      'Error',
                      response.error || 'Failed to clear message'
                    );
                  }
                } catch (error) {
                  console.error('Error clearing message:', error);
                  Alert.alert('Error', 'Failed to clear message');
                }
              },
            },
          ]
        );
      } catch (error) {
        console.error('Error in handleClearMessage:', error);
      }
    },
    [authCode]
  );

  // Handle leaving conversation
  const handleLeaveConversation = useCallback(async () => {
    try {
      Alert.alert(
        'Leave Conversation',
        'Are you sure you want to leave this conversation? You will no longer receive messages from this conversation.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: async () => {
              try {
                const response = await leaveConversation(
                  conversationUuid,
                  authCode
                );
                if (response.success) {
                  Alert.alert('Success', 'Left conversation successfully', [
                    {
                      text: 'OK',
                      onPress: () => navigation.goBack(),
                    },
                  ]);
                } else {
                  Alert.alert(
                    'Error',
                    response.error || 'Failed to leave conversation'
                  );
                }
              } catch (error) {
                console.error('Error leaving conversation:', error);
                Alert.alert('Error', 'Failed to leave conversation');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error in handleLeaveConversation:', error);
    }
  }, [conversationUuid, navigation, authCode]);

  // Handle deleting conversation (creator only)
  const handleDeleteConversation = useCallback(async () => {
    try {
      Alert.alert(
        'Delete Conversation',
        'Are you sure you want to delete this entire conversation? This will permanently delete all messages and cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                const response = await deleteConversation(
                  conversationUuid,
                  authCode
                );
                if (response.success) {
                  Alert.alert('Success', 'Conversation deleted successfully', [
                    {
                      text: 'OK',
                      onPress: () => navigation.goBack(),
                    },
                  ]);
                } else {
                  Alert.alert(
                    'Error',
                    response.error || 'Failed to delete conversation'
                  );
                }
              } catch (error) {
                console.error('Error deleting conversation:', error);
                Alert.alert('Error', 'Failed to delete conversation');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error in handleDeleteConversation:', error);
    }
  }, [conversationUuid, navigation, authCode]);

  // Mark individual message as read (local only - no API call since endpoint doesn't exist)
  const markMessageAsReadHandler = useCallback(
    async (messageId) => {
      try {
        console.log(`📖 Marking message ${messageId} as read (local only)`);

        // Update local state only (no API call since endpoint doesn't exist)
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.message_id === messageId
              ? { ...msg, is_read: true, read_at: new Date().toISOString() }
              : msg
          )
        );

        // Update global messaging context
        markMessageAsReadLocally(messageId, conversationUuid);

        console.log(
          `✅ Successfully marked message ${messageId} as read locally`
        );
      } catch (error) {
        console.error('❌ Error marking message as read locally:', error);
      }
    },
    [conversationUuid, markMessageAsReadLocally]
  );

  // Mark unread messages as read when screen loads (local only)
  const markUnreadMessagesAsRead = useCallback(async () => {
    try {
      // Don't proceed if currentUserId is not available yet
      if (!currentUserId) {
        console.log(
          '📖 Current user ID not available yet, skipping mark as read'
        );
        return;
      }

      console.log(
        `📖 Marking unread messages in conversation ${conversationUuid} as read (local only)`
      );
      console.log(
        `📊 Total messages: ${messages.length}, Current user ID: ${currentUserId}`
      );

      // Find unread messages from others
      const unreadMessages = messages.filter(
        (msg) => !msg.is_read && msg.sender?.id !== currentUserId
      );

      console.log(`📊 Unread messages from others: ${unreadMessages.length}`);
      unreadMessages.forEach((msg) => {
        console.log(
          `📋 Unread message: ID=${msg.message_id}, sender=${msg.sender?.id}, is_read=${msg.is_read}`
        );
      });

      if (unreadMessages.length > 0) {
        console.log(
          `📖 Found ${unreadMessages.length} unread messages to mark as read`
        );

        // Update all unread messages to read status locally (optimistic update)
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            !msg.is_read && msg.sender?.id !== currentUserId
              ? { ...msg, is_read: true, read_at: new Date().toISOString() }
              : msg
          )
        );

        // Update local conversation read status
        markConversationAsReadLocally(conversationUuid);

        // Call API to mark messages as read on the backend
        try {
          console.log(
            `📡 Calling API to mark messages as read for conversation ${conversationUuid}`
          );
          const response = await markMessagesAsRead(conversationUuid, authCode);
          if (response.success) {
            console.log(`✅ Successfully marked messages as read on backend`);
          } else {
            console.warn(
              `⚠️ Failed to mark messages as read on backend:`,
              response.error
            );
          }
        } catch (error) {
          console.error('❌ Error calling mark messages as read API:', error);
        }

        console.log(
          `✅ Marked ${unreadMessages.length} messages as read locally and called API`
        );
      } else {
        console.log(`📖 No unread messages found in conversation`);
      }
    } catch (error) {
      console.error('❌ Error marking unread messages as read:', error);
    }
  }, [
    conversationUuid,
    messages,
    currentUserId,
    authCode,
    markConversationAsReadLocally,
  ]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Focus effect for real-time updates
  useFocusEffect(
    useCallback(() => {
      console.log(
        '🔍 CONVERSATION: Screen focused, setting up real-time updates'
      );
      setIsScreenActive(true);

      // Refresh messages when screen comes into focus
      refreshMessages();

      // Set up polling for new messages every 10 seconds when screen is active
      const startPolling = () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }

        pollIntervalRef.current = setInterval(() => {
          if (isScreenActive) {
            console.log('🔄 CONVERSATION: Polling for new messages...');
            refreshMessages();
          }
        }, 10000); // Poll every 10 seconds
      };

      startPolling();

      // App state change listener
      const handleAppStateChange = (nextAppState) => {
        console.log(`📱 CONVERSATION: App state changed to ${nextAppState}`);
        if (nextAppState === 'active') {
          setIsScreenActive(true);
          refreshMessages();
          startPolling();
        } else {
          setIsScreenActive(false);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }
        }
      };

      const subscription = AppState.addEventListener(
        'change',
        handleAppStateChange
      );

      return () => {
        console.log('🔍 CONVERSATION: Screen unfocused, cleaning up');
        setIsScreenActive(false);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
        if (subscription) {
          subscription.remove();
        }
      };
    }, [refreshMessages, isScreenActive])
  );

  // Mark unread messages as read when messages are loaded (only once)
  useEffect(() => {
    console.log(
      `🔍 useEffect check: messages=${messages.length}, currentUserId=${currentUserId}, hasMarkedAsRead=${hasMarkedAsRead}`
    );

    if (messages.length > 0 && currentUserId && !hasMarkedAsRead) {
      // Check if there are unread messages from others
      const unreadMessages = messages.filter(
        (msg) => !msg.is_read && msg.sender?.id !== currentUserId
      );

      console.log(
        `🔍 Found ${unreadMessages.length} unread messages in useEffect`
      );

      if (unreadMessages.length > 0) {
        console.log(
          `📖 Auto-marking ${unreadMessages.length} unread messages as read on conversation open`
        );
        markUnreadMessagesAsRead();
        setHasMarkedAsRead(true); // Prevent multiple calls
      } else {
        console.log('📖 No unread messages to mark as read');
        setHasMarkedAsRead(true); // Still set to true to prevent checking again
      }
    } else {
      console.log(
        `🔍 Skipping mark as read: messages=${
          messages.length
        }, currentUserId=${!!currentUserId}, hasMarkedAsRead=${hasMarkedAsRead}`
      );
    }
  }, [messages, currentUserId, hasMarkedAsRead, markUnreadMessagesAsRead]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {selectionMode ? (
          // Selection Mode Header
          <>
            <TouchableOpacity
              style={styles.backButton}
              onPress={exitSelectionMode}
            >
              <FontAwesomeIcon
                icon={faArrowLeft}
                size={20}
                color={theme.colors.headerText}
              />
            </TouchableOpacity>

            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>
                {selectedMessages.length} selected
              </Text>
            </View>

            <TouchableOpacity
              style={styles.optionsButton}
              onPress={handleBulkDelete}
              disabled={selectedMessages.length === 0}
            >
              <FontAwesomeIcon
                icon={faTrash}
                size={20}
                color={
                  selectedMessages.length > 0
                    ? theme.colors.error
                    : theme.colors.textSecondary
                }
              />
            </TouchableOpacity>
          </>
        ) : (
          // Normal Header
          <>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <FontAwesomeIcon
                icon={faArrowLeft}
                size={20}
                color={theme.colors.headerText}
              />
            </TouchableOpacity>

            <View style={styles.headerContent}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {conversationTopic}
              </Text>
            </View>

            <TouchableOpacity
              ref={optionsButtonRef}
              style={styles.optionsButton}
              onPress={handleOptionsPress}
            >
              <FontAwesomeIcon
                icon={faEllipsisV}
                size={20}
                color={theme.colors.headerText}
              />
            </TouchableOpacity>
          </>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Messages List */}
        <View style={{ flex: 1, position: 'relative' }}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size='large' color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessageItem}
              keyExtractor={(item) =>
                item.message_id?.toString() ||
                `temp-${Date.now()}-${Math.random()}`
              }
              contentContainerStyle={styles.messagesList}
              inverted
              onEndReached={loadMoreMessages}
              onEndReachedThreshold={0.1}
              ListFooterComponent={renderLoadingFooter}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Message Input */}
        <TouchableOpacity
          style={[styles.inputContainer, { paddingBottom: 8, marginBottom: 0 }]}
          activeOpacity={1}
          onPress={() => {
            if (selectedMessage) {
              console.log('Input area tapped, dismissing menu');
              clearSelectedMessage();
            }
          }}
        >
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder={t('typeMessage')}
              placeholderTextColor={theme.colors.textSecondary}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={1000}
            />

            <TouchableOpacity
              style={styles.attachButton}
              onPress={() =>
                Alert.alert(t('comingSoon'), t('fileAttachmentsComingSoon'))
              }
            >
              <FontAwesomeIcon
                icon={faPaperclip}
                size={18}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!messageText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size='small' color={theme.colors.headerText} />
            ) : (
              <FontAwesomeIcon
                icon={faPaperPlane}
                size={18}
                color={theme.colors.headerText}
              />
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>

      {/* Options Dropdown Menu */}
      {showOptionsMenu && (
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsMenu(false)}
        >
          <View
            style={[
              styles.dropdownMenu,
              {
                position: 'absolute',
                top: dropdownPosition.top,
                right: dropdownPosition.right,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setShowOptionsMenu(false);
                handleLeaveConversation();
              }}
            >
              <FontAwesomeIcon
                icon={faSignOutAlt}
                size={16}
                color={theme.colors.warning}
              />
              <Text
                style={[styles.dropdownText, { color: theme.colors.warning }]}
              >
                Leave Conversation
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setShowOptionsMenu(false);
                handleDeleteConversation();
              }}
            >
              <FontAwesomeIcon
                icon={faTrash}
                size={16}
                color={theme.colors.error}
              />
              <Text
                style={[styles.dropdownText, { color: theme.colors.error }]}
              >
                Delete Conversation
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {/* Edit Message Modal */}
      <Modal
        visible={!!editingMessage}
        transparent={true}
        animationType='slide'
        onRequestClose={() => {
          setEditingMessage(null);
          setEditText('');
        }}
      >
        <View style={styles.editModalOverlay}>
          <View style={styles.editMessageContainer}>
            <Text style={styles.editModalTitle}>Edit Message</Text>

            <TextInput
              style={styles.editTextInput}
              value={editText}
              onChangeText={setEditText}
              placeholder={t('enterMessage')}
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              autoFocus
            />

            <View style={styles.editModalButtons}>
              <TouchableOpacity
                style={[styles.editButton, styles.cancelEditButton]}
                onPress={() => {
                  setEditingMessage(null);
                  setEditText('');
                }}
              >
                <Text style={styles.cancelEditText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.editButton, styles.saveEditButton]}
                onPress={saveEditedMessage}
                disabled={!editText.trim()}
              >
                <Text style={styles.saveEditText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (theme, fontSizes) => {
  // Safety check for fontSizes with NaN protection
  const safeFontSizes = {
    small: fontSizes?.small && !isNaN(fontSizes.small) ? fontSizes.small : 12,
    medium:
      fontSizes?.medium && !isNaN(fontSizes.medium) ? fontSizes.medium : 16,
    large: fontSizes?.large && !isNaN(fontSizes.large) ? fontSizes.large : 20,
  };

  // Safety check for theme colors
  const safeTheme = {
    ...theme,
    colors: {
      background: '#FFFFFF',
      surface: '#F5F5F5',
      primary: '#007AFF',
      text: '#000000',
      textSecondary: '#666666',
      headerText: '#FFFFFF',
      headerBackground: '#007AFF',
      border: '#E0E0E0',
      error: '#FF3B30',
      warning: '#FF9500',
      ...theme?.colors,
    },
  };

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: safeTheme.colors.background,
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1,
      backgroundColor: 'transparent',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: safeTheme.colors.headerBackground,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: safeFontSizes.large,
      fontWeight: 'bold',
      color: safeTheme.colors.headerText,
    },
    content: {
      flex: 1,
    },
    messagesContainer: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: safeFontSizes.medium,
      color: safeTheme.colors.textSecondary,
    },
    messagesList: {
      paddingHorizontal: 2,
      paddingVertical: 8,
    },
    loadingFooter: {
      paddingVertical: 16,
      alignItems: 'center',
    },
    messageContainer: {
      marginVertical: 4,
    },
    ownMessageContainer: {
      alignItems: 'flex-end',
    },
    otherMessageContainer: {
      alignItems: 'flex-start',
    },
    senderInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
      marginLeft: 8,
    },
    senderAvatar: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: safeTheme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 6,
    },
    senderName: {
      fontSize: safeFontSizes.small,
      color: safeTheme.colors.textSecondary,
      fontWeight: '500',
    },
    messageBubble: {
      maxWidth: '80%',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
    },
    ownMessageBubble: {
      backgroundColor: theme.colors.primary,
      borderBottomRightRadius: 4,
    },
    otherMessageBubble: {
      backgroundColor: theme.colors.surface,
      borderBottomLeftRadius: 4,
    },
    messageText: {
      fontSize: safeFontSizes.medium,
      lineHeight: safeFontSizes.medium * 1.25, // Dynamic line height based on font size
    },
    ownMessageText: {
      color: theme.colors.headerText,
    },
    otherMessageText: {
      color: theme.colors.text,
    },
    messageTime: {
      fontSize: safeFontSizes.small,
      marginTop: 4,
    },
    ownMessageTime: {
      color: theme.colors.headerText,
      opacity: 0.8,
    },
    otherMessageTime: {
      color: theme.colors.textSecondary,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 0, // Force no bottom padding
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      marginBottom: 0,
      marginTop: 0,
      // Force override any automatic padding
      paddingBottomIOS: 0,
      paddingBottomAndroid: 0,
    },
    inputWrapper: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-end',
      backgroundColor: theme.colors.background,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginRight: 8,
    },
    textInput: {
      flex: 1,
      fontSize: safeFontSizes.medium,
      color: theme.colors.text,
      maxHeight: 100,
      paddingVertical: 4,
    },
    attachButton: {
      padding: 4,
      marginLeft: 8,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: theme.colors.textSecondary,
      opacity: 0.5,
    },
    optionsButton: {
      padding: 8,
    },
    dropdownOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'transparent',
      zIndex: 1000,
    },
    dropdownMenu: {
      backgroundColor: safeTheme.colors.surface,
      borderRadius: 8,
      paddingVertical: 4,
      minWidth: 180,
      maxWidth: 220,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
        },
        android: {
          elevation: 6,
        },
      }),
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    dropdownText: {
      fontSize: safeFontSizes.medium,
      marginLeft: 12,
      fontWeight: '500',
      color: safeTheme.colors.text,
    },
    // Message Row and Selection Styles
    messageRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: 8,
    },
    selectionCheckbox: {
      paddingTop: 8,
      paddingRight: 8,
      paddingLeft: 4,
    },
    messageContent: {
      flex: 1,
    },
    // Inline Message Actions Styles
    inlineActions: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      marginHorizontal: 16,
      marginVertical: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 10,
      maxWidth: 200,
      alignSelf: 'flex-end',
      zIndex: 100,
      position: 'relative',
    },
    actionOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    actionOptionText: {
      fontSize: safeFontSizes.medium,
      color: theme.colors.text,
      marginLeft: 12,
      fontWeight: '500',
    },
    disabledOption: {
      opacity: 0.5,
    },
    disabledOptionText: {
      color: theme.colors.textSecondary,
    },
    actionButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginHorizontal: 4,
      backgroundColor: theme.colors.primary,
      borderRadius: 6,
      minWidth: 60,
      alignItems: 'center',
    },
    actionButtonText: {
      fontSize: safeFontSizes.small,
      color: theme.colors.headerText,
      fontWeight: '500',
    },
    // Edit Message Modal Styles
    editModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    editMessageContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 20,
      width: '100%',
      maxWidth: 400,
    },
    editModalTitle: {
      fontSize: safeFontSizes.large,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    editTextInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: safeFontSizes.medium,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
      minHeight: 100,
      maxHeight: 200,
      textAlignVertical: 'top',
      marginBottom: 16,
    },
    editModalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    editButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelEditButton: {
      backgroundColor: theme.colors.border,
    },
    saveEditButton: {
      backgroundColor: theme.colors.primary,
    },
    cancelEditText: {
      fontSize: safeFontSizes.medium,
      color: theme.colors.text,
      fontWeight: '500',
    },
    saveEditText: {
      fontSize: safeFontSizes.medium,
      color: theme.colors.headerText,
      fontWeight: '500',
    },
    dismissOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'transparent',
      zIndex: 50,
    },
  });
};

export default ConversationScreen;
