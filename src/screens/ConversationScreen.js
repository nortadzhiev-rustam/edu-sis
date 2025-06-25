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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import {
  getConversationMessages,
  sendMessage,
  markMessagesAsRead,
  deleteMessage,
  deleteConversation,
  leaveConversation,
} from '../services/messagingService';
import { MessageBubble, AttachmentHandler } from '../components/messaging';

const ConversationScreen = ({ navigation, route }) => {
  const { theme, fontSizes } = useTheme();
  const {
    conversationUuid,
    conversationTopic,
    teacherName,
    studentName,
    userType = 'teacher',
  } = route.params;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  const flatListRef = useRef(null);

  // Safety check for fontSizes
  const safeFontSizes = fontSizes || {
    small: 12,
    medium: 16,
    large: 20,
  };

  const styles = createStyles(theme, safeFontSizes);

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

  // Fetch messages
  const fetchMessages = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);

        const response = await getConversationMessages(
          conversationUuid,
          pageNum,
          50
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

          // Mark messages as read
          if (pageNum === 1) {
            await markMessagesAsRead(conversationUuid);
          }
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        Alert.alert('Error', 'Failed to load messages');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [conversationUuid]
  );

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

      const response = await sendMessage(conversationUuid, tempMessage.content);

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
          // Handle message press - could show details or copy text
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
                    conversationUuid
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
    [conversationUuid]
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
                const response = await leaveConversation(conversationUuid);
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
  }, [conversationUuid, navigation]);

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
                const response = await deleteConversation(conversationUuid);
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
  }, [conversationUuid, navigation]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
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
        <View style={styles.inputContainer}>
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
      backgroundColor: theme.colors.primary,
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
      paddingHorizontal: 16,
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
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
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
