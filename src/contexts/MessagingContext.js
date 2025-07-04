/**
 * Messaging Context
 * Manages global messaging state including unread counts and real-time updates
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUnreadConversationsCount } from '../services/messagingService';

const MessagingContext = createContext();

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};

export const MessagingProvider = ({ children }) => {
  const [unreadConversations, setUnreadConversations] = useState(0);
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

  // Get auth code from storage
  const getAuthCode = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        return user.authCode || user.auth_code;
      }
      return null;
    } catch (error) {
      console.error('Error getting auth code:', error);
      return null;
    }
  }, []);

  // Update unread counts
  const updateUnreadCounts = useCallback(async () => {
    try {
      const authCode = await getAuthCode();
      if (!authCode) {
        console.warn('No auth code found, skipping unread count update');
        return;
      }

      console.log('📊 MESSAGING: Updating unread counts...');
      const response = await getUnreadConversationsCount(authCode);

      if (response.success && response.data) {
        const { unread_conversations, total_unread_messages } = response.data;

        setUnreadConversations(unread_conversations || 0);
        setTotalUnreadMessages(total_unread_messages || 0);
        setLastUpdateTime(new Date().toISOString());

        console.log(
          `📊 MESSAGING: Updated counts - Conversations: ${unread_conversations}, Messages: ${total_unread_messages}`
        );
      } else {
        console.warn('Failed to get unread counts:', response.error);
      }
    } catch (error) {
      console.error('Error updating unread counts:', error);
    }
  }, [getAuthCode]);

  // Mark conversation as read locally (optimistic update)
  // This is called when user enters a conversation and unread messages are marked as read
  const markConversationAsReadLocally = useCallback((conversationUuid) => {
    console.log(
      `📖 MESSAGING: Marking conversation ${conversationUuid} as read locally (via individual message reads)`
    );
    setUnreadConversations((prev) => Math.max(0, prev - 1));
    // Note: totalUnreadMessages will be updated by individual markMessageAsReadLocally calls
    // The backend calculates unread_count based on last read time, so this will sync on next poll
  }, []);

  // Mark individual message as read locally (optimistic update)
  const markMessageAsReadLocally = useCallback(
    (messageId, conversationUuid) => {
      console.log(
        `📖 MESSAGING: Marking message ${messageId} in conversation ${conversationUuid} as read locally`
      );
      // Decrease total unread messages count by 1
      setTotalUnreadMessages((prev) => Math.max(0, prev - 1));
      // The next polling cycle will get the accurate count from the backend
    },
    []
  );

  // Force refresh unread counts
  const refreshUnreadCounts = useCallback(() => {
    console.log('🔄 MESSAGING: Force refreshing unread counts');
    updateUnreadCounts();
  }, [updateUnreadCounts]);

  // Refresh messaging data when app comes to foreground
  const refreshOnAppForeground = useCallback(() => {
    console.log(
      '📱 MESSAGING: App came to foreground, refreshing messaging data'
    );
    updateUnreadCounts();
  }, [updateUnreadCounts]);

  // Cleanup function for logout
  const cleanup = useCallback(() => {
    console.log('🧹 MESSAGING: Cleaning up messaging context...');
    setUnreadConversations(0);
    setTotalUnreadMessages(0);
    setLastUpdateTime(null);
    console.log('✅ MESSAGING: Messaging context cleaned up');
  }, []);

  // Initialize polling when component mounts and handle app state changes
  useEffect(() => {
    let interval;
    let isMounted = true;
    let appState = AppState.currentState;

    const startPolling = async () => {
      if (!isMounted) return;

      console.log('🔄 MESSAGING: Starting unread count polling');
      setIsPolling(true);

      // Initial update
      try {
        await updateUnreadCounts();
      } catch (error) {
        console.error('Error in initial unread count update:', error);
      }

      // Poll every 30 seconds (only when app is active)
      interval = setInterval(async () => {
        if (!isMounted || AppState.currentState !== 'active') {
          console.log('📱 MESSAGING: Skipping poll - app not active');
          return;
        }
        try {
          await updateUnreadCounts();
        } catch (error) {
          console.error('Error in polling unread count update:', error);
        }
      }, 30000);
    };

    const handleAppStateChange = (nextAppState) => {
      console.log(
        `📱 MESSAGING: App state changed from ${appState} to ${nextAppState}`
      );

      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - refresh counts immediately
        console.log(
          '📱 MESSAGING: App became active, refreshing unread counts'
        );
        refreshOnAppForeground();
      }

      appState = nextAppState;
    };

    // Start polling
    startPolling();

    // Listen for app state changes
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    return () => {
      console.log('⏹️ MESSAGING: Stopping unread count polling');
      isMounted = false;
      if (interval) {
        clearInterval(interval);
      }
      if (subscription) {
        subscription.remove();
      }
      setIsPolling(false);
    };
  }, []); // Empty dependency array to run only once

  // Stop polling
  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  // Start polling (for manual control)
  const startPolling = useCallback(async () => {
    if (!isPolling) {
      await updateUnreadCounts();
    }
  }, [isPolling, updateUnreadCounts]);

  const value = useMemo(
    () => ({
      // State
      unreadConversations,
      totalUnreadMessages,
      isPolling,
      lastUpdateTime,

      // Actions
      updateUnreadCounts,
      startPolling,
      stopPolling,
      markConversationAsReadLocally,
      markMessageAsReadLocally,
      refreshUnreadCounts,
      refreshOnAppForeground,
      cleanup,
    }),
    [
      unreadConversations,
      totalUnreadMessages,
      isPolling,
      lastUpdateTime,
      updateUnreadCounts,
      startPolling,
      stopPolling,
      markConversationAsReadLocally,
      markMessageAsReadLocally,
      refreshUnreadCounts,
      refreshOnAppForeground,
      cleanup,
    ]
  );

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
};

export default MessagingContext;
