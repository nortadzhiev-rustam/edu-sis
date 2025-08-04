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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getResponsiveHeaderFontSize } from '../utils/commonStyles';

const StudentMessagingScreen = ({ navigation, route }) => {
  const { theme, fontSizes } = useTheme();
  const { t } = useLanguage();
  const { refreshUnreadCounts } = useMessaging();
  const { authCode, studentName } = route.params;

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Animation values for collapsible search bar
  const searchBarHeight = useSharedValue(0);

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

  // Helper function to get current user data
  const getCurrentUserData = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        return JSON.parse(userData);
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }, []);

  // Helper function to check if student is a member of the conversation
  const isStudentMember = useCallback(
    (conversation, currentUser) => {
      if (!conversation) {
        return false;
      }

      // Handle different conversation structures
      let membersToCheck = [];

      if (conversation.members && Array.isArray(conversation.members)) {
        // New API structure with flat members array
        membersToCheck = conversation.members;
      } else if (
        conversation.grouped_members &&
        Array.isArray(conversation.grouped_members)
      ) {
        // New API structure with grouped members
        conversation.grouped_members.forEach((group) => {
          if (group.members && Array.isArray(group.members)) {
            membersToCheck = membersToCheck.concat(group.members);
          }
        });
      } else if (
        conversation.members &&
        typeof conversation.members === 'object'
      ) {
        // Old API structure with grouped members object
        Object.values(conversation.members).forEach((memberGroup) => {
          if (Array.isArray(memberGroup)) {
            membersToCheck = membersToCheck.concat(memberGroup);
          }
        });
      }

      // If no members found, return false
      if (membersToCheck.length === 0) {
        return false;
      }

      // Check if current user is in the members array
      const isMember = membersToCheck.some((member) => {
        if (!member) return false;

        const matches = {
          currentUserId: currentUser && member.id === currentUser.id,
          currentUserStudentId:
            currentUser && member.id === currentUser.student_id,
          currentUserName: currentUser && member.name === currentUser.name,
          currentUserEmail: currentUser && member.email === currentUser.email,
          studentNameParam: member.name === studentName,
          studentTypeAndName:
            member.user_type === 'student' && member.name === studentName,
        };

        // Check various possible ID and name matches
        const isMatch =
          matches.currentUserId ||
          matches.currentUserStudentId ||
          matches.currentUserName ||
          matches.currentUserEmail ||
          matches.studentNameParam ||
          matches.studentTypeAndName;

        // Additional fallback: For testing purposes, if no exact match is found
        // and we have a student name parameter, match the first student in the conversation
        const isMockFallback =
          !isMatch &&
          !currentUser &&
          member.user_type === 'student' &&
          studentName &&
          membersToCheck
            .filter((m) => m.user_type === 'student')
            .indexOf(member) === 0;

        return isMatch || isMockFallback;
      });

      return isMember;
    },
    [studentName]
  );

  // Fetch conversations and filter for student
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📱 STUDENT MESSAGING: Using authCode:', authCode);
      const response = await getConversations(authCode);
      if (response.success && response.data) {
        const allConversations = response.data.conversations || [];

        // Get current user data to filter conversations
        const currentUser = await getCurrentUserData();

        // Since we're using the student's authCode, the API should return only relevant conversations
        // But we'll keep some filtering as a safety measure
        const studentConversations = allConversations
          .filter((conversation) => {
            // If we have user data, use strict filtering
            if (currentUser) {
              return isStudentMember(conversation, currentUser);
            }

            // Fallback: if no user data but we have a student name, include conversations with students
            // This helps with testing and edge cases
            if (studentName) {
              const hasStudents =
                conversation.members?.some((m) => m.user_type === 'student') ||
                conversation.grouped_members?.some(
                  (g) => g.type === 'student' && g.count > 0
                );
              return hasStudents;
            }

            // Default: include all conversations (since we're using student's authCode)
            return true;
          })
          .map((conversation, index) => ({
            ...conversation,
            // Ensure each conversation has a unique identifier
            conversation_uuid:
              conversation.conversation_uuid ||
              conversation.id ||
              `conv-${index}`,
          }));

        console.log(
          `📱 STUDENT MESSAGING: Using student authCode - Found ${allConversations.length} total conversations, ${studentConversations.length} for student`
        );

        setConversations(studentConversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      Alert.alert(t('error'), t('failedToLoadConversations'));
    } finally {
      setLoading(false);
    }
  }, [authCode, studentName]); // Removed function dependencies to prevent infinite loops

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
          Alert.alert(t('success'), t('conversationDeletedSuccess'));
        } else {
          Alert.alert(
            t('error'),
            response.error || t('failedToDeleteConversation')
          );
        }
      } catch (error) {
        console.error('Error deleting conversation:', error);
        Alert.alert(t('error'), t('failedToDeleteConversation'));
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
          Alert.alert(t('success'), t('leftConversationSuccess'));
        } else {
          Alert.alert(
            t('error'),
            response.error || t('failedToLeaveConversation')
          );
        }
      } catch (error) {
        console.error('Error leaving conversation:', error);
        Alert.alert(t('error'), t('failedToLeaveConversation'));
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
        Alert.alert(t('error'), t('failedToMarkAsRead'));
      }
    },
    [authCode, refreshUnreadCounts]
  );

  // Handle search and filter results for student
  const handleSearch = useCallback(
    async (query) => {
      if (!query.trim()) {
        setSearchResults(null);
        return;
      }

      try {
        setSearchLoading(true);
        const response = await searchMessages(query, 'all', authCode);
        if (response.success && response.data) {
          // Get current user data to filter search results
          const currentUser = await getCurrentUserData();

          // Filter search results to show only conversations where student is a member
          const originalConversations = response.data.conversations || [];
          const filteredConversations = originalConversations
            .filter((conversation) =>
              isStudentMember(conversation, currentUser)
            )
            .map((conversation, index) => ({
              ...conversation,
              // Ensure each conversation has a unique identifier
              conversation_uuid:
                conversation.conversation_uuid ||
                conversation.id ||
                `search-${index}`,
            }));

          console.log(
            `📱 STUDENT SEARCH: Found ${originalConversations.length} search results, ${filteredConversations.length} for student`
          );

          const filteredResults = {
            ...response.data,
            conversations: filteredConversations,
          };

          console.log('📱 SEARCH RESULTS:', filteredResults);
          console.log('📱 SEARCH CONVERSATIONS:', filteredConversations);

          setSearchResults(filteredResults);
        }
      } catch (error) {
        console.error('Error searching messages:', error);
        Alert.alert(t('error'), t('failedToSearchMessages'));
      } finally {
        setSearchLoading(false);
      }
    },
    [authCode, getCurrentUserData, isStudentMember]
  );

  // Render conversation item
  const renderConversationItem = ({ item }) => (
    <ConversationItem
      conversation={item}
      onPress={(conversation) =>
        navigation.navigate('ConversationScreen', {
          conversationUuid: conversation.conversation_uuid,
          conversationTopic: conversation.topic,
          authCode,
          studentName,
          userType: 'student',
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
      <Text style={styles.emptyStateTitle}>No Messages Yet</Text>
      <Text style={styles.emptyStateText}>
        You can start conversations with your teachers and classmates using the
        + button above
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
          '🔍 STUDENT MESSAGING: Skipping navigation refresh - too soon'
        );
        return;
      }

      lastNavigationRefresh.current = now;
      console.log(
        '🔍 STUDENT MESSAGING: Navigation focus - refreshing conversations'
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
      {/* Compact Header */}
      <View style={styles.compactHeaderContainer}>
        {/* Navigation Header */}
        <View style={styles.navigationHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <FontAwesomeIcon icon={faComments} size={18} color='#fff' />
            <Text
              style={[
                styles.headerTitle,
                { fontSize: getResponsiveHeaderFontSize(2, t('messages')) },
              ]}
            >
              Messages
            </Text>
          </View>

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
              }}
            >
              <FontAwesomeIcon icon={faSearch} size={18} color='#fff' />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() =>
                navigation.navigate('StudentCreateConversationScreen', {
                  authCode,
                  studentName,
                  userType: 'student',
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
              placeholder={t('searchConversationsMessages')}
              placeholderTextColor='rgba(255, 255, 255, 0.7)'
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchLoading && <ActivityIndicator size='small' color='#fff' />}
            {searchResults && searchResults.conversations && (
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
          <Text style={styles.loadingText}>{t('loadingConversations')}</Text>
        </View>
      ) : (
        <Animated.FlatList
          ref={flatListRef}
          data={searchResults ? searchResults.conversations : conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item, index) =>
            item.conversation_uuid ||
            item.id?.toString() ||
            `conversation-${index}`
          }
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
    // Compact Header Styles
    compactHeaderContainer: {
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
      overflow: 'hidden',
      zIndex: 1,
    },
    navigationHeader: {
      backgroundColor: theme.colors.headerBackground,
      padding: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    // Collapsible Search Section
    searchSection: {
      backgroundColor: theme.colors.headerBackground,
      paddingHorizontal: 15,
      borderTopColor: 'rgba(255, 255, 255, 0.1)',
      overflow: 'hidden',
    },
    headerCenter: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
    // Legacy header style (keeping for compatibility)
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.headerBackground,
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
      marginLeft: 8,
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
    headerActionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Legacy button styles (keeping for compatibility)
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
      shadowOpacity: 0.05,
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

export default StudentMessagingScreen;
