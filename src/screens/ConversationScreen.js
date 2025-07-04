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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faPaperPlane,
  faPaperclip,
  faUser,
  faEllipsisV,
  faTrash,
  faSignOutAlt,
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
} from '../services/messagingService';
import { MessageBubble, AttachmentHandler } from '../components/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const ConversationScreen = ({ navigation, route }) => {
  const { theme, fontSizes } = useTheme();
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
  const [currentUserId, setCurrentUserId] = useState(null);
  const [hasMarkedAsRead, setHasMarkedAsRead] = useState(false);
  const [isScreenActive, setIsScreenActive] = useState(true);

  const flatListRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const lastRefreshTime = useRef(0);

  // Safety check for fontSizes
  const safeFontSizes = fontSizes || {
    small: 12,
    medium: 16,
    large: 20,
  };

  const styles = createStyles(theme, safeFontSizes);

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
          Alert.alert('Error', 'Failed to load messages');
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
        Alert.alert('Error', 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) =>
        prev.filter((msg) => msg.message_id !== tempMessage.message_id)
      );
      Alert.alert('Error', 'Failed to send message');
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
  const renderMessageItem = ({ item }) => {
    return (
      <MessageBubble
        message={item}
        isOwnMessage={item.is_own_message}
        showSender={!item.is_own_message}
        onAttachmentPress={(url) => {
          // Handle attachment press - could open in browser or download
          console.log('Attachment pressed:', url);
        }}
        onMessagePress={(message) => {
          // Mark message as read locally if it's not the user's own message and it's unread
          if (
            currentUserId &&
            message.sender?.id !== currentUserId &&
            !message.is_read
          ) {
            markMessageAsReadHandler(message.message_id);
          }
          console.log('Message pressed:', message);
        }}
        onMessageLongPress={(message) => {
          // Handle message long press - show delete option for own messages
          if (message.is_own_message) {
            handleDeleteMessage(message.message_id);
          }
        }}
      />
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
          style={styles.optionsButton}
          onPress={() => setShowOptionsMenu(true)}
        >
          <FontAwesomeIcon
            icon={faEllipsisV}
            size={20}
            color={theme.colors.headerText}
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Messages List */}
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

        {/* Message Input */}
        <View
          style={[styles.inputContainer, { paddingBottom: 8, marginBottom: 0 }]}
        >
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder='Type a message...'
              placeholderTextColor={theme.colors.textSecondary}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={1000}
            />

            <TouchableOpacity
              style={styles.attachButton}
              onPress={() =>
                Alert.alert(
                  'Coming Soon',
                  'File attachments will be available soon'
                )
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
        </View>
      </KeyboardAvoidingView>

      {/* Options Menu Modal */}
      <Modal
        visible={showOptionsMenu}
        transparent={true}
        animationType='fade'
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsMenu(false)}
        >
          <View style={styles.optionsMenu}>
            <TouchableOpacity
              style={styles.optionItem}
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
                style={[styles.optionText, { color: theme.colors.warning }]}
              >
                Leave Conversation
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionItem}
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
              <Text style={[styles.optionText, { color: theme.colors.error }]}>
                Delete Conversation
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionItem, styles.cancelOption]}
              onPress={() => setShowOptionsMenu(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
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
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.headerBackground,
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
      color: theme.colors.headerText,
    },
    content: {
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
      color: theme.colors.textSecondary,
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
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 6,
    },
    senderName: {
      fontSize: safeFontSizes.small,
      color: theme.colors.textSecondary,
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
      lineHeight: 20,
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
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    optionsMenu: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      paddingVertical: 8,
      minWidth: 200,
      maxWidth: 280,
      marginHorizontal: 20,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    optionText: {
      fontSize: safeFontSizes.medium,
      marginLeft: 12,
      fontWeight: '500',
    },
    cancelOption: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      marginTop: 8,
      justifyContent: 'center',
    },
    cancelText: {
      fontSize: safeFontSizes.medium,
      color: theme.colors.text,
      fontWeight: '500',
    },
  });
};

export default ConversationScreen;
