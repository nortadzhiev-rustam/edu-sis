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
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useMessaging } from '../contexts/MessagingContext';
import { getConversations, searchMessages } from '../services/messagingService';
import { ConversationItem } from '../components/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

const StudentMessagingScreen = ({ navigation, route }) => {
  const { theme, fontSizes } = useTheme();
  const { refreshUnreadCounts } = useMessaging();
  const { authCode, studentName } = route.params;

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
  const isStudentMember = (conversation, currentUser) => {
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
  };

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
      Alert.alert('Error', 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [getCurrentUserData, isStudentMember]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations();
    // Also refresh unread counts
    refreshUnreadCounts();
    setRefreshing(false);
  }, [fetchConversations, refreshUnreadCounts]);

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
        Alert.alert('Error', 'Failed to search messages');
      } finally {
        setSearchLoading(false);
      }
    },
    [getCurrentUserData, isStudentMember]
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
            navigation.navigate('StudentCreateConversationScreen', {
              authCode,
              studentName,
              userType: 'student',
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
          keyExtractor={(item, index) =>
            item.conversation_uuid ||
            item.id?.toString() ||
            `conversation-${index}`
          }
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
      backgroundColor: theme.colors.primary,
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

export default StudentMessagingScreen;
