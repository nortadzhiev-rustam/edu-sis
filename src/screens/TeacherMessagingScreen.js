import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faPlus,
  faSearch,
  faComments,
  faUser,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useMessaging } from '../contexts/MessagingContext';
import {
  getConversations,
  searchMessages,
  deleteConversation,
  leaveConversation,
  markConversationAsRead,
} from '../services/messagingService';
import { ConversationItem } from '../components/messaging';

const TeacherMessagingScreen = ({ navigation, route }) => {
  const { theme, fontSizes } = useTheme();
  const { t } = useLanguage();
  const { unreadConversations, totalUnreadMessages, refreshUnreadCounts } =
    useMessaging();
  const { authCode, teacherName } = route.params;

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Safety check for fontSizes
  const safeFontSizes = fontSizes || {
    small: 12,
    medium: 16,
    large: 20,
  };

  const styles = createStyles(theme, safeFontSizes);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getConversations(authCode);
      if (response.success && response.data) {
        setConversations(response.data.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      Alert.alert('Error', 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations();
    // Also refresh unread counts
    refreshUnreadCounts();
    setRefreshing(false);
  }, [fetchConversations, refreshUnreadCounts]);

  // Handle delete conversation
  const handleDeleteConversation = useCallback(
    async (conversation) => {
      try {
        const response = await deleteConversation(
          conversation.conversation_uuid,
          authCode
        );
        if (response.success) {
          // Remove from local state
          setConversations((prev) =>
            prev.filter(
              (conv) =>
                conv.conversation_uuid !== conversation.conversation_uuid
            )
          );
          // Refresh unread counts
          refreshUnreadCounts();
          Alert.alert('Success', 'Conversation deleted successfully');
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
    [authCode, refreshUnreadCounts]
  );

  // Handle leave conversation
  const handleLeaveConversation = useCallback(
    async (conversation) => {
      try {
        const response = await leaveConversation(
          conversation.conversation_uuid,
          authCode
        );
        if (response.success) {
          // Remove from local state
          setConversations((prev) =>
            prev.filter(
              (conv) =>
                conv.conversation_uuid !== conversation.conversation_uuid
            )
          );
          // Refresh unread counts
          refreshUnreadCounts();
          Alert.alert('Success', 'Left conversation successfully');
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
    [authCode, refreshUnreadCounts]
  );

  // Handle mark conversation as read
  const handleMarkAsRead = useCallback(
    async (conversation) => {
      try {
        const response = await markConversationAsRead(
          conversation.conversation_uuid,
          authCode
        );
        if (response.success) {
          // Update local state to mark as read
          setConversations((prev) =>
            prev.map((conv) =>
              conv.conversation_uuid === conversation.conversation_uuid
                ? { ...conv, unread_count: 0 }
                : conv
            )
          );
          // Refresh unread counts
          refreshUnreadCounts();
        }
      } catch (error) {
        console.error('Error marking conversation as read:', error);
        Alert.alert('Error', 'Failed to mark conversation as read');
      }
    },
    [authCode, refreshUnreadCounts]
  );

  // Handle search
  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await searchMessages(query, 'all', authCode);
      if (response.success && response.data) {
        setSearchResults(response.data);
      }
    } catch (error) {
      console.error('Error searching messages:', error);
      Alert.alert('Error', 'Failed to search messages');
    } finally {
      setSearchLoading(false);
    }
  }, []);

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

  // Render conversation item
  const renderConversationItem = ({ item }) => (
    <ConversationItem
      conversation={item}
      onPress={(conversation) =>
        navigation.navigate('ConversationScreen', {
          conversationUuid: conversation.conversation_uuid,
          conversationTopic: conversation.topic,
          authCode,
          teacherName,
        })
      }
      onDelete={handleDeleteConversation}
      onLeave={handleLeaveConversation}
      onMarkAsRead={handleMarkAsRead}
      showUnreadBadge={true}
      showMemberCount={true}
    />
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <FontAwesomeIcon
        icon={faComments}
        size={64}
        color={theme.colors.textSecondary}
      />
      <Text style={styles.emptyStateTitle}>No Conversations</Text>
      <Text style={styles.emptyStateText}>
        Start a new conversation by tapping the + button
      </Text>
    </View>
  );

  useEffect(() => {
    fetchConversations();
  }, []); // Only run once on mount

  // Listen for navigation events to refresh when returning from conversation
  const lastNavigationRefresh = React.useRef(0);
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const now = Date.now();
      // Debounce: only allow refresh every 1 second to prevent excessive calls
      if (now - lastNavigationRefresh.current < 1000) {
        console.log(
          '🔍 TEACHER MESSAGING: Skipping navigation refresh - too soon'
        );
        return;
      }

      lastNavigationRefresh.current = now;
      console.log(
        '🔍 TEACHER MESSAGING: Navigation focus - refreshing conversations'
      );
      // Force refresh conversations and unread counts when screen gains focus
      fetchConversations();
      refreshUnreadCounts();
    });

    return unsubscribe;
  }, [navigation, fetchConversations, refreshUnreadCounts]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      handleSearch(searchQuery);
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]); // Remove handleSearch from dependencies to prevent infinite loop

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

        <Text style={styles.headerTitle}>Messages</Text>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() =>
            navigation.navigate('CreateConversationScreen', {
              authCode,
              teacherName,
            })
          }
        >
          <FontAwesomeIcon
            icon={faPlus}
            size={20}
            color={theme.colors.headerText}
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <FontAwesomeIcon
            icon={faSearch}
            size={16}
            color={theme.colors.textSecondary}
          />
          <TextInput
            style={styles.searchInput}
            placeholder='Search conversations and messages...'
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchLoading && (
            <ActivityIndicator size='small' color={theme.colors.primary} />
          )}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : (
        <FlatList
          data={searchResults ? searchResults.conversations : conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.conversation_uuid}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
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
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.headerBackground,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: safeFontSizes.large,
      fontWeight: 'bold',
      color: theme.colors.headerText,
    },
    addButton: {
      padding: 8,
    },
    searchContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    searchInput: {
      flex: 1,
      marginLeft: 8,
      fontSize: safeFontSizes.medium,
      color: theme.colors.text,
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
    listContainer: {
      flexGrow: 1,
    },
    conversationItem: {
      flexDirection: 'row',
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    conversationIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
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
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyStateTitle: {
      fontSize: safeFontSizes.large,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateText: {
      fontSize: safeFontSizes.medium,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
  });
};

export default TeacherMessagingScreen;
