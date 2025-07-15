import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faPlus,
  faSearch,
  faComments,
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
import { getResponsiveHeaderFontSize } from '../utils/commonStyles';

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
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  // Animation values for collapsible search bar
  const scrollY = useSharedValue(0);
  const searchBarHeight = useSharedValue(0);
  const lastScrollY = useRef(0);

  // Animated style for search bar
  const searchBarAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: searchBarHeight.value,
      opacity: interpolate(searchBarHeight.value, [0, 60], [0, 1], 'clamp'),
      paddingVertical: interpolate(
        searchBarHeight.value,
        [0, 60],
        [0, 8],
        'clamp'
      ),
      borderTopWidth: interpolate(
        searchBarHeight.value,
        [0, 60],
        [0, 1],
        'clamp'
      ),
    };
  });
  const flatListRef = useRef(null);

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
      scrollViewRef={flatListRef}
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
      {/* Header with Collapsible Search */}
      <View style={styles.headerContainer}>
        {/* Navigation Header */}
        <View
          style={[
            styles.navigationHeader,
            isSearchVisible && {
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
          </TouchableOpacity>

          <Text
            style={[
              styles.headerTitle,
              { fontSize: getResponsiveHeaderFontSize(3, 'Messages') },
            ]}
          >
            Messages
          </Text>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.searchToggleButton}
              onPress={() => {
                if (searchBarHeight.value === 0) {
                  searchBarHeight.value = withTiming(60, { duration: 300 });
                } else {
                  searchBarHeight.value = withTiming(0, { duration: 300 });
                  setSearchQuery('');
                }
                setIsSearchVisible(!isSearchVisible);
              }}
            >
              <FontAwesomeIcon icon={faSearch} size={18} color='#fff' />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() =>
                navigation.navigate('CreateConversationScreen', {
                  authCode,
                  teacherName,
                })
              }
            >
              <FontAwesomeIcon icon={faPlus} size={18} color='#fff' />
            </TouchableOpacity>
          </View>
        </View>

        {/* Collapsible Search Bar */}
        <Animated.View style={[styles.searchSection, searchBarAnimatedStyle]}>
          <View
            style={[
              styles.searchBar,
              searchQuery.length > 0 && styles.searchBarActive,
            ]}
          >
            <FontAwesomeIcon
              icon={faSearch}
              size={16}
              color={
                searchQuery.length > 0 ? '#fff' : 'rgba(255, 255, 255, 0.7)'
              }
            />
            <TextInput
              style={styles.searchInput}
              placeholder='Search conversations and messages...'
              placeholderTextColor='rgba(255, 255, 255, 0.7)'
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchLoading && <ActivityIndicator size='small' color='#fff' />}
            {searchResults?.conversations && (
              <View style={styles.searchResultsIndicator}>
                <Text style={styles.searchResultsText}>
                  {searchResults.conversations.length}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : (
        <Animated.FlatList
          ref={flatListRef}
          data={searchResults ? searchResults.conversations : conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.conversation_uuid}
          contentContainerStyle={styles.listContainer}
          scrollEventThrottle={16}
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
    // Header Container Styles
    headerContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 8,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,

      zIndex: 1,
    },
    navigationHeader: {
      backgroundColor: theme.colors.headerBackground,
      padding: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderRadius: 16,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      color: '#fff',
      fontSize: 20,
      fontWeight: 'bold',
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    searchToggleButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    addButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Collapsible Search Section
    searchSection: {
      backgroundColor: theme.colors.headerBackground,
      paddingHorizontal: 15,
      borderTopColor: 'rgba(255, 255, 255, 0.1)',
      overflow: 'hidden',
      borderBottomRightRadius: 16,
      borderBottomLeftRadius: 16,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    searchBarActive: {
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      borderColor: 'rgba(255, 255, 255, 0.4)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    searchInput: {
      flex: 1,
      marginLeft: 8,
      fontSize: safeFontSizes.medium,
      color: '#fff',
      placeholderTextColor: 'rgba(255, 255, 255, 0.7)',
    },
    searchResultsIndicator: {
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      borderRadius: 12,
      minWidth: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
    },
    searchResultsText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
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
