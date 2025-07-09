/**
 * Example demonstrating smooth swipe gestures with @react-native-gesture-handler
 * This shows the improved ConversationItem with better scroll locking and smoother animations
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  SafeAreaView,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ConversationItem } from '../src/components/messaging';

const SmoothSwipeExample = () => {
  const flatListRef = useRef(null);

  // Sample conversation data
  const [conversations] = useState([
    {
      conversation_uuid: '1',
      topic: 'Math Homework Discussion',
      last_message: 'Please submit your assignments by tomorrow.',
      updated_at: new Date().toISOString(),
      unread_count: 3,
      members: [
        { id: 1, name: 'John Teacher', photo: null },
        { id: 2, name: 'Student A', photo: null },
        { id: 3, name: 'Student B', photo: null },
      ],
    },
    {
      conversation_uuid: '2',
      topic: 'Science Project Group',
      last_message: 'Great work on the presentation!',
      updated_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      unread_count: 0,
      members: [
        { id: 1, name: 'Science Teacher', photo: null },
        { id: 4, name: 'Student C', photo: null },
        { id: 5, name: 'Student D', photo: null },
        { id: 6, name: 'Student E', photo: null },
      ],
    },
    {
      conversation_uuid: '3',
      topic: 'Parent-Teacher Conference',
      last_message: 'Looking forward to meeting you next week.',
      updated_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      unread_count: 1,
      members: [
        { id: 7, name: 'Class Teacher', photo: null },
        { id: 8, name: 'Parent', photo: null },
      ],
    },
    {
      conversation_uuid: '4',
      topic: 'School Event Planning',
      last_message: 'The event is scheduled for next Friday.',
      updated_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      unread_count: 5,
      members: [
        { id: 9, name: 'Event Coordinator', photo: null },
        { id: 10, name: 'Volunteer 1', photo: null },
        { id: 11, name: 'Volunteer 2', photo: null },
      ],
    },
    {
      conversation_uuid: '5',
      topic: 'Library Book Club',
      last_message: 'Next book selection voting starts tomorrow.',
      updated_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      unread_count: 0,
      members: [
        { id: 12, name: 'Librarian', photo: null },
        { id: 13, name: 'Book Lover 1', photo: null },
        { id: 14, name: 'Book Lover 2', photo: null },
        { id: 15, name: 'Book Lover 3', photo: null },
      ],
    },
  ]);

  const handleConversationPress = (conversation) => {
    Alert.alert(
      'Conversation Selected',
      `You tapped on: ${conversation.topic}`,
      [{ text: 'OK' }]
    );
  };

  const handleDeleteConversation = (conversation) => {
    Alert.alert(
      'Delete Conversation',
      `Are you sure you want to delete "${conversation.topic}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Deleted', `"${conversation.topic}" has been deleted.`);
          },
        },
      ]
    );
  };

  const handleLeaveConversation = (conversation) => {
    Alert.alert(
      'Leave Conversation',
      `Are you sure you want to leave "${conversation.topic}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Left', `You have left "${conversation.topic}".`);
          },
        },
      ]
    );
  };

  const handleMarkAsRead = (conversation) => {
    Alert.alert(
      'Mark as Read',
      `"${conversation.topic}" has been marked as read.`,
      [{ text: 'OK' }]
    );
  };

  const renderConversationItem = ({ item }) => (
    <ConversationItem
      conversation={item}
      onPress={handleConversationPress}
      onDelete={handleDeleteConversation}
      onLeave={handleLeaveConversation}
      onMarkAsRead={handleMarkAsRead}
      showUnreadBadge={true}
      showMemberCount={true}
      scrollViewRef={flatListRef} // Pass the FlatList ref for scroll locking
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Smooth Swipe Gestures</Text>
      <Text style={styles.subtitle}>
        Try swiping left/right on conversation items
      </Text>
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>• Swipe left to reveal actions</Text>
        <Text style={styles.instructionText}>• Swipe right to mark as read (if unread)</Text>
        <Text style={styles.instructionText}>• Long swipe left for quick delete</Text>
        <Text style={styles.instructionText}>• Scroll is locked during swipe gestures</Text>
      </View>
    </View>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          ref={flatListRef}
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.conversation_uuid}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  safeArea: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 10,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  instructions: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  instructionText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
    lineHeight: 20,
  },
});

export default SmoothSwipeExample;
