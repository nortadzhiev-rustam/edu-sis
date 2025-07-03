import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faUser,
  faDownload,
  faCheck,
  faCheckDouble,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { processHtmlContent } from '../../utils/htmlUtils';

const MessageBubble = ({
  message,
  isOwnMessage = false,
  showSender = true,
  onAttachmentPress,
  onMessagePress,
  onMessageLongPress,
}) => {
  const { theme, fontSizes } = useTheme();
  const styles = createStyles(theme, fontSizes);

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render read status indicator for own messages
  const renderReadStatus = () => {
    if (!isOwnMessage) return null; // Only show read status for own messages

    // Use the new is_read field if available, fallback to read_by array
    const isRead =
      message.is_read !== undefined
        ? message.is_read
        : message.read_by && message.read_by.length > 0;

    return (
      <View style={styles.readStatusContainer}>
        <FontAwesomeIcon
          icon={isRead ? faCheckDouble : faCheck}
          size={12}
          color={isRead ? theme.colors.success : theme.colors.textSecondary}
          style={styles.readStatusIcon}
        />
      </View>
    );
  };

  // Render attachment if present
  const renderAttachment = () => {
    if (!message.attachment_url) return null;

    const isImage = message.attachment_url.match(/\.(jpg|jpeg|png|gif)$/i);
    const isPdf = message.attachment_url.match(/\.pdf$/i);
    const isDoc = message.attachment_url.match(/\.(doc|docx)$/i);

    // Extract filename from URL if possible
    const getFileName = (url) => {
      try {
        const urlParts = url.split('/');
        return urlParts[urlParts.length - 1] || 'Attachment';
      } catch {
        return 'Attachment';
      }
    };

    return (
      <TouchableOpacity
        style={styles.attachmentContainer}
        onPress={() => onAttachmentPress?.(message.attachment_url)}
      >
        {isImage ? (
          <Image
            source={{ uri: message.attachment_url }}
            style={styles.attachmentImage}
            resizeMode='cover'
          />
        ) : (
          <View style={styles.fileAttachment}>
            <FontAwesomeIcon
              icon={faDownload}
              size={16}
              color={
                isOwnMessage ? theme.colors.headerText : theme.colors.primary
              }
            />
            <Text
              style={[
                styles.fileAttachmentText,
                isOwnMessage ? styles.ownFileText : styles.otherFileText,
              ]}
              numberOfLines={1}
            >
              {getFileName(message.attachment_url)}
            </Text>
            {(isPdf || isDoc) && (
              <Text
                style={[
                  styles.fileTypeText,
                  isOwnMessage ? styles.ownFileText : styles.otherFileText,
                ]}
              >
                {isPdf ? 'PDF' : 'DOC'}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.messageContainer,
        isOwnMessage
          ? styles.ownMessageContainer
          : styles.otherMessageContainer,
      ]}
      onPress={() => onMessagePress?.(message)}
      onLongPress={() => onMessageLongPress?.(message)}
      activeOpacity={0.8}
    >
      {!isOwnMessage && showSender && (
        <View style={styles.senderInfo}>
          <View style={styles.senderAvatar}>
            {message.sender?.photo ? (
              <Image
                source={{ uri: message.sender.photo }}
                style={styles.avatarImage}
                resizeMode='cover'
              />
            ) : (
              <FontAwesomeIcon
                icon={faUser}
                size={12}
                color={theme.colors.textSecondary}
              />
            )}
          </View>
          <Text style={styles.senderName}>{message.sender?.name}</Text>
        </View>
      )}

      <View
        style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
        ]}
      >
        {message.content && (
          <Text
            style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
            ]}
          >
            {processHtmlContent(message.content)}
          </Text>
        )}

        {renderAttachment()}

        <View style={styles.messageFooter}>
          <Text
            style={[
              styles.messageTime,
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
            ]}
          >
            {formatTimestamp(message.created_at)}
          </Text>
          {renderReadStatus()}
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
    messageContainer: {
      marginVertical: 4,
      paddingHorizontal: 16,
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
      overflow: 'hidden',
    },
    avatarImage: {
      width: 20,
      height: 20,
      borderRadius: 10,
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
      textAlign: 'right',
    },
    otherMessageTime: {
      color: theme.colors.textSecondary,
    },
    attachmentContainer: {
      marginTop: 8,
    },
    attachmentImage: {
      width: 200,
      height: 150,
      borderRadius: 8,
    },
    fileAttachment: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 8,
    },
    fileAttachmentText: {
      marginLeft: 8,
      fontSize: safeFontSizes.small,
      fontWeight: '500',
    },
    ownFileText: {
      color: theme.colors.headerText,
    },
    otherFileText: {
      color: theme.colors.primary,
    },
    fileTypeText: {
      marginLeft: 4,
      fontSize: safeFontSizes.small - 2,
      fontWeight: 'bold',
      opacity: 0.8,
    },
    messageFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    readStatusContainer: {
      marginLeft: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    readStatusIcon: {
      opacity: 0.8,
    },
  });
};

export default MessageBubble;
