import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUser, faUsers } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { processHtmlContent } from '../../utils/htmlUtils';

const ConversationItem = ({
  conversation,
  onPress,
  showUnreadBadge = true,
  showMemberCount = true,
}) => {
  const { theme, fontSizes } = useTheme();
  const styles = createStyles(theme, fontSizes);

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

  return (
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
                return `${memberCount} member${memberCount !== 1 ? 's' : ''}`;
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
