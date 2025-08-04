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
  faSearch,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  getAvailableUsersForStaff,
  createConversation,
} from '../services/messagingService';
import { UserSelector } from '../components/messaging';

const CreateConversationScreen = ({ navigation, route }) => {
  const { theme, fontSizes } = useTheme();
  const { t } = useLanguage();
  const { authCode, teacherName } = route.params;

  const [topic, setTopic] = useState('');
  const [groupedUsers, setGroupedUsers] = useState([]);
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

  // Fetch available users for staff
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAvailableUsersForStaff();
      if (response.success && response.data) {
        // Use the grouped users structure
        const fetchedGroupedUsers = response.data.grouped_users || [];
        console.log('Fetched grouped users for staff:', fetchedGroupedUsers);
        setGroupedUsers(fetchedGroupedUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert(t('error'), t('failedToLoadUsers'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Process grouped users - check if head_of_school already exists in response
  const processGroupedUsers = (groups) => {
    // Check if head_of_school group already exists in the response
    const existingHeadOfSchoolGroup = groups.find(
      (group) => group.type === 'head_of_school'
    );

    if (existingHeadOfSchoolGroup) {
      // If head_of_school group already exists, check if we need to add more users from head_of_section
      const processedGroups = [];
      let headOfSchoolUsers = [...existingHeadOfSchoolGroup.users]; // Start with existing users

      groups.forEach((group) => {
        if (group.type === 'head_of_section') {
          // Extract additional Head of School users from head_of_section (principal/director)
          const additionalHeadOfSchool = group.users.filter(
            (user) =>
              user.email?.toLowerCase().includes('principal') ||
              user.email?.toLowerCase().includes('director')
          );

          // Add to head of school users if not already present
          additionalHeadOfSchool.forEach((user) => {
            if (
              !headOfSchoolUsers.some((existing) => existing.id === user.id)
            ) {
              headOfSchoolUsers.push(user);
            }
          });

          // Remaining Head of Section users (excluding those moved to head of school)
          const remainingHeadOfSection = group.users.filter(
            (user) =>
              !user.email?.toLowerCase().includes('principal') &&
              !user.email?.toLowerCase().includes('director')
          );

          // Add remaining Head of Section users if any
          if (remainingHeadOfSection.length > 0) {
            processedGroups.push({
              ...group,
              users: remainingHeadOfSection,
            });
          }
        } else if (group.type === 'head_of_school') {
          // Skip the original head_of_school group - we'll add the updated one later
          return;
        } else {
          // Keep other groups as is
          processedGroups.push(group);
        }
      });

      // Add the updated Head of School group at the beginning
      processedGroups.unshift({
        ...existingHeadOfSchoolGroup,
        users: headOfSchoolUsers,
        count: headOfSchoolUsers.length,
      });

      return processedGroups;
    }

    // Legacy processing for cases where API doesn't separate head_of_school
    const processedGroups = [];
    let headOfSchoolUsers = [];

    groups.forEach((group) => {
      if (group.type === 'head_of_section') {
        // Extract Head of School users (principal/director)
        const headOfSchool = group.users.filter(
          (user) =>
            user.email?.toLowerCase().includes('principal') ||
            user.email?.toLowerCase().includes('director')
        );

        // Remaining Head of Section users
        const remainingHeadOfSection = group.users.filter(
          (user) =>
            !user.email?.toLowerCase().includes('principal') &&
            !user.email?.toLowerCase().includes('director')
        );

        // Add Head of School users to separate array
        headOfSchoolUsers = headOfSchool;

        // Add remaining Head of Section users if any
        if (remainingHeadOfSection.length > 0) {
          processedGroups.push({
            ...group,
            users: remainingHeadOfSection,
          });
        }
      } else {
        // Keep other groups as is
        processedGroups.push(group);
      }
    });

    // Add Head of School group at the beginning if there are any users
    if (headOfSchoolUsers.length > 0) {
      processedGroups.unshift({
        type: 'head_of_school',
        type_label: 'Head of School',
        users: headOfSchoolUsers,
      });
    }

    return processedGroups;
  };

  // Filter users based on search query
  const filteredGroupedUsers = processGroupedUsers(groupedUsers).map(
    (group) => ({
      ...group,
      users: group.users.filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    })
  );

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
      Alert.alert(t('error'), t('pleaseEnterConversationTopic'));
      return;
    }

    if (selectedUsers.length === 0) {
      Alert.alert(t('error'), t('pleaseSelectAtLeastOneUser'));
      return;
    }

    try {
      setCreating(true);
      const memberIds = selectedUsers.map((user) => user.id);
      const response = await createConversation(
        topic.trim(),
        memberIds,
        'staff'
      );

      if (response.success && response.data) {
        Alert.alert(t('success'), t('conversationCreatedSuccessfully'), [
          {
            text: t('ok'),
            onPress: () => {
              navigation.navigate('ConversationScreen', {
                conversationUuid: response.data.conversation_uuid,
                conversationTopic: topic.trim(),
                authCode,
                teacherName,
              });
            },
          },
        ]);
      } else {
        Alert.alert(t('error'), t('failedToCreateConversation'));
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      Alert.alert(t('error'), t('failedToCreateConversation'));
    } finally {
      setCreating(false);
    }
  }, [topic, selectedUsers, authCode, teacherName, navigation]);

  // Render user item
  const renderUserItem = ({ item }) => {
    const isSelected = selectedUsers.some((u) => u.id === item.id);

    return (
      <UserSelector
        user={item}
        isSelected={isSelected}
        onPress={toggleUserSelection}
        showUserType={true}
        showEmail={true}
        disabled={false}
      />
    );
  };

  // Render selected users summary
  const renderSelectedSummary = () => {
    if (selectedUsers.length === 0) return null;

    return (
      <View style={styles.selectedSummary}>
        <FontAwesomeIcon
          icon={faUsers}
          size={16}
          color={theme.colors.primary}
        />
        <Text style={styles.selectedText}>
          {t('usersSelected').replace('{count}', selectedUsers.length)}
        </Text>
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
        <Text style={styles.topicLabel}>Conversation Topic</Text>
        <TextInput
          style={styles.topicInput}
          placeholder={t('enterConversationTopic')}
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
            placeholder={t('searchUsers')}
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
          <Text style={styles.loadingText}>{t('loadingUsers')}</Text>
        </View>
      ) : (
        <SectionList
          sections={filteredGroupedUsers
            .filter((group) => group.users.length > 0) // Only show groups with users
            .map((group) => ({
              title: group.type_label || group.type,
              data: group.users.map((user, index) => ({
                ...user,
                _sectionKey: `${group.type}-${user.id}-${index}`,
              })),
              key: group.type,
            }))}
          renderItem={renderUserItem}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{title}</Text>
            </View>
          )}
          keyExtractor={(item) => item._sectionKey}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <FontAwesomeIcon
                icon={faUsers}
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
      paddingHorizontal: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.headerBackground,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
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
      borderRadius: 20,
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
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
      marginBottom: 10,
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
      borderRadius: 16,
      overflow: 'hidden',
    },
    userItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      borderRadius: 12,
      overflow: 'hidden',
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

export default CreateConversationScreen;
