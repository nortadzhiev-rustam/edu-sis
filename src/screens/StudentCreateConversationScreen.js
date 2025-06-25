import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faCheck,
  faUser,
  faSearch,
  faUsers,
  faChalkboardTeacher,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import {
  getAvailableUsersForStudent,
  createConversation,
} from '../services/messagingService';

const StudentCreateConversationScreen = ({ navigation, route }) => {
  const { theme, fontSizes } = useTheme();
  const { authCode, studentName } = route.params;

  const [topic, setTopic] = useState('');
  const [groupedUsers, setGroupedUsers] = useState({ staff: [], students: [] });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Safety check for fontSizes
  const safeFontSizes = fontSizes || {
    small: 12,
    medium: 16,
    large: 20,
  };

  const styles = createStyles(theme, safeFontSizes);

  // Fetch available users (restricted for students)
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAvailableUsersForStudent(null, authCode); // Get restricted users for students
      if (response.success && response.data) {
        // Handle new grouped users structure for students
        const fetchedGroupedUsers = response.data.grouped_users || [];

        // Convert array format to object format for compatibility
        const groupedUsersObj = {
          homeroom_teacher:
            fetchedGroupedUsers.find((g) => g.role === 'homeroom_teacher')
              ?.users || [],
          subject_teacher:
            fetchedGroupedUsers.find((g) => g.role === 'subject_teacher')
              ?.users || [],
          classmate:
            fetchedGroupedUsers.find((g) => g.role === 'classmate')?.users ||
            [],
        };
        console.log('Fetched grouped users:', groupedUsersObj);
        setGroupedUsers(groupedUsersObj);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load available users');
    } finally {
      setLoading(false);
    }
  }, [authCode]);

  // Filter users based on search query
  const filteredGroupedUsers = {
    staff: groupedUsers.staff.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    students: groupedUsers.students.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  };

  // Toggle user selection
  const toggleUserSelection = (user) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((u) => u.id === user.id);
      if (isSelected) {
        return prev.filter((u) => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  // Create conversation
  const handleCreateConversation = useCallback(async () => {
    if (!topic.trim()) {
      Alert.alert('Error', 'Please enter a conversation topic');
      return;
    }

    if (selectedUsers.length === 0) {
      Alert.alert('Error', 'Please select at least one teacher');
      return;
    }

    try {
      setCreating(true);
      const memberIds = selectedUsers.map((user) => user.id);
      const response = await createConversation(
        topic.trim(),
        memberIds,
        'student',
        authCode
      );

      if (response.success && response.data) {
        Alert.alert('Success', 'Conversation created successfully', [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('ConversationScreen', {
                conversationUuid: response.data.conversation_uuid,
                conversationTopic: topic.trim(),
                authCode,
                studentName,
                userType: 'student',
              });
            },
          },
        ]);
      } else {
        Alert.alert('Error', 'Failed to create conversation');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      Alert.alert('Error', 'Failed to create conversation');
    } finally {
      setCreating(false);
    }
  }, [topic, selectedUsers, authCode, studentName, navigation]);

  // Render user item
  const renderUserItem = ({ item }) => {
    const isSelected = selectedUsers.some((u) => u.id === item.id);

    return (
      <TouchableOpacity
        style={[styles.userItem, isSelected && styles.selectedUserItem]}
        onPress={() => toggleUserSelection(item)}
      >
        <View style={styles.userAvatar}>
          <FontAwesomeIcon
            icon={item.user_type === 'staff' ? faChalkboardTeacher : faUser}
            size={20}
            color={theme.colors.primary}
          />
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userType}>
            {item.user_type === 'staff' ? 'Teacher' : 'Student'}
            {item.email && ` • ${item.email}`}
          </Text>
        </View>

        {isSelected && (
          <View style={styles.checkIcon}>
            <FontAwesomeIcon
              icon={faCheck}
              size={16}
              color={theme.colors.primary}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Render selected users summary
  const renderSelectedSummary = () => {
    if (selectedUsers.length === 0) return null;

    // Count selected teachers and students
    const allUsers = [...groupedUsers.staff, ...groupedUsers.students];
    const selectedUserObjects = allUsers.filter((user) =>
      selectedUsers.includes(user.id)
    );
    const teacherCount = selectedUserObjects.filter(
      (user) => user.user_type === 'staff'
    ).length;
    const studentCount = selectedUserObjects.filter(
      (user) => user.user_type === 'student'
    ).length;

    let summaryText = '';
    if (teacherCount > 0 && studentCount > 0) {
      summaryText = `${teacherCount} teacher${
        teacherCount !== 1 ? 's' : ''
      }, ${studentCount} student${studentCount !== 1 ? 's' : ''} selected`;
    } else if (teacherCount > 0) {
      summaryText = `${teacherCount} teacher${
        teacherCount !== 1 ? 's' : ''
      } selected`;
    } else if (studentCount > 0) {
      summaryText = `${studentCount} student${
        studentCount !== 1 ? 's' : ''
      } selected`;
    }

    return (
      <View style={styles.selectedSummary}>
        <FontAwesomeIcon
          icon={faUsers}
          size={16}
          color={theme.colors.primary}
        />
        <Text style={styles.selectedText}>{summaryText}</Text>
      </View>
    );
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

        <Text style={styles.headerTitle}>New Conversation</Text>

        <TouchableOpacity
          style={[
            styles.createButton,
            (!topic.trim() || selectedUsers.length === 0 || creating) &&
              styles.createButtonDisabled,
          ]}
          onPress={handleCreateConversation}
          disabled={!topic.trim() || selectedUsers.length === 0 || creating}
        >
          {creating ? (
            <ActivityIndicator size='small' color={theme.colors.headerText} />
          ) : (
            <Text style={styles.createButtonText}>Create</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Topic Input */}
      <View style={styles.topicContainer}>
        <Text style={styles.topicLabel}>What would you like to discuss?</Text>
        <TextInput
          style={styles.topicInput}
          placeholder='e.g., Question about homework, Request for help...'
          placeholderTextColor={theme.colors.textSecondary}
          value={topic}
          onChangeText={setTopic}
          maxLength={100}
        />
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
            placeholder='Search users...'
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        {renderSelectedSummary()}
      </View>

      {/* Users List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : (
        <SectionList
          sections={[
            {
              title: 'Teachers',
              data: filteredGroupedUsers.staff,
              key: 'staff',
            },
            {
              title: 'Students',
              data: filteredGroupedUsers.students,
              key: 'students',
            },
          ].filter((section) => section.data.length > 0)} // Only show sections with data
          renderItem={renderUserItem}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{title}</Text>
            </View>
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <FontAwesomeIcon
                icon={faChalkboardTeacher}
                size={48}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.emptyStateText}>
                No users available to message
              </Text>
            </View>
          )}
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
    createButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    createButtonDisabled: {
      opacity: 0.5,
    },
    createButtonText: {
      fontSize: safeFontSizes.medium,
      fontWeight: '600',
      color: theme.colors.headerText,
    },
    topicContainer: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    topicLabel: {
      fontSize: safeFontSizes.medium,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    topicInput: {
      fontSize: safeFontSizes.medium,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
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
    selectedSummary: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      paddingHorizontal: 4,
    },
    selectedText: {
      marginLeft: 6,
      fontSize: safeFontSizes.small,
      color: theme.colors.primary,
      fontWeight: '500',
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
      paddingBottom: 16,
    },
    sectionHeader: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    sectionHeaderText: {
      fontSize: safeFontSizes.medium,
      fontWeight: '600',
      color: theme.colors.text,
    },
    userItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    selectedUserItem: {
      backgroundColor: theme.colors.primary + '10',
    },
    userAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: safeFontSizes.medium,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    userType: {
      fontSize: safeFontSizes.small,
      color: theme.colors.textSecondary,
    },
    checkIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 64,
    },
    emptyStateText: {
      fontSize: safeFontSizes.medium,
      color: theme.colors.textSecondary,
      marginTop: 16,
      textAlign: 'center',
    },
  });
};

export default StudentCreateConversationScreen;
