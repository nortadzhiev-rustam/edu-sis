import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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
  const [users, setUsers] = useState([]);
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
        // Use the flat users list for backward compatibility
        setUsers(response.data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter users based on search query
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
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
      Alert.alert('Error', 'Please enter a conversation topic');
      return;
    }

    if (selectedUsers.length === 0) {
      Alert.alert('Error', 'Please select at least one user');
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
        Alert.alert('Success', 'Conversation created successfully', [
          {
            text: 'OK',
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
        Alert.alert('Error', 'Failed to create conversation');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      Alert.alert('Error', 'Failed to create conversation');
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
          {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''}{' '}
          selected
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
          placeholder='Enter conversation topic...'
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
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
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
  });
};

export default CreateConversationScreen;
